import { useMemo, useState } from "react";
import {
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
  type ImageSourcePropType
} from "react-native";
import { createOrder, fallbackRestaurants, loginCustomer, registerCustomer, type CustomerUser } from "./src/api";

type Screen =
  | "signin"
  | "createPassword"
  | "verifyEmpty"
  | "verifyFilled"
  | "created"
  | "scan"
  | "home"
  | "menu"
  | "detailPizza"
  | "detailIceCream"
  | "basket"
  | "paymentCash"
  | "paymentVisa"
  | "paymentMastercard"
  | "thanks"
  | "favorite"
  | "orders"
  | "profile"
  | "changePassword"
  | "waiter";

interface FoodItem {
  id: string;
  name: string;
  description: string;
  ingredients: string;
  price: number;
  calories: number;
  category: string;
  image: ImageSourcePropType;
}

const restaurant = fallbackRestaurants[0]!;
const accent = "#f6a637";
const bg = "#143328";
const card = "#30473f";
const muted = "#a1aaa6";

const images = {
  pizza: { uri: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?auto=format&fit=crop&w=500&q=80" },
  ice: { uri: "https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=500&q=80" },
  soup: { uri: "https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=500&q=80" },
  cheesecake: { uri: "https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=500&q=80" },
  panna: { uri: "https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&w=500&q=80" },
  smoothie: { uri: "https://images.unsplash.com/photo-1505252585461-04db1eb84625?auto=format&fit=crop&w=500&q=80" },
  profile: { uri: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=300&q=80" },
  pear: { uri: "https://images.unsplash.com/photo-1514756331096-242fdeb70d4a?auto=format&fit=crop&w=200&q=80" },
  pepper: { uri: "https://images.unsplash.com/photo-1525607551316-4a8e16d1f9ba?auto=format&fit=crop&w=200&q=80" },
  cheese: { uri: "https://images.unsplash.com/photo-1452195100486-9cc805987862?auto=format&fit=crop&w=200&q=80" },
  garlic: { uri: "https://images.unsplash.com/photo-1615477550927-6ecb9a0f0b76?auto=format&fit=crop&w=200&q=80" },
  mushroom: { uri: "https://images.unsplash.com/photo-1504545102780-26774c1bb073?auto=format&fit=crop&w=200&q=80" },
  salami: { uri: "https://images.unsplash.com/photo-1604908812863-51abf16f5a53?auto=format&fit=crop&w=200&q=80" },
  tomato: { uri: "https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&w=200&q=80" },
  qr: { uri: "https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=menuza://customer?restaurantId=rst_bistro_01%26table=5" }
};

const foods: FoodItem[] = [
  {
    id: "pepperoni",
    name: "Pepperoni",
    description: "Tomatoes, onions, garlic, oil, pepper, basil, oregano",
    ingredients: "Tomatoes, onions, garlic, oil, pepper, basil, oregano",
    price: 4,
    calories: 407,
    category: "Pizza",
    image: images.pizza
  },
  {
    id: "ice",
    name: "Chocolate ice cream",
    description: "Chocolate ice cream with coffee",
    ingredients: "milk, cream, butter, milk powder, sugar",
    price: 4,
    calories: 407,
    category: "Deserts",
    image: images.ice
  },
  {
    id: "soup",
    name: "Mushroom soup",
    description: "Onions, carrot, potatoes, oil, pepper, dill, mushrooms",
    ingredients: "onions, carrot, potatoes, oil, pepper, dill, mushrooms",
    price: 3,
    calories: 220,
    category: "Hot dishes",
    image: images.soup
  },
  {
    id: "cheese",
    name: "Cheese dessert",
    description: "Soft cheese dessert",
    ingredients: "cream cheese, berries, sugar",
    price: 4,
    calories: 330,
    category: "Deserts",
    image: images.cheesecake
  },
  {
    id: "panna",
    name: "Panna Cotta",
    description: "Delicate creamy dessert with flavor",
    ingredients: "cream, vanilla, berries",
    price: 3,
    calories: 260,
    category: "Deserts",
    image: images.panna
  },
  {
    id: "smoothie",
    name: "Smootie Bowl",
    description: "Chocolate ice cream with coffee",
    ingredients: "berries, yoghurt, banana",
    price: 4,
    calories: 310,
    category: "Cold drinks",
    image: images.smoothie
  }
];

const ingredients = [
  ["Pear", images.pear],
  ["Bell pepper", images.pepper],
  ["Blue cheese", images.cheese],
  ["Garlic", images.garlic],
  ["Champignon", images.mushroom],
  ["Salami", images.salami],
  ["Tomatoes", images.tomato]
] as Array<[string, ImageSourcePropType]>;

export default function App() {
  const [screen, setScreen] = useState<Screen>("signin");
  const [language, setLanguage] = useState("English");
  const [email, setEmail] = useState("yevyev@gmail.com");
  const [password, setPassword] = useState("Fhnhl3467dfg");
  const [confirmPassword, setConfirmPassword] = useState("Fhnhl3467dfg");
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [status, setStatus] = useState("");
  const [cart, setCart] = useState<Record<string, number>>({ ice: 1, pepperoni: 1 });
  const [paymentMode, setPaymentMode] = useState<"cash" | "online">("cash");

  const cartItems = useMemo(
    () => foods.filter((item) => (cart[item.id] ?? 0) > 0),
    [cart]
  );
  const total = cartItems.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0);

  function goBack() {
    const fallback: Screen = customer ? "menu" : "signin";
    const backMap: Partial<Record<Screen, Screen>> = {
      createPassword: "signin",
      verifyEmpty: "signin",
      verifyFilled: "verifyEmpty",
      created: "signin",
      scan: "signin",
      home: "menu",
      detailPizza: "menu",
      detailIceCream: "menu",
      basket: "menu",
      paymentCash: "basket",
      paymentVisa: "basket",
      paymentMastercard: "paymentVisa",
      thanks: "paymentCash",
      favorite: "menu",
      orders: "menu",
      profile: "menu",
      changePassword: "profile",
      waiter: "home"
    };
    setScreen(backMap[screen] ?? fallback);
  }

  async function signIn() {
    try {
      const user = await loginCustomer({ identifier: email, password });
      setCustomer(user);
      setScreen("scan");
    } catch {
      setCustomer({ id: "usr_customer_demo", name: "Amelia Evans", email });
      setScreen("scan");
    }
  }

  async function createAccount() {
    try {
      const user = await registerCustomer({
        name: "Amelia Evans",
        email,
        username: `${email.split("@")[0] || "customer"}-${Date.now()}`,
        preferredLanguage: "en"
      });
      setCustomer(user);
    } catch {
      setCustomer({ id: "usr_customer_demo", name: "Amelia Evans", email });
    }
    setScreen("created");
  }

  async function payOrder() {
    if (!customer) {
      setScreen("signin");
      return;
    }

    setStatus("Sending order...");
    try {
      await createOrder({
        restaurantId: restaurant.id,
        customerId: customer.id,
        customerLanguage: "en",
        restaurantLanguage: restaurant.operatingLanguage,
        cart,
        note: "table 5"
      });
    } catch {
      // Demo mode keeps the UX moving even if services are not running.
    }
    setStatus("");
    setScreen("thanks");
  }

  function addToCart(id: string) {
    setCart((current) => ({ ...current, [id]: (current[id] ?? 0) + 1 }));
  }

  function decrement(id: string) {
    setCart((current) => ({ ...current, [id]: Math.max((current[id] ?? 0) - 1, 0) }));
  }

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" />
      {screen === "signin" ? (
        <AuthScreen
          email={email}
          password={password}
          setEmail={setEmail}
          setPassword={setPassword}
          onSignIn={signIn}
          onSignUp={() => setScreen("createPassword")}
          onForgot={() => setScreen("verifyEmpty")}
        />
      ) : null}

      {screen === "createPassword" ? (
        <PasswordScreen
          title="Create password"
          subtitle="Enter your secure password"
          password={password}
          confirmPassword={confirmPassword}
          setPassword={setPassword}
          setConfirmPassword={setConfirmPassword}
          button="Create"
          onBack={goBack}
          onSubmit={createAccount}
        />
      ) : null}

      {screen === "changePassword" ? (
        <PasswordScreen
          title="Change password"
          subtitle=""
          password={password}
          confirmPassword={confirmPassword}
          setPassword={setPassword}
          setConfirmPassword={setConfirmPassword}
          button="Change"
          changeMode
          onBack={goBack}
          onSubmit={() => setScreen("profile")}
        />
      ) : null}

      {screen === "verifyEmpty" || screen === "verifyFilled" ? (
        <VerifyScreen filled={screen === "verifyFilled"} onBack={goBack} onVerify={() => setScreen("signin")} onFill={() => setScreen("verifyFilled")} />
      ) : null}

      {screen === "created" ? <SuccessCreateScreen onLogin={() => setScreen("signin")} /> : null}
      {screen === "scan" ? <ScanScreen language={language} setLanguage={setLanguage} onScan={() => setScreen("home")} /> : null}
      {screen === "home" ? <HomeScreen language={language} onMenu={() => setScreen("menu")} onWaiter={() => setScreen("waiter")} /> : null}
      {screen === "waiter" ? <WaiterScreen onBack={goBack} /> : null}
      {screen === "menu" ? <MenuScreen language={language} onBack={goBack} onOpenBasket={() => setScreen("basket")} onOpenFavorite={() => setScreen("favorite")} onOpenProfile={() => setScreen("profile")} onOpenWaiter={() => setScreen("home")} onOpenOrders={() => setScreen("orders")} onFood={(id) => setScreen(id === "pepperoni" ? "detailPizza" : "detailIceCream")} onAdd={addToCart} /> : null}
      {screen === "detailPizza" ? <DetailScreen item={foods[0]!} language={language} onBack={goBack} onBasket={() => setScreen("basket")} onAdd={() => addToCart("pepperoni")} showRemove /> : null}
      {screen === "detailIceCream" ? <DetailScreen item={foods[1]!} language={language} onBack={goBack} onBasket={() => setScreen("basket")} onAdd={() => addToCart("ice")} /> : null}
      {screen === "basket" ? <BasketScreen items={cartItems} cart={cart} total={total} language={language} onBack={goBack} onCheckout={() => setScreen("paymentCash")} onInc={addToCart} onDec={decrement} /> : null}
      {screen === "paymentCash" || screen === "paymentVisa" || screen === "paymentMastercard" ? (
        <PaymentScreen
          items={cartItems}
          cart={cart}
          total={total}
          language={language}
          mode={paymentMode}
          variant={screen}
          status={status}
          onBack={goBack}
          onMode={setPaymentMode}
          onVariant={setScreen}
          onPay={payOrder}
        />
      ) : null}
      {screen === "thanks" ? <ThanksScreen items={cartItems} cart={cart} total={total} onDone={() => setScreen("orders")} /> : null}
      {screen === "favorite" ? <FavoriteScreen language={language} cart={cart} onBack={goBack} onBasket={() => setScreen("basket")} onInc={addToCart} onDec={decrement} /> : null}
      {screen === "orders" ? <OrdersScreen language={language} onBack={goBack} /> : null}
      {screen === "profile" ? <ProfileScreen onBack={goBack} onChangePassword={() => setScreen("changePassword")} onFavorite={() => setScreen("favorite")} onLogout={() => { setCustomer(null); setScreen("signin"); }} /> : null}
    </SafeAreaView>
  );
}

