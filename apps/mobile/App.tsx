import { useEffect, useMemo, useState } from "react";
import { ActivityIndicator, SafeAreaView, StatusBar, Text, View } from "react-native";
import {
  createOrder,
  fallbackMenu,
  fallbackRestaurants,
  getCustomerOrders,
  getLanguages,
  getMenu,
  getRestaurant,
  getRestaurants,
  loginCustomer,
  logoutCustomer,
  registerCustomer,
  requestWaiter,
  supportedLanguages,
  type CustomerOrder,
  type CustomerSession,
  type CustomerUser,
  type MenuItem,
  type Restaurant
} from "./src/api";
import { getCopy, isRtlLanguage } from "./src/i18n";
import {
  AuthScreen,
  BasketScreen,
  DetailScreen,
  HomeScreen,
  LanguageScreen,
  MenuScreen,
  OrdersScreen,
  PaymentScreen,
  ProfileScreen,
  ScanScreen,
  ThanksScreen,
  WaiterScreen
} from "./src/screens";
import { colors } from "./src/theme";
import { completeOnboarding, getOnboardingState, persistLanguage } from "./src/storage";
import { styles } from "./src/styles";
import type { AuthMode, PaymentMode, Screen } from "./src/types";


export default function App() {
  const [screen, setScreen] = useState<Screen>("language");
  const [language, setLanguage] = useState("en");
  const [languages, setLanguages] = useState(supportedLanguages);
  const [restaurants, setRestaurants] = useState<Restaurant[]>(fallbackRestaurants);
  const [restaurant, setRestaurant] = useState<Restaurant>(fallbackRestaurants[0]!);
  const [tableNumber, setTableNumber] = useState("5");
  const [menu, setMenu] = useState<MenuItem[]>([]);
  const [orders, setOrders] = useState<CustomerOrder[]>([]);
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [session, setSession] = useState<CustomerSession | null>(null);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [returnAfterAuth, setReturnAfterAuth] = useState<Screen>("scan");
  const [name, setName] = useState("Amelia Evans");
  const [identifier, setIdentifier] = useState("customer@scanmenu.local");
  const [password, setPassword] = useState("password");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [removedIngredientIdsByItem, setRemovedIngredientIdsByItem] = useState<Record<string, string[]>>({});
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [paymentMode, setPaymentMode] = useState<PaymentMode>("cash");
  const [note, setNote] = useState("");
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");

  const t = getCopy(language);
  const rtl = isRtlLanguage(language);
  const cartItems = useMemo(() => menu.filter((item) => (cart[item.id] ?? 0) > 0), [cart, menu]);
  const total = useMemo(() => cartItems.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0), [cart, cartItems]);
  const filteredMenu = useMemo(() => {
    const value = search.trim().toLowerCase();
    if (!value) return menu;
    return menu.filter((item) => `${item.displayName} ${item.displayDescription}`.toLowerCase().includes(value));
  }, [menu, search]);
  const topItems = menu.slice(0, 3);

  useEffect(() => {
    void boot();
  }, []);

  useEffect(() => {
    void refreshRestaurantMenu(restaurant.id, language);
  }, [language, restaurant.id]);

  async function boot() {
    setLoading(true);
    try {
      const [onboarding, remoteLanguages, remoteRestaurants] = await Promise.all([
        getOnboardingState(),
        getLanguages(),
        getRestaurants()
      ]);
      const initialLanguage = onboarding.language || language;
      const nextRestaurants = remoteRestaurants.length ? remoteRestaurants : fallbackRestaurants;
      const firstRestaurant = nextRestaurants[0] ?? fallbackRestaurants[0]!;

      setLanguage(initialLanguage);
      setLanguages(remoteLanguages.length ? remoteLanguages : supportedLanguages);
      setRestaurants(nextRestaurants);
      setRestaurant(firstRestaurant);
      await refreshRestaurantMenu(firstRestaurant.id, initialLanguage);
      setScreen(onboarding.isDone ? "scan" : "language");
    } catch {
      setMessage(t.apiError);
      setMenu(fallbackMenu);
      setScreen("language");
    } finally {
      setLoading(false);
    }
  }

  async function refreshRestaurantMenu(restaurantId: string, nextLanguage = language) {
    const [nextRestaurant, nextMenu] = await Promise.all([getRestaurant(restaurantId), getMenu(restaurantId, nextLanguage)]);
    setRestaurant(nextRestaurant);
    setMenu(nextMenu);
  }

  async function refreshOrders(user = customer) {
    if (!user) return;
    const nextOrders = await getCustomerOrders(user.id, language);
    setOrders(nextOrders);
  }

  function completeLanguageOnboarding() {
    setScreen("scan");
    void completeOnboarding(language).catch(() => undefined);
  }

  function changeLanguage(nextLanguage: string) {
    setLanguage(nextLanguage);
    void persistLanguage(nextLanguage);
  }

  function goBack() {
    if (screen === "auth") setScreen(returnAfterAuth === "payment" ? "basket" : "scan");
    else if (screen === "scan") setScreen("language");
    else if (screen === "home") setScreen("scan");
    else if (screen === "menu") setScreen("home");
    else if (screen === "detail") setScreen("menu");
    else if (screen === "basket") setScreen("menu");
    else if (screen === "payment") setScreen("basket");
    else if (screen === "thanks") setScreen("orders");
    else if (screen === "orders" || screen === "profile" || screen === "waiter") setScreen("menu");
  }

  async function submitAuth() {
    if (authMode === "register" && !acceptedPolicies) {
      setMessage(t.consentRequired);
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      const result =
        authMode === "login"
          ? await loginCustomer({ identifier, password })
          : await registerCustomer({
              name,
              email: identifier,
              username: `${identifier.split("@")[0] || "customer"}-${Date.now()}`,
              password,
              preferredLanguage: language,
              termsAccepted: acceptedPolicies,
              privacyAccepted: acceptedPolicies,
              consentAt: new Date().toISOString()
            });
      setCustomer(result.user);
      setSession(result.session ?? null);
      setAcceptedPolicies(false);
      setScreen(returnAfterAuth);
      setReturnAfterAuth("scan");
      await refreshOrders(result.user);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.apiError);
    } finally {
      setBusy(false);
    }
  }

  async function scanDemoTable() {
    setBusy(true);
    setMessage("");
    try {
      const scannedRestaurantId = "rst_bistro_01";
      setTableNumber("5");
      await refreshRestaurantMenu(scannedRestaurantId, language);
      setScreen("home");
    } catch {
      setMessage(t.apiError);
    } finally {
      setBusy(false);
    }
  }

  function addToCart(itemId: string, quantity = 1) {
    setCart((current) => ({ ...current, [itemId]: Math.max((current[itemId] ?? 0) + quantity, 0) }));
  }

  async function payOrder() {
    if (!customer) {
      setReturnAfterAuth("payment");
      setAuthMode("register");
      setMessage(t.authRequired);
      setScreen("auth");
      return;
    }
    if (!cartItems.length) {
      setScreen("basket");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await createOrder({
        restaurantId: restaurant.id,
        customerId: customer.id,
        customerLanguage: language,
        restaurantLanguage: restaurant.operatingLanguage,
        cart,
        removedIngredientIdsByItem,
        note,
        tableNumber,
        paymentMethod: paymentMode === "online" ? "card" : "cash"
      });
      setCart({});
      setRemovedIngredientIdsByItem({});
      setNote("");
      await refreshOrders(customer);
      setScreen("thanks");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.apiError);
    } finally {
      setBusy(false);
    }
  }

  async function callWaiter() {
    if (!customer) {
      setReturnAfterAuth("home");
      setAuthMode("register");
      setMessage(t.authRequired);
      setScreen("auth");
      return;
    }

    setBusy(true);
    setMessage("");
    try {
      await requestWaiter({
        restaurantId: restaurant.id,
        customerId: customer.id,
        customerLanguage: language,
        restaurantLanguage: restaurant.operatingLanguage,
        tableNumber
      });
      await refreshOrders(customer);
      setScreen("waiter");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : t.apiError);
    } finally {
      setBusy(false);
    }
  }

  async function logout() {
    setBusy(true);
    await logoutCustomer(session?.id).catch(() => undefined);
    setCustomer(null);
    setSession(null);
    setCart({});
    setOrders([]);
    setScreen("scan");
    setBusy(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.safe}>
        <StatusBar barStyle="light-content" />
        <View style={styles.centered}>
          <ActivityIndicator color={colors.accent} size="large" />
          <Text style={styles.loadingText}>{t.loading}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      <View style={[styles.appFrame, rtl && styles.rtl]}>
        {screen === "language" ? (
          <LanguageScreen
            languages={languages}
            language={language}
            onLanguage={changeLanguage}
            onContinue={completeLanguageOnboarding}
            t={t}
          />
        ) : null}
        {screen === "auth" ? (
          <AuthScreen
            mode={authMode}
            name={name}
            identifier={identifier}
            password={password}
            acceptedPolicies={acceptedPolicies}
            busy={busy}
            message={message}
            t={t}
            onMode={setAuthMode}
            onName={setName}
            onIdentifier={setIdentifier}
            onPassword={setPassword}
            onAcceptedPolicies={setAcceptedPolicies}
            onSubmit={submitAuth}
            onBack={goBack}
          />
        ) : null}
        {screen === "scan" ? (
          <ScanScreen language={language} languages={languages} t={t} busy={busy} message={message} onLanguage={changeLanguage} onScan={scanDemoTable} onBack={goBack} />
        ) : null}
        {screen === "home" ? (
          <HomeScreen t={t} language={language} restaurant={restaurant} tableNumber={tableNumber} onMenu={() => setScreen("menu")} onWaiter={callWaiter} onProfile={() => setScreen("profile")} />
        ) : null}
        {screen === "menu" ? (
          <MenuScreen
            t={t}
            language={language}
            restaurant={restaurant}
            restaurants={restaurants}
            selectedRestaurantId={restaurant.id}
            menu={filteredMenu}
            topItems={topItems}
            cartCount={cartItems.length}
            search={search}
            onSearch={setSearch}
            onSelectRestaurant={(id) => void refreshRestaurantMenu(id, language)}
            onBack={goBack}
            onOpenBasket={() => setScreen("basket")}
            onOpenOrders={() => {
              void refreshOrders();
              setScreen("orders");
            }}
            onOpenProfile={() => setScreen("profile")}
            onOpenWaiter={callWaiter}
            onOpenItem={(item) => {
              setSelectedItem(item);
              setScreen("detail");
            }}
            onAdd={(id) => addToCart(id)}
          />
        ) : null}
        {screen === "detail" && selectedItem ? (
          <DetailScreen
            t={t}
            language={language}
            item={selectedItem}
            quantity={cart[selectedItem.id] ?? 1}
            removedIngredientIds={removedIngredientIdsByItem[selectedItem.id] ?? []}
            onToggleIngredient={(ingredientId) =>
              setRemovedIngredientIdsByItem((current) => {
                const removed = current[selectedItem.id] ?? [];
                return {
                  ...current,
                  [selectedItem.id]: removed.includes(ingredientId)
                    ? removed.filter((id) => id !== ingredientId)
                    : [...removed, ingredientId]
                };
              })
            }
            onBack={goBack}
            onBasket={() => setScreen("basket")}
            onAdd={() => addToCart(selectedItem.id)}
            onInc={() => addToCart(selectedItem.id)}
            onDec={() => addToCart(selectedItem.id, -1)}
          />
        ) : null}
        {screen === "basket" ? (
          <BasketScreen
            t={t}
            language={language}
            items={cartItems}
            cart={cart}
            total={total}
            note={note}
            onNote={setNote}
            onBack={goBack}
            onCheckout={() => {
              if (!customer) {
                setReturnAfterAuth("payment");
                setAuthMode("register");
                setMessage(t.authRequired);
                setScreen("auth");
                return;
              }
              setScreen("payment");
            }}
            onInc={(id) => addToCart(id)}
            onDec={(id) => addToCart(id, -1)}
          />
        ) : null}
        {screen === "payment" ? (
          <PaymentScreen t={t} language={language} mode={paymentMode} total={total} busy={busy} message={message} items={cartItems} cart={cart} onMode={setPaymentMode} onBack={goBack} onPay={payOrder} />
        ) : null}
        {screen === "thanks" ? <ThanksScreen t={t} onDone={() => setScreen("orders")} /> : null}
        {screen === "orders" ? <OrdersScreen t={t} language={language} orders={orders} onBack={goBack} onRefresh={() => void refreshOrders()} /> : null}
        {screen === "profile" ? (
          <ProfileScreen
            t={t}
            language={language}
            languages={languages}
            customer={customer}
            restaurant={restaurant}
            tableNumber={tableNumber}
            busy={busy}
            onLanguage={changeLanguage}
            onBack={goBack}
            onOrders={() => {
              void refreshOrders();
              setScreen("orders");
            }}
            onLogout={logout}
          />
        ) : null}
        {screen === "waiter" ? <WaiterScreen t={t} onBack={goBack} /> : null}
      </View>
    </SafeAreaView>
  );
}
