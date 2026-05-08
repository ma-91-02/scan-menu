"use client";

import { useEffect, useMemo, useState } from "react";
import { supportedLanguages, type SupportedLanguage } from "@babili/shared";
import { migrateLegacyStorageKey, storageKeys } from "../lib/storage-keys";

type ViewId = "menu" | "waiter" | "discounts" | "settings";
type AuthMode = "login" | "register";

interface Restaurant {
  id: string;
  name: string;
  operatingLanguage: string;
  supportedCustomerLanguages: string[];
  status: string;
}

interface CustomerMenuItem {
  id: string;
  restaurantId: string;
  displayName: string;
  displayDescription: string;
  price: number;
  currency: string;
  ingredients?: Array<{
    id: string;
    displayName: string;
  }>;
}

interface CustomerUser {
  id: string;
  name: string;
  email?: string;
}

interface CustomerOrder {
  id: string;
  total: number;
  currency: string;
  displayLines?: Array<{
    menuItemId: string;
    quantity: number;
    displayName?: string;
    displayNote?: string;
  }>;
}

const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const languageStorageKey = storageKeys.customerLanguage;
const customerStorageKey = storageKeys.customerUser;
const sessionStorageKey = storageKeys.session;

const fallbackRestaurants: Restaurant[] = [
  {
    id: "rst_bistro_01",
    name: "Bistro Aurora",
    operatingLanguage: "ru",
    supportedCustomerLanguages: ["ar", "en", "ru", "tr"],
    status: "active",
  },
];
const defaultRestaurant = fallbackRestaurants[0]!;

const fallbackMenu: CustomerMenuItem[] = [
  {
    id: "mi_salmon_bowl",
    restaurantId: "rst_bistro_01",
    displayName: "وعاء السلمون",
    displayDescription: "أرز، سلمون، أفوكادو، خيار، سمسم.",
    price: 18,
    currency: "USD",
  },
];