function TopBar({ title, language, onBack }: { title?: string; language?: string; onBack?: () => void }) {
  return (
    <View style={styles.top}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : <View style={styles.backButton} />}
      {title ? <Text style={styles.screenTitle}>{title}</Text> : <View />}
      {language ? <Text style={styles.language}>{language} 🇬🇧</Text> : <View style={styles.langSpace} />}
    </View>
  );
}

function BottomTabs({ active, onProfile, onMenu, onFavorite, onWaiter }: { active: string; onProfile?: () => void; onMenu?: () => void; onFavorite?: () => void; onWaiter?: () => void }) {
  const tabs = [
    ["profile", "👤", "Профиль", onProfile],
    ["menu", "▤", "Menu", onMenu],
    ["favorite", "★", "Избранное", onFavorite],
    ["waiter", "🍽", "waiter", onWaiter]
  ] as const;

  return (
    <View style={styles.bottomNav}>
      {tabs.map(([id, icon, label, onPress]) => (
        <Pressable key={id} onPress={onPress} style={styles.tab}>
          <Text style={[styles.tabIcon, active === id && styles.tabActive]}>{icon}</Text>
          <Text style={[styles.tabLabel, active === id && styles.tabActive]}>{label}</Text>
        </Pressable>
      ))}
    </View>
  );
}

function AuthScreen(props: {
  email: string;
  password: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onSignIn: () => void;
  onSignUp: () => void;
  onForgot: () => void;
}) {
  return (
    <View style={styles.authContainer}>
      <View style={styles.spinner} />
      <Text style={styles.authTitle}>Sign in</Text>
      <Text style={styles.authSub}>Access to your account</Text>
      <TextInput autoCapitalize="none" value={props.email} onChangeText={props.setEmail} placeholder="Email or Phone" placeholderTextColor="#63756d" style={styles.lineInput} />
      <TextInput value={props.password} onChangeText={props.setPassword} placeholder="Password" placeholderTextColor="#63756d" secureTextEntry style={styles.lineInput} />
      <View style={styles.rememberRow}>
        <View style={styles.checkbox} />
        <Text style={styles.rememberText}>Remember me</Text>
      </View>
      <OrangeButton label="Sign in" onPress={props.onSignIn} />
      <Pressable onPress={props.onForgot}>
        <Text style={styles.link}>Forgot Password?</Text>
      </Pressable>
      <View style={styles.dividerRow}><View style={styles.divider} /><Text style={styles.muted}>or sign in with</Text><View style={styles.divider} /></View>
      <View style={styles.socialRow}><Text style={styles.google}>G</Text><Text style={styles.twitter}>●</Text><Text style={styles.facebook}>f</Text></View>
      <Text style={styles.signupText}>Don’t have a account? <Text onPress={props.onSignUp} style={styles.linkInline}>Sign Up</Text></Text>
    </View>
  );
}

function PasswordScreen(props: {
  title: string;
  subtitle: string;
  password: string;
  confirmPassword: string;
  setPassword: (value: string) => void;
  setConfirmPassword: (value: string) => void;
  button: string;
  changeMode?: boolean;
  onBack: () => void;
  onSubmit: () => void;
}) {
  return (
    <View style={styles.screenPad}>
      <TopBar onBack={props.onBack} />
      <View style={styles.lockCircle}><Text style={styles.lockIcon}>▣</Text></View>
      <Text style={styles.centerTitle}>{props.title}</Text>
      {props.subtitle ? <Text style={styles.authSub}>{props.subtitle}</Text> : null}
      {props.changeMode ? <Text style={styles.inputLabel}>OLD PASSWORD:</Text> : null}
      <TextInput value={props.password} onChangeText={props.setPassword} placeholder="Password" placeholderTextColor="#63756d" style={styles.lineInput} />
      {props.changeMode ? <Text style={styles.inputLabel}>NEW PASSWORD:</Text> : null}
      <TextInput value={props.confirmPassword} onChangeText={props.setConfirmPassword} placeholder="Confirm password" placeholderTextColor="#63756d" style={styles.lineInput} />
      {props.changeMode ? <Text style={styles.inputLabel}>CONFIRM NEW PASSWORD:</Text> : null}
      {props.changeMode ? <TextInput value={props.password} onChangeText={props.setPassword} style={styles.lineInput} /> : null}
      <Text style={styles.passwordHint}>* Password must at lease 8 characters</Text>
      <View style={styles.bottomButtonSlot}><OrangeButton label={props.button} onPress={props.onSubmit} disabled={!props.password || !props.confirmPassword} /></View>
    </View>
  );
}

function VerifyScreen({ filled, onBack, onVerify, onFill }: { filled: boolean; onBack: () => void; onVerify: () => void; onFill: () => void }) {
  const values = filled ? ["3", "2", "0", "5"] : ["_", "_", "_", "_"];
  return (
    <View style={styles.screenPad}>
      <TopBar onBack={onBack} />
      <View style={styles.verifyBody}>
        <Text style={styles.centerTitle}>Verify Code</Text>
        <Text style={styles.authSub}>Check code in your SMS or Email</Text>
        <Pressable onPress={onFill} style={styles.codeRow}>
          {values.map((value, index) => <Text key={`${value}-${index}`} style={styles.codeBox}>{value}</Text>)}
        </Pressable>
        <Text style={styles.signupText}>Don’t receive code? <Text style={styles.linkInline}>Sent again</Text></Text>
        <OrangeButton label="Verify" onPress={onVerify} disabled={!filled} />
      </View>
    </View>
  );
}

function SuccessCreateScreen({ onLogin }: { onLogin: () => void }) {
  return (
    <View style={styles.screenPad}>
      <View style={styles.successBody}>
        <View style={styles.successCircle}><Text style={styles.successCheck}>✓</Text></View>
        <Text style={styles.successText}>You have successfully{"\n"}create account</Text>
      </View>
      <View style={styles.bottomButtonSlot}><OrangeButton label="Login" onPress={onLogin} /></View>
    </View>
  );
}