const translations = {
  ar: {
    chooseLanguage: "اختر لغتك",
    languageHint: "يمكنك تغيير اللغة لاحقًا من الإعدادات.",
    continue: "متابعة",
    nearby: "مطاعم قريبة",
    table: "الطاولة",
    qr: "QR الطاولة",
    pasteQr: "ألصق رابط QR",
    apply: "تطبيق",
    menu: "المنيو",
    waiter: "النادل",
    discounts: "الخصومات",
    settings: "الإعدادات",
    login: "دخول",
    register: "تسجيل",
    name: "الاسم",
    email: "البريد الإلكتروني",
    password: "كلمة المرور",
    termsConsent: "أوافق على شروط الاستخدام وسياسة الخصوصية",
    signedIn: "مسجل الدخول",
    signOut: "تسجيل خروج",
    deleteAccount: "حذف الحساب",
    deleteAccountConfirm: "سيتم حذف حسابك وطلباتك المرتبطة. هل أنت متأكد؟",
    verifyEmail: "يجب تأكيد بريدك الإلكتروني قبل الدخول.",
    authRequired: "سجّل أو ادخل أولًا لإرسال الطلب.",
    orderNote: "ملاحظة الطلب",
    add: "إضافة",
    placeOrder: "إرسال الطلب",
    cart: "السلة",
    emptyCart: "أضف صنفًا واحدًا على الأقل.",
    sending: "جاري إرسال الطلب...",
    sent: "تم إرسال الطلب للمطعم بلغته.",
    failed: "تعذر تنفيذ العملية.",
    waiterTitle: "طلب النادل",
    waiterBody: "اضغط لإرسال طلب نادل للطاولة الحالية.",
    callWaiter: "اطلب نادل",
    waiterSent: "تم إرسال طلب النادل.",
    todayDiscounts: "خصومات اليوم",
    scanHint: "يدعم الرابط: /customer?restaurantId=rst_bistro_01&table=5",
    locationHint:
      "التصنيف الحالي تجريبي حسب مطاعم قريبة، ولاحقًا سنربطه بموقع المستخدم الحقيقي.",
    restaurantLanguage: "لغة المطعم",
  },
  en: {
    chooseLanguage: "Choose your language",
    languageHint: "You can change it later in settings.",
    continue: "Continue",
    nearby: "Nearby restaurants",
    table: "Table",
    qr: "Table QR",
    pasteQr: "Paste QR link",
    apply: "Apply",
    menu: "Menu",
    waiter: "Waiter",
    discounts: "Discounts",
    settings: "Settings",
    login: "Login",
    register: "Register",
    name: "Name",
    email: "Email",
    password: "Password",
    termsConsent: "I agree to the Terms of Use and Privacy Policy",
    signedIn: "Signed in",
    signOut: "Sign out",
    deleteAccount: "Delete account",
    deleteAccountConfirm:
      "This will delete your account and linked orders. Are you sure?",
    verifyEmail: "Please verify your email before signing in.",
    authRequired: "Register or log in before ordering.",
    orderNote: "Order note",
    add: "Add",
    placeOrder: "Place order",
    cart: "Cart",
    emptyCart: "Add at least one item.",
    sending: "Sending order...",
    sent: "Order sent to the restaurant in its language.",
    failed: "Action failed.",
    waiterTitle: "Call waiter",
    waiterBody: "Send a waiter request for this table.",
    callWaiter: "Call waiter",
    waiterSent: "Waiter request sent.",
    todayDiscounts: "Today's discounts",
    scanHint: "Supported link: /customer?restaurantId=rst_bistro_01&table=5",
    locationHint:
      "Nearby sorting is mocked for development; later it will use real customer location.",
    restaurantLanguage: "Restaurant language",
  },
  ru: {
    chooseLanguage: "Выберите язык",
    languageHint: "Позже его можно изменить в настройках.",
    continue: "Продолжить",
    nearby: "Рестораны рядом",
    table: "Стол",
    qr: "QR стола",
    pasteQr: "Вставьте QR ссылку",
    apply: "Применить",
    menu: "Меню",
    waiter: "Официант",
    discounts: "Скидки",
    settings: "Настройки",
    login: "Войти",
    register: "Регистрация",
    name: "Имя",
    email: "Email",
    password: "Пароль",
    termsConsent:
      "Я соглашаюсь с Условиями использования и Политикой конфиденциальности",
    signedIn: "Вход выполнен",
    signOut: "Выйти",
    deleteAccount: "Удалить аккаунт",
    deleteAccountConfirm:
      "Аккаунт и связанные заказы будут удалены. Вы уверены?",
    verifyEmail: "Подтвердите email перед входом.",
    authRequired: "Зарегистрируйтесь или войдите перед заказом.",
    orderNote: "Комментарий",
    add: "Добавить",
    placeOrder: "Отправить",
    cart: "Корзина",
    emptyCart: "Добавьте хотя бы одно блюдо.",
    sending: "Отправка заказа...",
    sent: "Заказ отправлен ресторану на его языке.",
    failed: "Ошибка действия.",
    waiterTitle: "Вызвать официанта",
    waiterBody: "Отправьте запрос официанту для этого стола.",
    callWaiter: "Вызвать",
    waiterSent: "Запрос официанту отправлен.",
    todayDiscounts: "Скидки дня",
    scanHint: "Поддержка ссылки: /customer?restaurantId=rst_bistro_01&table=5",
    locationHint:
      "Сортировка рядом пока тестовая; позже подключим реальную геолокацию.",
    restaurantLanguage: "Язык ресторана",
  },
};