function ScanScreen({ language, setLanguage, onScan }: { language: string; setLanguage: (value: string) => void; onScan: () => void }) {
  return (
    <View style={styles.screenPad}>
      <Pressable onPress={() => setLanguage(language === "English" ? "Arabic" : "English")} style={styles.languageTop}>
        <Text style={styles.language}>{language} 🇬🇧</Text>
      </Pressable>
      <Text style={styles.scanTitle}>Scanning...</Text>
      <View style={styles.qrCard}><Image source={images.qr} style={styles.qrImage} /></View>
      <View style={styles.bottomButtonSlot}><OrangeButton label="Scan" onPress={onScan} /></View>
    </View>
  );
}

function HomeScreen({ language, onMenu, onWaiter }: { language: string; onMenu: () => void; onWaiter: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <View style={styles.languageTop}><Text style={styles.language}>{language} 🇬🇧</Text></View>
      <Text style={styles.logoText}>logo</Text>
      <View style={styles.homeActions}>
        <BigArrowButton label="Waiter" onPress={onWaiter} />
        <BigArrowButton label="Application" onPress={onMenu} />
      </View>
      <BottomTabs active="waiter" onMenu={onMenu} onWaiter={onWaiter} />
    </View>
  );
}

function WaiterScreen({ onBack }: { onBack: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar onBack={onBack} />
      <View style={styles.waiterBody}>
        <Text style={styles.waiterIcon}>🍽</Text>
        <Text style={styles.waiterText}>Please wait, the waiter{"\n"}will come soon</Text>
      </View>
      <BottomTabs active="waiter" />
    </View>
  );
}

function MenuScreen(props: {
  language: string;
  onBack: () => void;
  onOpenBasket: () => void;
  onOpenFavorite: () => void;
  onOpenProfile: () => void;
  onOpenWaiter: () => void;
  onOpenOrders: () => void;
  onFood: (id: string) => void;
  onAdd: (id: string) => void;
}) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title="Menu" language={props.language} onBack={props.onBack} />
      <ScrollView contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
        <TextInput placeholder="What are you looking for?" placeholderTextColor="#dbe6e1" style={styles.search} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerRow}>
          <View style={styles.banner}><Text style={styles.bannerDiscount}>DISCOUNT</Text><Text style={styles.bannerText}>50% discount{"\n"}on all drinks</Text></View>
          <View style={[styles.banner, styles.bannerPhoto]}><Text style={styles.happy}>HAPPY HOURS{"\n"}-20</Text></View>
          <View style={styles.banner}><Text style={styles.bannerText}>club menu</Text></View>
        </ScrollView>
        <View style={styles.toggleRow}><Text style={styles.toggleOff}>Often ordered</Text><Text style={styles.toggleOn}>Discount</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oftenRow}>
          {foods.slice(1, 4).map((item) => <SmallFoodCard key={item.id} item={item} onPress={() => props.onFood(item.id)} onAdd={() => props.onAdd(item.id)} discount />)}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryRow}>
          {["Cold drinks", "Deserts", "Pizza", "Hot dishes"].map((item, index) => <Text key={item} style={[styles.category, index === 0 && styles.categoryActive]}>{item}</Text>)}
        </ScrollView>
        <View style={styles.grid}>
          {foods.slice(1).map((item) => <LargeFoodCard key={item.id} item={item} onPress={() => props.onFood(item.id)} onAdd={() => props.onAdd(item.id)} />)}
        </View>
      </ScrollView>
      <FloatingBasket onPress={props.onOpenBasket} />
      <BottomTabs active="menu" onProfile={props.onOpenProfile} onMenu={props.onOpenOrders} onFavorite={props.onOpenFavorite} onWaiter={props.onOpenWaiter} />
    </View>
  );
}

function DetailScreen({ item, language, showRemove, onBack, onBasket, onAdd }: { item: FoodItem; language: string; showRemove?: boolean; onBack: () => void; onBasket: () => void; onAdd: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar language={language} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailScroll}>
        <Image source={item.image} style={styles.detailImage} />
        <View style={styles.detailCard}>
          <Text style={styles.detailName}>{item.name}</Text>
          <View style={styles.calorieRow}><Text style={styles.calories}>{item.calories} cal</Text><Text style={styles.badge}>gluten free</Text></View>
          <Text style={styles.orangeHeading}>ingredients</Text>
          <Text style={styles.detailDescription}>{item.ingredients}</Text>
          <View style={styles.counter}><Text style={styles.counterText}>−</Text><Text style={styles.counterText}>1</Text><Text style={styles.counterText}>+</Text></View>
          {showRemove ? <Text style={styles.orangeHeading}>Remove ingredients</Text> : null}
          <OrangeButton label={`Add to cart for ${item.price + 1}$`} onPress={onAdd} />
          {showRemove ? (
            <View style={styles.ingredientGrid}>
              {ingredients.map(([name, image]) => <View key={name} style={styles.ingredientItem}><Image source={image} style={styles.ingredientImage} /><Text style={styles.ingredientText}>{name}</Text><Pressable style={styles.addMini}><Text style={styles.addMiniText}>Add</Text></Pressable></View>)}
            </View>
          ) : null}
        </View>
      </ScrollView>
      <FloatingBasket onPress={onBasket} />
      <BottomTabs active="menu" />
    </View>
  );
}

function BasketScreen(props: { items: FoodItem[]; cart: Record<string, number>; total: number; language: string; onBack: () => void; onCheckout: () => void; onInc: (id: string) => void; onDec: (id: string) => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title="Basket" language={props.language} onBack={props.onBack} />
      {props.items.length ? (
        <View style={styles.pageContent}>
          <Text style={styles.sectionTitle}>Pending orders</Text>
          {props.items.map((item) => <OrderLine key={item.id} item={item} qty={props.cart[item.id] ?? 0} controls onInc={() => props.onInc(item.id)} onDec={() => props.onDec(item.id)} />)}
          <Text style={styles.totalText}>Total: {props.total}$</Text>
          <View style={styles.bottomButtonSlot}><OrangeButton label="Checkout" onPress={props.onCheckout} /></View>
        </View>
      ) : (
        <View style={styles.emptyBasket}><Text style={styles.emptyCup}>☕</Text><Text style={styles.emptyText}>Your basket is empty</Text></View>
      )}
      <BottomTabs active="menu" />
    </View>
  );
}

function PaymentScreen(props: { items: FoodItem[]; cart: Record<string, number>; total: number; language: string; mode: "cash" | "online"; variant: Screen; status: string; onBack: () => void; onMode: (mode: "cash" | "online") => void; onVariant: (screen: Screen) => void; onPay: () => void }) {
  const online = props.mode === "online";
  const mastercard = props.variant === "paymentMastercard";
  return (
    <View style={styles.fullScreen}>
      <TopBar title="Payment" language={props.language} onBack={props.onBack} />
      <View style={styles.pageContent}>
        <Radio label="Cash" active={!online} onPress={() => props.onMode("cash")} />
        <Radio label="Online payment" active={online} onPress={() => props.onMode("online")} />
        {online ? (
          <>
            <View style={styles.cardChoiceRow}>
              <Pressable onPress={() => props.onVariant("paymentVisa")} style={[styles.cardChoice, !mastercard && styles.cardChoiceActive]}><Text style={styles.visaText}>VISA</Text></Pressable>
              <Pressable onPress={() => props.onVariant("paymentMastercard")} style={[styles.cardChoice, mastercard && styles.cardChoiceActive]}><Text style={styles.masterText}>MasterCard</Text></Pressable>
            </View>
            <View style={[styles.creditCard, mastercard && styles.masterCard]}>
              <Text style={styles.visaText}>{mastercard ? "MasterCard" : "VISA"}</Text>
              <Text style={styles.cardLabel}>CARD NUMBER</Text><View style={styles.cardInput} />
              <View style={styles.cardBottom}><View><Text style={styles.cardLabel}>CARD HOLDER</Text><View style={[styles.cardInput, styles.cardHolder]} /></View><Text style={styles.cardLabel}>EXPIRES{"\n"}__/__</Text></View>
            </View>
          </>
        ) : (
          <View style={styles.cashList}>{props.items.map((item) => <OrderLine key={item.id} item={item} qty={props.cart[item.id] ?? 0} />)}</View>
        )}
        <Text style={styles.paymentAmount}>Payment amount: <Text style={styles.amount}>{online ? 230 : props.total}$</Text></Text>
        {props.status ? <Text style={styles.muted}>{props.status}</Text> : null}
        <View style={styles.bottomButtonSlot}><OrangeButton label="Pay" onPress={props.onPay} /></View>
      </View>
      <BottomTabs active="menu" />
    </View>
  );
}

function ThanksScreen({ items, cart, total, onDone }: { items: FoodItem[]; cart: Record<string, number>; total: number; onDone: () => void }) {
  return (
    <View style={styles.screenPad}>
      <View style={styles.thanksHeader}><Text style={styles.thanksTitle}>Thanks for your order!</Text><Text style={styles.thanksSub}>Your order has been received,{"\n"}let’s start cooking!</Text></View>
      {items.map((item) => <OrderLine key={item.id} item={item} qty={cart[item.id] ?? 0} />)}
      <Text style={styles.totalText}>Total: {total}$</Text>
      <View style={styles.bottomButtonSlot}><OrangeButton label="Great!" onPress={onDone} /></View>
    </View>
  );
}

function FavoriteScreen({ language, cart, onBack, onBasket, onInc, onDec }: { language: string; cart: Record<string, number>; onBack: () => void; onBasket: () => void; onInc: (id: string) => void; onDec: (id: string) => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title="Favorite" language={language} onBack={onBack} />
      <View style={styles.pageContent}>{foods.slice(1, 3).map((item) => <OrderLine key={item.id} item={item} qty={cart[item.id] ?? 1} controls onInc={() => onInc(item.id)} onDec={() => onDec(item.id)} />)}</View>
      <FloatingBasket onPress={onBasket} />
      <BottomTabs active="favorite" />
    </View>
  );
}

function OrdersScreen({ language, onBack }: { language: string; onBack: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title="My orders" language={language} onBack={onBack} />
      <View style={styles.pageContent}>
        <Text style={styles.sectionTitle}>Pending orders</Text>
        <OrderSummary item={foods[1]!} items="3 Items" status="Process" price={12} />
        <OrderSummary item={foods[0]!} items="2 Items" status="Ready" price={8} />
        <Text style={[styles.sectionTitle, styles.pastTitle]}>Past orders</Text>
        <OrderSummary item={foods[0]!} items="2 Items" status="Completed" price={8} />
      </View>
      <BottomTabs active="menu" />
    </View>
  );
}

function ProfileScreen({ onBack, onChangePassword, onFavorite, onLogout }: { onBack: () => void; onChangePassword: () => void; onFavorite: () => void; onLogout: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar onBack={onBack} />
      <View style={styles.profileHeader}><Image source={images.profile} style={styles.avatar} /><View><Text style={styles.profileName}>Amelia Evans</Text><Text style={styles.profileMeta}>London</Text><Text style={styles.profileMeta}>Since 2023</Text></View></View>
      <View style={styles.profileList}>
        <Text style={styles.profileMain}>⚙  Settings</Text>
        <Text style={styles.profileLink}>Edit Profile</Text>
        <Pressable onPress={onChangePassword}><Text style={styles.profileLink}>Change Password</Text></Pressable>
        <Pressable onPress={onFavorite}><Text style={styles.profileMain}>♥  Favorite</Text></Pressable>
        <Pressable onPress={onLogout}><Text style={styles.profileMain}>↪  Log Out</Text></Pressable>
      </View>
      <BottomTabs active="profile" />
    </View>
  );
}