export default function CustomerPage() {
  const [language, setLanguage] = useState("");
  const [languages, setLanguages] =
    useState<SupportedLanguage[]>(supportedLanguages);
  const [activeView, setActiveView] = useState<ViewId>("menu");
  const [authMode, setAuthMode] = useState<AuthMode>("register");
  const [restaurants, setRestaurants] =
    useState<Restaurant[]>(fallbackRestaurants);
  const [selectedRestaurantId, setSelectedRestaurantId] = useState(
    defaultRestaurant.id,
  );
  const [tableNumber, setTableNumber] = useState("5");
  const [qrInput, setQrInput] = useState("");
  const [menu, setMenu] = useState<CustomerMenuItem[]>(fallbackMenu);
  const [cart, setCart] = useState<Record<string, number>>({});
  const [removedIngredientsByItem, setRemovedIngredientsByItem] = useState<
    Record<string, string[]>
  >({});
  const [note, setNote] = useState("no onions");
  const [customer, setCustomer] = useState<CustomerUser | null>(null);
  const [authName, setAuthName] = useState("");
  const [authEmail, setAuthEmail] = useState("");
  const [authPassword, setAuthPassword] = useState("");
  const [acceptedPolicies, setAcceptedPolicies] = useState(false);
  const [status, setStatus] = useState("");
  const [lastOrder, setLastOrder] = useState<CustomerOrder | null>(null);

  const selectedRestaurant =
    restaurants.find((restaurant) => restaurant.id === selectedRestaurantId) ??
    defaultRestaurant;
  const currentLanguage = language || "ar";
  const t =
    translations[currentLanguage as keyof typeof translations] ??
    translations.en;
  const isRtl = ["ar", "ur", "fa", "he"].includes(currentLanguage);
  const quantity = Object.values(cart).reduce((sum, value) => sum + value, 0);
  const total = useMemo(
    () =>
      menu.reduce((sum, item) => sum + item.price * (cart[item.id] ?? 0), 0),
    [cart, menu],
  );
  const tabs: Array<{ id: ViewId; label: string; icon: string }> = [
    { id: "menu", label: t.menu, icon: "≡" },
    { id: "waiter", label: t.waiter, icon: "!" },
    { id: "discounts", label: t.discounts, icon: "%" },
    { id: "settings", label: t.settings, icon: "⚙" },
  ];

  useEffect(() => {
    fetch(`${apiUrl}/translations/languages`)
      .then((response) => response.json())
      .then((payload) =>
        setLanguages(payload.data?.length ? payload.data : supportedLanguages),
      )
      .catch(() => setLanguages(supportedLanguages));

    const params = new URLSearchParams(window.location.search);
    const urlLanguage = params.get("lang");
    migrateLegacyStorageKey("session");
    const storedLanguage = localStorage.getItem(
      migrateLegacyStorageKey("customerLanguage"),
    );
    const storedCustomer = localStorage.getItem(
      migrateLegacyStorageKey("customerUser"),
    );
    const restaurantFromQr = params.get("restaurantId");
    const tableFromQr = params.get("table");

    if (urlLanguage || storedLanguage) {
      setLanguage(urlLanguage || storedLanguage || "ar");
    }

    if (storedCustomer) {
      setCustomer(JSON.parse(storedCustomer));
    }

    if (restaurantFromQr) {
      setSelectedRestaurantId(restaurantFromQr);
    }

    if (tableFromQr) {
      setTableNumber(tableFromQr);
    }
  }, []);

  useEffect(() => {
    if (language) {
      localStorage.setItem(languageStorageKey, language);
    }
  }, [language]);

  useEffect(() => {
    fetch(`${apiUrl}/restaurants`)
      .then((response) => response.json())
      .then((payload) => {
        const data = payload.data?.length ? payload.data : fallbackRestaurants;
        setRestaurants(data);
        setSelectedRestaurantId((current) =>
          data.some((item: Restaurant) => item.id === current)
            ? current
            : data[0].id,
        );
      })
      .catch(() => setRestaurants(fallbackRestaurants));
  }, []);

  useEffect(() => {
    if (!language) {
      return;
    }

    setCart({});
    setLastOrder(null);
    fetch(
      `${apiUrl}/restaurants/${selectedRestaurantId}/menu?language=${language}`,
    )
      .then((response) => response.json())
      .then((payload) =>
        setMenu(payload.data?.length ? payload.data : fallbackMenu),
      )
      .catch(() => setMenu(fallbackMenu));
  }, [language, selectedRestaurantId]);

  useEffect(() => {
    if (!customer) {
      return;
    }

    const events = new EventSource(
      `${apiUrl}/orders/events?customerId=${customer.id}&language=${currentLanguage}`,
    );
    events.addEventListener("orders", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setLastOrder(payload.data?.[0] ?? null);
    });
    events.addEventListener("snapshot", (event) => {
      const payload = JSON.parse((event as MessageEvent).data);
      setLastOrder(payload.data?.[0] ?? null);
    });

    return () => events.close();
  }, [customer, currentLanguage]);

  async function submitAuth() {
    setStatus("");

    if (authMode === "login") {
      const response = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: authEmail, password: authPassword }),
      });
      const payload = await response.json();

      if (!response.ok || payload.data.user.role !== "customer") {
        if (
          response.status === 403 &&
          payload.code === "EMAIL_VERIFICATION_REQUIRED"
        ) {
          window.location.href = `/verify-email?lang=${currentLanguage}&notice=required&email=${encodeURIComponent(authEmail)}`;
          return;
        }
        setStatus(payload.error ?? t.failed);
        return;
      }

      const user = {
        id: payload.data.user.id,
        name: payload.data.user.name,
        email: payload.data.user.email,
      };
      localStorage.setItem(sessionStorageKey, payload.data.session.id);
      localStorage.setItem(customerStorageKey, JSON.stringify(user));
      setCustomer(user);
      setStatus(`${t.signedIn}: ${user.name}`);
      return;
    }

    if (!authName.trim() || !authEmail.trim() || !acceptedPolicies) {
      setStatus(t.failed);
      return;
    }

    const response = await fetch(`${apiUrl}/auth/register/customer`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: authName,
        email: authEmail,
        username: `${authEmail.split("@")[0]}-${Date.now()}`,
        password: authPassword,
        preferredLanguage: currentLanguage,
        termsAccepted: acceptedPolicies,
        privacyAccepted: acceptedPolicies,
        consentAt: new Date().toISOString(),
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? t.failed);
      return;
    }

    const user = {
      id: payload.data.user.id,
      name: payload.data.user.name,
      email: payload.data.user.email,
    };
    localStorage.setItem(sessionStorageKey, payload.data.session.id);
    localStorage.setItem(customerStorageKey, JSON.stringify(user));
    setCustomer(user);
    setStatus(`${t.signedIn}: ${user.name}`);
  }

  function signOut() {
    localStorage.removeItem(customerStorageKey);
    localStorage.removeItem(sessionStorageKey);
    setCustomer(null);
    setStatus("");
  }

  async function deleteAccount() {
    if (!window.confirm(t.deleteAccountConfirm)) return;
    const sessionId = localStorage.getItem(sessionStorageKey);
    if (!sessionId) return;

    const response = await fetch(`${apiUrl}/auth/account`, {
      method: "DELETE",
      headers: { "x-session-id": sessionId },
    });

    if (response.ok) signOut();
    else setStatus(t.failed);
  }

  function applyQrLink() {
    try {
      const url = new URL(qrInput, window.location.origin);
      const restaurantId = url.searchParams.get("restaurantId");
      const table = url.searchParams.get("table");

      if (restaurantId) {
        setSelectedRestaurantId(restaurantId);
      }

      if (table) {
        setTableNumber(table);
      }
    } catch {
      setStatus(t.failed);
    }
  }

  async function placeOrder() {
    if (!customer) {
      setStatus(t.authRequired);
      return;
    }

    if (!quantity) {
      setStatus(t.emptyCart);
      return;
    }

    setStatus(t.sending);

    const lines = Object.entries(cart)
      .filter(([, itemQuantity]) => itemQuantity > 0)
      .map(([menuItemId, itemQuantity]) => ({
        menuItemId,
        quantity: itemQuantity,
        customerNote: `${note}; table ${tableNumber}`,
        removedIngredientIds: removedIngredientsByItem[menuItemId] ?? [],
      }));

    const response = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: selectedRestaurant.id,
        customerId: customer.id,
        customerLanguage: currentLanguage,
        restaurantLanguage: selectedRestaurant.operatingLanguage,
        tableNumber,
        paymentMethod: "cash",
        lines,
      }),
    });
    const payload = await response.json();

    if (!response.ok) {
      setStatus(payload.error ?? t.failed);
      return;
    }

    setLastOrder(payload.data);
    setCart({});
    setRemovedIngredientsByItem({});
    setStatus(t.sent);
  }

  async function requestWaiter() {
    if (!customer) {
      setStatus(t.authRequired);
      return;
    }

    const response = await fetch(`${apiUrl}/orders`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        restaurantId: selectedRestaurant.id,
        customerId: customer.id,
        customerLanguage: currentLanguage,
        restaurantLanguage: selectedRestaurant.operatingLanguage,
        tableNumber,
        lines: [
          {
            menuItemId: "waiter_request",
            quantity: 1,
            customerNote: t.waiterTitle,
          },
        ],
      }),
    });

    setStatus(response.ok ? t.waiterSent : t.failed);
  }

  if (!language) {
    return (
      <main className="customer-app-shell">
        <section className="customer-phone language-onboarding">
          <span>Babili</span>
          <h1>{translations.ar.chooseLanguage}</h1>
          <p>{translations.ar.languageHint}</p>
          <div className="language-choice-grid">
            {languages.slice(0, 8).map((item) => (
              <button
                key={item.code}
                type="button"
                onClick={() => setLanguage(String(item.code))}
              >
                {item.nativeName}
              </button>
            ))}
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="customer-app-shell" dir={isRtl ? "rtl" : "ltr"}>
      <section className="customer-phone">
        <header className="customer-mobile-top">
          <div>
            <span>Babili</span>
            <strong>{selectedRestaurant.name}</strong>
          </div>
          <button type="button" onClick={() => setActiveView("settings")}>
            ⚙
          </button>
        </header>

        <section className="customer-location-card">
          <div>
            <span>
              {t.table} {tableNumber}
            </span>
            <strong>
              {t.restaurantLanguage}:{" "}
              {selectedRestaurant.operatingLanguage.toUpperCase()}
            </strong>
            <small>{t.locationHint}</small>
          </div>
          <button type="button" onClick={() => setActiveView("settings")}>
            {t.qr}
          </button>
        </section>

        {!customer ? (
          <section className="mobile-auth-card">
            <div className="mobile-segment">
              <button
                className={authMode === "register" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("register")}
              >
                {t.register}
              </button>
              <button
                className={authMode === "login" ? "active" : ""}
                type="button"
                onClick={() => setAuthMode("login")}
              >
                {t.login}
              </button>
            </div>
            {authMode === "register" ? (
              <input
                placeholder={t.name}
                value={authName}
                onChange={(event) => setAuthName(event.target.value)}
              />
            ) : null}
            <input
              placeholder={t.email}
              value={authEmail}
              onChange={(event) => setAuthEmail(event.target.value)}
            />
            {authMode === "login" || authMode === "register" ? (
              <input
                placeholder={t.password}
                type="password"
                value={authPassword}
                onChange={(event) => setAuthPassword(event.target.value)}
              />
            ) : null}
            {authMode === "register" ? (
              <label className="mobile-consent-row">
                <input
                  type="checkbox"
                  checked={acceptedPolicies}
                  onChange={(event) =>
                    setAcceptedPolicies(event.target.checked)
                  }
                />
                {t.termsConsent}
              </label>
            ) : null}
            <button type="button" onClick={submitAuth}>
              {authMode === "login" ? t.login : t.register}
            </button>
          </section>
        ) : (
          <section className="mobile-user-card">
            <span>{t.signedIn}</span>
            <strong>{customer.name}</strong>
            <button type="button" onClick={signOut}>
              {t.signOut}
            </button>
          </section>
        )}

        <section className="customer-mobile-content">
          {activeView === "menu" ? (
            <>
              <div className="mobile-section-title">
                <span>{t.nearby}</span>
                <strong>{t.menu}</strong>
              </div>
              <div className="mobile-restaurant-strip">
                {restaurants.map((restaurant, index) => (
                  <button
                    className={
                      restaurant.id === selectedRestaurantId ? "active" : ""
                    }
                    key={restaurant.id}
                    type="button"
                    onClick={() => setSelectedRestaurantId(restaurant.id)}
                  >
                    <span>{restaurant.name}</span>
                    <small>
                      {index + 1}.{index + 4} km
                    </small>
                  </button>
                ))}
              </div>
              <div className="mobile-menu-list">
                {menu.map((item) => (
                  <article className="mobile-menu-item" key={item.id}>
                    <div className="mobile-food-photo">
                      {item.displayName.slice(0, 1)}
                    </div>
                    <div>
                      <h3>{item.displayName}</h3>
                      <p>{item.displayDescription}</p>
                      <footer>
                        <strong>
                          {item.price} {item.currency}
                        </strong>
                        <button
                          type="button"
                          onClick={() =>
                            setCart((current) => ({
                              ...current,
                              [item.id]: (current[item.id] ?? 0) + 1,
                            }))
                          }
                        >
                          {t.add}
                        </button>
                      </footer>
                      {item.ingredients?.length ? (
                        <div className="customer-ingredient-list">
                          {item.ingredients.map((ingredient) => {
                            const removed =
                              removedIngredientsByItem[item.id]?.includes(
                                ingredient.id,
                              ) ?? false;
                            return (
                              <button
                                className={removed ? "removed" : ""}
                                key={ingredient.id}
                                type="button"
                                onClick={() =>
                                  setRemovedIngredientsByItem((current) => {
                                    const itemRemoved = current[item.id] ?? [];
                                    return {
                                      ...current,
                                      [item.id]: itemRemoved.includes(
                                        ingredient.id,
                                      )
                                        ? itemRemoved.filter(
                                            (id) => id !== ingredient.id,
                                          )
                                        : [...itemRemoved, ingredient.id],
                                    };
                                  })
                                }
                              >
                                {removed ? "No " : ""}
                                {ingredient.displayName}
                              </button>
                            );
                          })}
                        </div>
                      ) : null}
                    </div>
                  </article>
                ))}
              </div>
            </>
          ) : null}

          {activeView === "waiter" ? (
            <section className="mobile-action-panel">
              <h2>{t.waiterTitle}</h2>
              <p>{t.waiterBody}</p>
              <button type="button" onClick={requestWaiter}>
                {t.callWaiter}
              </button>
            </section>
          ) : null}

          {activeView === "discounts" ? (
            <section className="mobile-discount-list">
              <h2>{t.todayDiscounts}</h2>
              {menu.slice(0, 3).map((item, index) => (
                <article key={item.id}>
                  <span>{item.displayName}</span>
                  <strong>{[10, 15, 5][index]}%</strong>
                </article>
              ))}
            </section>
          ) : null}

          {activeView === "settings" ? (
            <section className="mobile-settings">
              <label>
                {t.chooseLanguage}
                <select
                  value={currentLanguage}
                  onChange={(event) => setLanguage(event.target.value)}
                >
                  {languages.slice(0, 8).map((item) => (
                    <option key={item.code} value={String(item.code)}>
                      {item.nativeName}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t.pasteQr}
                <input
                  value={qrInput}
                  onChange={(event) => setQrInput(event.target.value)}
                  placeholder="/customer?restaurantId=rst_bistro_01&table=5"
                />
              </label>
              <button type="button" onClick={applyQrLink}>
                {t.apply}
              </button>
              {customer ? (
                <button
                  className="danger-button"
                  type="button"
                  onClick={() => void deleteAccount()}
                >
                  {t.deleteAccount}
                </button>
              ) : null}
              <small>{t.scanHint}</small>
            </section>
          ) : null}
        </section>

        <section className="mobile-cart-bar">
          <div>
            <span>{t.cart}</span>
            <strong>
              {quantity} / {total} USD
            </strong>
          </div>
          <input
            value={note}
            onChange={(event) => setNote(event.target.value)}
            placeholder={t.orderNote}
          />
          <button type="button" onClick={placeOrder}>
            {t.placeOrder}
          </button>
        </section>

        {status ? <p className="mobile-status">{status}</p> : null}
        {lastOrder ? (
          <section className="mobile-receipt">
            <strong>#{lastOrder.id}</strong>
            {lastOrder.displayLines?.map((line) => (
              <span key={line.menuItemId}>
                {line.quantity} {line.displayName}{" "}
                {line.displayNote ? `- ${line.displayNote}` : ""}
              </span>
            ))}
          </section>
        ) : null}

        <nav className="mobile-bottom-tabs">
          {tabs.map((tab) => (
            <button
              className={activeView === tab.id ? "active" : ""}
              key={tab.id}
              type="button"
              onClick={() => setActiveView(tab.id)}
            >
              <span>{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </nav>
      </section>
    </main>
  );
}