function SmallFoodCard({ item, discount, onPress, onAdd }: { item: FoodItem; discount?: boolean; onPress: () => void; onAdd: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.smallFood}>
      <Image source={item.image} style={styles.smallFoodImage} />
      <Text numberOfLines={2} style={styles.smallFoodName}>{item.name}</Text>
      <Text numberOfLines={3} style={styles.smallFoodDescription}>{item.description}</Text>
      <View style={styles.priceRow}><Text style={styles.oldPrice}>{discount ? "3$" : ""}</Text><Text style={styles.priceOrange}> {discount ? "2" : item.price}$</Text><Pressable onPress={onAdd}><Text style={styles.plusCircle}>+</Text></Pressable></View>
    </Pressable>
  );
}

function LargeFoodCard({ item, onPress, onAdd }: { item: FoodItem; onPress: () => void; onAdd: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.largeFood}>
      <Image source={item.image} style={styles.largeFoodImage} />
      <Text style={styles.largeFoodName}>{item.name}</Text>
      <Text style={styles.largeFoodDescription}>{item.description}</Text>
      <View style={styles.priceRow}><Text style={styles.largePrice}>{item.price}$</Text><Pressable onPress={onAdd}><Text style={styles.plusCircle}>+</Text></Pressable></View>
    </Pressable>
  );
}

function OrderLine({ item, qty, controls, onInc, onDec }: { item: FoodItem; qty: number; controls?: boolean; onInc?: () => void; onDec?: () => void }) {
  return (
    <View style={styles.orderLine}>
      <Image source={item.image} style={styles.orderImage} />
      <View style={styles.orderBody}><Text style={styles.orderName}>{item.name}</Text>{controls ? <View style={styles.lineCounter}><Text onPress={onDec} style={styles.lineCounterText}>−</Text><Text style={styles.lineCounterText}>{qty}</Text><Text onPress={onInc} style={styles.lineCounterText}>+</Text></View> : <Text style={styles.orderQty}>{qty}</Text>}</View>
      <Text style={styles.orderPrice}>{item.price}$</Text>
    </View>
  );
}

function OrderSummary({ item, items, status, price }: { item: FoodItem; items: string; status: string; price: number }) {
  return (
    <View style={styles.orderLine}>
      <Image source={item.image} style={styles.orderImage} />
      <View style={styles.orderBody}><Text style={styles.orderName}>{item.name}</Text><Text style={styles.profileMeta}>{items}</Text><Text style={styles.statusOrange}>{status}</Text><Text style={styles.orderName}>{price}$</Text></View>
    </View>
  );
}

function Radio({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.radioRow}><View style={[styles.radioOuter, active && styles.radioOuterActive]}><View style={active ? styles.radioInner : undefined} /></View><Text style={styles.radioLabel}>{label}</Text></Pressable>;
}

function OrangeButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return <Pressable disabled={disabled} onPress={onPress} style={[styles.orangeButton, disabled && styles.buttonDisabled]}><Text style={styles.orangeButtonText}>{label}</Text></Pressable>;
}

function BigArrowButton({ label, onPress }: { label: string; onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.bigArrow}><Text style={styles.bigArrowText}>{label}</Text><Text style={styles.bigArrowIcon}>→</Text></Pressable>;
}

function FloatingBasket({ onPress }: { onPress: () => void }) {
  return <Pressable onPress={onPress} style={styles.floatingBasket}><Text style={styles.floatingBasketText}>🛒</Text></Pressable>;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: bg },
  fullScreen: { flex: 1, backgroundColor: bg },
  screenPad: { flex: 1, backgroundColor: bg, paddingHorizontal: 32 },
  top: { minHeight: 72, flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 28 },
  backButton: { width: 36, height: 40, justifyContent: "center" },
  backText: { color: "#fff", fontSize: 42, lineHeight: 40, fontWeight: "600" },
  screenTitle: { color: accent, fontSize: 26, fontWeight: "500" },
  language: { color: "#fff", fontSize: 16 },
  langSpace: { width: 80 },
  languageTop: { position: "absolute", top: 45, right: 32, zIndex: 5 },
  authContainer: { flex: 1, justifyContent: "center", paddingHorizontal: 32, gap: 16, backgroundColor: bg },
  spinner: { alignSelf: "center", width: 92, height: 92, borderRadius: 46, borderWidth: 10, borderColor: accent, borderLeftColor: "transparent", borderBottomColor: "transparent", marginBottom: 4 },
  authTitle: { color: "#fff", fontSize: 27, textAlign: "center" },
  authSub: { color: accent, fontSize: 16, textAlign: "center" },
  lineInput: { minHeight: 44, borderBottomWidth: 1, borderBottomColor: "#65766f", color: "#fff", fontSize: 21, paddingVertical: 4 },
  rememberRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  checkbox: { width: 24, height: 24, borderRadius: 5, borderWidth: 2, borderColor: "#92a19c" },
  rememberText: { color: "#fff", fontSize: 17 },
  orangeButton: { height: 52, borderRadius: 7, alignItems: "center", justifyContent: "center", backgroundColor: accent },
  orangeButtonText: { color: "#fff", fontSize: 25 },
  buttonDisabled: { backgroundColor: "#c5a77e" },
  link: { color: "#b8cfff", textAlign: "center", fontSize: 16 },
  linkInline: { color: "#b8cfff", textDecorationLine: "underline" },
  dividerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  divider: { flex: 1, height: 1, backgroundColor: "#9badA6" },
  muted: { color: muted, fontSize: 16 },
  socialRow: { flexDirection: "row", justifyContent: "center", gap: 28 },
  google: { color: "#fff", fontSize: 35, fontWeight: "900" },
  twitter: { color: "#1da1f2", fontSize: 39 },
  facebook: { color: "#2d7be8", fontSize: 37, fontWeight: "900" },
  signupText: { color: muted, textAlign: "center", fontSize: 16 },
  lockCircle: { alignSelf: "center", marginTop: 98, width: 122, height: 122, borderRadius: 61, alignItems: "center", justifyContent: "center", backgroundColor: accent },
  lockIcon: { color: bg, fontSize: 62 },
  centerTitle: { color: "#fff", fontSize: 27, textAlign: "center", marginTop: 26 },
  inputLabel: { color: "#bcc7c2", fontSize: 8, marginTop: 14 },
  passwordHint: { color: "#87908d", fontSize: 16, marginTop: 12 },
  bottomButtonSlot: { position: "absolute", left: 32, right: 32, bottom: 28 },
  verifyBody: { flex: 1, justifyContent: "center", gap: 20 },
  codeRow: { flexDirection: "row", justifyContent: "space-between" },
  codeBox: { width: 56, height: 57, borderRadius: 8, backgroundColor: "#2b453c", color: "#fff", textAlign: "center", fontSize: 48, overflow: "hidden" },
  successBody: { flex: 1, alignItems: "center", justifyContent: "center", gap: 28 },
  successCircle: { width: 100, height: 100, borderRadius: 50, alignItems: "center", justifyContent: "center", backgroundColor: accent },
  successCheck: { color: "#fff", fontSize: 76 },
  successText: { color: "#d8dfdc", textAlign: "center", fontSize: 24, lineHeight: 33 },
  scanTitle: { color: "#fff", textAlign: "center", fontSize: 25, marginTop: 160, marginBottom: 42 },
  qrCard: { alignSelf: "center", borderRadius: 12, padding: 13, backgroundColor: "#fff" },
  qrImage: { width: 284, height: 284 },
  logoText: { color: "#d8dfdc", textAlign: "center", fontSize: 22, marginTop: 168 },
  homeActions: { marginTop: 114, paddingHorizontal: 32, gap: 40 },
  bigArrow: { height: 80, borderRadius: 7, backgroundColor: "#3e6b5f", paddingHorizontal: 20, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  bigArrowText: { color: "#fff", fontSize: 25 },
  bigArrowIcon: { color: accent, fontSize: 45 },
  waiterBody: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 110 },
  waiterIcon: { fontSize: 120 },
  waiterText: { color: "#fff", textAlign: "center", fontSize: 26, lineHeight: 34 },
  bottomNav: { position: "absolute", left: 0, right: 0, bottom: 0, height: 51, backgroundColor: "#407064", flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  tab: { alignItems: "center", minWidth: 62 },
  tabIcon: { color: accent, fontSize: 27 },
  tabLabel: { color: accent, fontSize: 7 },
  tabActive: { color: accent },
  menuContent: { paddingHorizontal: 32, paddingBottom: 92 },
  search: { height: 24, borderRadius: 7, paddingHorizontal: 9, color: "#fff", backgroundColor: "#477668", fontSize: 16 },
  bannerRow: { gap: 8, paddingTop: 32, paddingBottom: 28 },
  banner: { width: 160, height: 96, borderWidth: 1, borderColor: accent, borderRadius: 3, backgroundColor: "#467569", padding: 7 },
  bannerPhoto: { backgroundColor: "#172820" },
  bannerDiscount: { color: "#fff", backgroundColor: accent, fontSize: 9, alignSelf: "flex-start" },
  bannerText: { color: "#fff", fontSize: 10 },
  happy: { color: "#fff", fontSize: 18, fontWeight: "900" },
  toggleRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 14 },
  toggleOff: { color: "#4f7d70", fontSize: 17 },
  toggleOn: { color: "#fff", fontSize: 17 },
  oftenRow: { gap: 12, paddingBottom: 26 },
  smallFood: { width: 92, minHeight: 180, borderTopWidth: 1, borderColor: accent, borderRadius: 16, backgroundColor: card, paddingHorizontal: 8, paddingTop: 52 },
  smallFoodImage: { position: "absolute", top: -36, alignSelf: "center", width: 82, height: 82, borderRadius: 41 },
  smallFoodName: { color: "#fff", fontSize: 17, lineHeight: 17 },
  smallFoodDescription: { color: "#fff", fontSize: 8, lineHeight: 13, marginTop: 7 },
  priceRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginTop: "auto" },
  oldPrice: { color: "#fff", fontSize: 10, textDecorationLine: "line-through" },
  priceOrange: { color: accent, fontSize: 18 },
  plusCircle: { color: accent, borderWidth: 1, borderColor: accent, borderRadius: 10, width: 20, height: 20, textAlign: "center", lineHeight: 18, fontSize: 17 },
  categoryRow: { gap: 8, paddingBottom: 28 },
  category: { color: accent, borderWidth: 1, borderColor: accent, borderRadius: 11, paddingHorizontal: 10, paddingVertical: 2, fontSize: 17 },
  categoryActive: { color: "#fff", backgroundColor: accent },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 82 },
  largeFood: { width: 135, minHeight: 198, borderTopWidth: 1, borderColor: accent, borderRadius: 20, backgroundColor: card, paddingHorizontal: 10, paddingTop: 90 },
  largeFoodImage: { position: "absolute", top: -54, alignSelf: "center", width: 136, height: 136, borderRadius: 68 },
  largeFoodName: { color: "#fff", fontSize: 25, lineHeight: 30 },
  largeFoodDescription: { color: "#fff", fontSize: 17, lineHeight: 25, marginTop: 12 },
  largePrice: { color: "#fff", fontSize: 18 },
  floatingBasket: { position: "absolute", right: 32, bottom: 120, width: 52, height: 52, borderRadius: 26, backgroundColor: "#fff", alignItems: "center", justifyContent: "center", shadowColor: "#000", shadowOpacity: 0.3, shadowRadius: 8 },
  floatingBasketText: { fontSize: 30 },
  detailScroll: { paddingBottom: 64 },
  detailImage: { alignSelf: "center", width: 242, height: 242, borderRadius: 121, marginTop: 10, zIndex: 2 },
  detailCard: { marginTop: -20, borderTopLeftRadius: 34, borderTopRightRadius: 34, backgroundColor: card, padding: 32, paddingTop: 58, minHeight: 520 },
  detailName: { color: "#fff", fontSize: 34, lineHeight: 42 },
  calorieRow: { flexDirection: "row", gap: 22, marginTop: 16, alignItems: "center" },
  calories: { color: "#fff", fontSize: 17 },
  badge: { color: accent, borderColor: accent, borderWidth: 1, borderRadius: 12, paddingHorizontal: 8, fontSize: 16 },
  orangeHeading: { color: accent, fontSize: 26, marginTop: 22 },
  detailDescription: { color: muted, fontSize: 17, lineHeight: 25, marginTop: 10 },
  counter: { marginTop: 22, width: 78, height: 32, borderWidth: 1, borderColor: accent, borderRadius: 14, flexDirection: "row", justifyContent: "space-around", alignItems: "center" },
  counterText: { color: "#fff", fontSize: 22 },
  ingredientGrid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 12, marginTop: 18 },
  ingredientItem: { width: 62, alignItems: "center" },
  ingredientImage: { width: 48, height: 36, borderRadius: 8 },
  ingredientText: { color: "#fff", fontSize: 8, marginTop: 3 },
  addMini: { backgroundColor: accent, borderRadius: 4, width: 58, height: 20, justifyContent: "center", marginTop: 4 },
  addMiniText: { color: "#fff", textAlign: "center", fontSize: 8 },
  pageContent: { flex: 1, paddingHorizontal: 32, paddingTop: 22 },
  sectionTitle: { color: "#fff", fontSize: 26, marginBottom: 24 },
  orderLine: { minHeight: 104, borderRadius: 22, backgroundColor: card, marginBottom: 8, paddingHorizontal: 28, flexDirection: "row", alignItems: "center", gap: 16 },
  orderImage: { width: 70, height: 70, borderRadius: 35 },
  orderBody: { flex: 1 },
  orderName: { color: "#fff", fontSize: 17, fontWeight: "700" },
  orderQty: { color: "#fff", fontSize: 17, marginTop: 20 },
  orderPrice: { color: "#fff", fontSize: 18, fontWeight: "700" },
  lineCounter: { marginTop: 12, width: 74, height: 24, borderColor: accent, borderWidth: 1, borderRadius: 12, flexDirection: "row", alignItems: "center", justifyContent: "space-around" },
  lineCounterText: { color: "#fff", fontSize: 16 },
  totalText: { color: "#fff", fontSize: 16, alignSelf: "flex-end", marginTop: 12 },
  emptyBasket: { flex: 1, alignItems: "center", justifyContent: "center", paddingBottom: 110 },
  emptyCup: { color: "#fff", fontSize: 120 },
  emptyText: { color: "#fff", fontSize: 25, marginTop: 16 },
  radioRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 22 },
  radioOuter: { width: 24, height: 24, borderRadius: 12, borderWidth: 1, borderColor: "#fff", justifyContent: "center", alignItems: "center" },
  radioOuterActive: { borderColor: accent },
  radioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: accent },
  radioLabel: { color: "#fff", fontSize: 25 },
  cardChoiceRow: { flexDirection: "row", gap: 8, marginBottom: 32 },
  cardChoice: { width: 104, height: 62, borderRadius: 4, backgroundColor: card, alignItems: "center", justifyContent: "center" },
  cardChoiceActive: { borderWidth: 1, borderColor: accent, backgroundColor: "#fff", shadowColor: "#fff", shadowOpacity: 0.6, shadowRadius: 12 },
  visaText: { color: "#0036a4", fontWeight: "900", fontSize: 20 },
  masterText: { color: "#d21f2b", fontSize: 11, fontWeight: "900" },
  creditCard: { height: 198, borderRadius: 6, padding: 22, backgroundColor: "#77d4ba", justifyContent: "space-between" },
  masterCard: { backgroundColor: "#87b2f1" },
  cardLabel: { color: "#16352b", fontSize: 8 },
  cardInput: { height: 24, backgroundColor: "#fff", borderRadius: 2, marginTop: 5 },
  cardHolder: { width: 156 },
  cardBottom: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  cashList: { marginTop: 12 },
  paymentAmount: { color: "#fff", marginTop: 32, fontSize: 16 },
  amount: { color: accent, fontSize: 25 },
  thanksHeader: { alignItems: "center", marginTop: 90, marginBottom: 34 },
  thanksTitle: { color: "#fff", fontSize: 25 },
  thanksSub: { color: "#fff", textAlign: "center", fontSize: 17, lineHeight: 24, marginTop: 20 },
  pastTitle: { marginTop: 32 },
  statusOrange: { color: accent, fontSize: 16, marginTop: 4 },
  profileHeader: { flexDirection: "row", gap: 30, alignItems: "center", paddingHorizontal: 32, marginTop: 20 },
  avatar: { width: 92, height: 92, borderRadius: 46, borderWidth: 1, borderColor: accent },
  profileName: { color: accent, fontSize: 25 },
  profileMeta: { color: "#fff", fontSize: 17, marginTop: 8 },
  profileList: { paddingHorizontal: 32, marginTop: 80, gap: 24 },
  profileMain: { color: "#fff", fontSize: 17, fontWeight: "700" },
  profileLink: { color: "#fff", fontSize: 16 },
});
