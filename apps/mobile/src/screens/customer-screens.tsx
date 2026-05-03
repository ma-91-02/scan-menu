import { ActivityIndicator, Image, Linking, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { supportedLanguages, type CustomerOrder, type CustomerUser, type MenuItem, type Restaurant } from "../api";
import { getMenuItemImage, images } from "../assets";
import { BigArrowButton, BottomTabs, FloatingBasket, OrangeButton, Radio, TopBar } from "../components/ui";
import { formatCurrency } from "../format";
import type { AppCopy } from "../i18n";
import { styles } from "../styles";
import { colors } from "../theme";
import type { AuthMode, PaymentMode } from "../types";

export function LanguageScreen({ languages, language, onLanguage, onContinue, t }: { languages: typeof supportedLanguages; language: string; onLanguage: (value: string) => void; onContinue: () => void; t: AppCopy }) {
  return (
    <View style={styles.onboardingScreen}>
      <View style={styles.languageHero}>
        <Text style={styles.logoMark}>Scan Menu</Text>
        <Text style={styles.centerTitle}>{t.chooseLanguage}</Text>
        <Text style={styles.authSub}>{t.languageHint}</Text>
      </View>
      <ScrollView contentContainerStyle={styles.languageGrid} showsVerticalScrollIndicator={false}>
        {languages.map((item) => (
          <Pressable key={item.code} onPress={() => onLanguage(item.code)} style={[styles.languageChip, item.code === language && styles.languageChipActive]}>
            <Text style={[styles.languageChipText, item.code === language && styles.languageChipTextActive]}>{item.nativeName}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <View style={styles.bottomButtonSlot}><OrangeButton label={t.continue} onPress={onContinue} /></View>
    </View>
  );
}


export function AuthScreen(props: {
  mode: AuthMode;
  name: string;
  identifier: string;
  password: string;
  acceptedPolicies: boolean;
  busy: boolean;
  message: string;
  t: AppCopy;
  onMode: (mode: AuthMode) => void;
  onName: (value: string) => void;
  onIdentifier: (value: string) => void;
  onPassword: (value: string) => void;
  onAcceptedPolicies: (value: boolean) => void;
  onSubmit: () => void;
  onBack: () => void;
}) {
  return (
    <View style={styles.authContainer}>
      <TopBar onBack={props.onBack} />
      <View style={styles.spinner} />
      <Text style={styles.authTitle}>{props.mode === "login" ? props.t.signIn : props.t.signUp}</Text>
      <Text style={styles.authSub}>{props.t.access}</Text>
      <View style={styles.segment}>
        <Pressable onPress={() => props.onMode("login")} style={[styles.segmentButton, props.mode === "login" && styles.segmentActive]}><Text style={[styles.segmentText, props.mode === "login" && styles.segmentTextActive]}>{props.t.signIn}</Text></Pressable>
        <Pressable onPress={() => props.onMode("register")} style={[styles.segmentButton, props.mode === "register" && styles.segmentActive]}><Text style={[styles.segmentText, props.mode === "register" && styles.segmentTextActive]}>{props.t.signUp}</Text></Pressable>
      </View>
      {props.mode === "register" ? <TextInput value={props.name} onChangeText={props.onName} placeholder={props.t.name} placeholderTextColor="#63756d" style={styles.lineInput} /> : null}
      <TextInput autoCapitalize="none" keyboardType="email-address" value={props.identifier} onChangeText={props.onIdentifier} placeholder={props.t.email} placeholderTextColor="#63756d" style={styles.lineInput} />
      <TextInput value={props.password} onChangeText={props.onPassword} placeholder={props.t.password} placeholderTextColor="#63756d" secureTextEntry style={styles.lineInput} />
      <View style={styles.rememberRow}><View style={styles.checkbox} /><Text style={styles.rememberText}>{props.t.remember}</Text></View>
      {props.mode === "register" ? (
        <Pressable onPress={() => props.onAcceptedPolicies(!props.acceptedPolicies)} style={styles.consentRow}>
          <View style={[styles.checkbox, props.acceptedPolicies && styles.checkboxChecked]}>
            {props.acceptedPolicies ? <Text style={styles.checkMark}>✓</Text> : null}
          </View>
          <Text style={styles.consentText}>
            {props.t.termsConsent.split(props.t.terms)[0]}
            <Text style={styles.consentLink} onPress={() => void Linking.openURL("https://scanmenu.local/terms")}>{props.t.terms}</Text>
            {props.t.termsConsent.split(props.t.terms)[1]?.split(props.t.privacy)[0] ?? " and "}
            <Text style={styles.consentLink} onPress={() => void Linking.openURL("https://scanmenu.local/privacy")}>{props.t.privacy}</Text>
          </Text>
        </Pressable>
      ) : null}
      {props.message ? <Text style={styles.errorText}>{props.message}</Text> : null}
      <OrangeButton label={props.mode === "login" ? props.t.signIn : props.t.signUp} onPress={props.onSubmit} disabled={props.busy || !props.identifier || !props.password || (props.mode === "register" && !props.acceptedPolicies)} />
      {props.busy ? <ActivityIndicator color={colors.accent} /> : null}
      <Text style={styles.link}>{props.t.forgot}</Text>
    </View>
  );
}

export function ScanScreen({ language, languages, t, busy, message, onLanguage, onScan, onBack }: { language: string; languages: typeof supportedLanguages; t: AppCopy; busy: boolean; message: string; onLanguage: (value: string) => void; onScan: () => void; onBack: () => void }) {
  return (
    <View style={styles.screenPad}>
      <TopBar title={t.scan} language={language} onBack={onBack} />
      <ScrollView horizontal contentContainerStyle={styles.languageStrip} showsHorizontalScrollIndicator={false}>
        {languages.slice(0, 10).map((item) => (
          <Pressable key={item.code} onPress={() => onLanguage(item.code)} style={[styles.languagePill, item.code === language && styles.languagePillActive]}>
            <Text style={[styles.languagePillText, item.code === language && styles.languagePillTextActive]}>{item.nativeName}</Text>
          </Pressable>
        ))}
      </ScrollView>
      <Text style={styles.scanTitle}>{t.scanHint}</Text>
      <View style={styles.qrCard}><Image source={images.qr} style={styles.qrImage} /></View>
      {message ? <Text style={styles.errorText}>{message}</Text> : null}
      <View style={styles.bottomButtonSlot}><OrangeButton label={busy ? t.loading : t.scanButton} onPress={onScan} disabled={busy} /></View>
    </View>
  );
}

export function HomeScreen({ t, language, restaurant, tableNumber, onMenu, onWaiter, onProfile }: { t: AppCopy; language: string; restaurant: Restaurant; tableNumber: string; onMenu: () => void; onWaiter: () => void; onProfile: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <View style={styles.homeHeader}>
        <Text style={styles.language}>{language.toUpperCase()}</Text>
        <Text style={styles.logoText}>Scan Menu</Text>
        <Text style={styles.restaurantHint}>{t.restaurant}: {restaurant.name} · {t.table} {tableNumber}</Text>
      </View>
      <View style={styles.homeActions}>
        <BigArrowButton label={t.waiter} onPress={onWaiter} />
        <BigArrowButton label={t.application} onPress={onMenu} />
      </View>
      <BottomTabs active="waiter" t={t} onMenu={onMenu} onWaiter={onWaiter} onProfile={onProfile} />
    </View>
  );
}

export function MenuScreen(props: {
  t: AppCopy;
  language: string;
  restaurant: Restaurant;
  restaurants: Restaurant[];
  selectedRestaurantId: string;
  menu: MenuItem[];
  topItems: MenuItem[];
  cartCount: number;
  search: string;
  onSearch: (value: string) => void;
  onSelectRestaurant: (id: string) => void;
  onBack: () => void;
  onOpenBasket: () => void;
  onOpenOrders: () => void;
  onOpenProfile: () => void;
  onOpenWaiter: () => void;
  onOpenItem: (item: MenuItem) => void;
  onAdd: (id: string) => void;
}) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title={props.t.menu} language={props.language} onBack={props.onBack} />
      <ScrollView contentContainerStyle={styles.menuContent} showsVerticalScrollIndicator={false}>
        <Text style={styles.restaurantName}>{props.restaurant.name}</Text>
        <TextInput value={props.search} onChangeText={props.onSearch} placeholder={props.t.search} placeholderTextColor="#dbe6e1" style={styles.search} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.restaurantStrip}>
          {props.restaurants.map((item) => (
            <Pressable key={item.id} onPress={() => props.onSelectRestaurant(item.id)} style={[styles.restaurantChip, item.id === props.selectedRestaurantId && styles.restaurantChipActive]}>
              <Text style={[styles.restaurantChipText, item.id === props.selectedRestaurantId && styles.restaurantChipTextActive]}>{item.name}</Text>
            </Pressable>
          ))}
        </ScrollView>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.bannerRow}>
          <View style={styles.banner}><Text style={styles.bannerDiscount}>DISCOUNT</Text><Text style={styles.bannerText}>50%{"\n"}{props.t.discounts}</Text></View>
          <View style={[styles.banner, styles.bannerPhoto]}><Text style={styles.happy}>HAPPY HOURS{"\n"}-20</Text></View>
          <View style={styles.banner}><Text style={styles.bannerText}>{props.restaurant.operatingLanguage.toUpperCase()} kitchen</Text></View>
        </ScrollView>
        <View style={styles.toggleRow}><Text style={styles.toggleOn}>{props.t.often}</Text><Text style={styles.toggleOff}>{props.t.discounts}</Text></View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.oftenRow}>
          {props.topItems.map((item) => <SmallFoodCard key={item.id} item={item} onPress={() => props.onOpenItem(item)} onAdd={() => props.onAdd(item.id)} discount />)}
        </ScrollView>
        <View style={styles.grid}>
          {props.menu.map((item) => <LargeFoodCard key={item.id} item={item} onPress={() => props.onOpenItem(item)} onAdd={() => props.onAdd(item.id)} />)}
        </View>
      </ScrollView>
      <FloatingBasket count={props.cartCount} onPress={props.onOpenBasket} />
      <BottomTabs active="menu" t={props.t} onProfile={props.onOpenProfile} onMenu={props.onOpenOrders} onFavorite={props.onOpenBasket} onWaiter={props.onOpenWaiter} />
    </View>
  );
}

export function DetailScreen({ t, language, item, quantity, onBack, onBasket, onAdd, onInc, onDec }: { t: AppCopy; language: string; item: MenuItem; quantity: number; onBack: () => void; onBasket: () => void; onAdd: () => void; onInc: () => void; onDec: () => void }) {
  const ingredients = item.displayDescription.split(",").map((part) => part.trim()).filter(Boolean);
  return (
    <View style={styles.fullScreen}>
      <TopBar language={language} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.detailScroll}>
        <Image source={getMenuItemImage(item)} style={styles.detailImage} />
        <View style={styles.detailCard}>
          <Text style={styles.detailName}>{item.displayName}</Text>
          <View style={styles.calorieRow}><Text style={styles.calories}>407 cal</Text><Text style={styles.badge}>gluten free</Text></View>
          <Text style={styles.orangeHeading}>{t.ingredients}</Text>
          <Text style={styles.detailDescription}>{item.displayDescription}</Text>
          <View style={styles.counter}><Text onPress={onDec} style={styles.counterText}>−</Text><Text style={styles.counterText}>{Math.max(quantity, 1)}</Text><Text onPress={onInc} style={styles.counterText}>+</Text></View>
          <OrangeButton label={`${t.addFor} ${formatCurrency(item.price, item.currency)}`} onPress={onAdd} />
          {ingredients.length ? (
            <View style={styles.ingredientGrid}>
              {ingredients.slice(0, 8).map((ingredient) => (
                <View key={ingredient} style={styles.ingredientItem}>
                  <Text style={styles.ingredientDot}>●</Text>
                  <Text numberOfLines={2} style={styles.ingredientText}>{ingredient}</Text>
                  <Pressable style={styles.addMini}><Text style={styles.addMiniText}>{t.add}</Text></Pressable>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
      <FloatingBasket count={quantity} onPress={onBasket} />
      <BottomTabs active="menu" t={t} />
    </View>
  );
}

export function BasketScreen(props: { t: AppCopy; language: string; items: MenuItem[]; cart: Record<string, number>; total: number; note: string; onNote: (value: string) => void; onBack: () => void; onCheckout: () => void; onInc: (id: string) => void; onDec: (id: string) => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title={props.t.basket} language={props.language} onBack={props.onBack} />
      {props.items.length ? (
        <View style={styles.pageContent}>
          <Text style={styles.sectionTitle}>{props.t.pending}</Text>
          {props.items.map((item) => <OrderLine key={item.id} item={item} qty={props.cart[item.id] ?? 0} controls onInc={() => props.onInc(item.id)} onDec={() => props.onDec(item.id)} />)}
          <TextInput value={props.note} onChangeText={props.onNote} placeholder={props.t.ingredients} placeholderTextColor="#8aa096" style={styles.noteInput} />
          <Text style={styles.totalText}>{props.t.total}: {formatCurrency(props.total, props.items[0]?.currency)}</Text>
          <View style={styles.bottomButtonSlot}><OrangeButton label={props.t.checkout} onPress={props.onCheckout} /></View>
        </View>
      ) : (
        <View style={styles.emptyBasket}><Text style={styles.emptyCup}>☕</Text><Text style={styles.emptyText}>{props.t.emptyBasket}</Text></View>
      )}
      <BottomTabs active="menu" t={props.t} />
    </View>
  );
}

export function PaymentScreen(props: { t: AppCopy; language: string; mode: PaymentMode; total: number; busy: boolean; message: string; items: MenuItem[]; cart: Record<string, number>; onMode: (mode: PaymentMode) => void; onBack: () => void; onPay: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title={props.t.payment} language={props.language} onBack={props.onBack} />
      <View style={styles.pageContent}>
        <Radio label={props.t.cash} active={props.mode === "cash"} onPress={() => props.onMode("cash")} />
        <Radio label={props.t.online} active={props.mode === "online"} onPress={() => props.onMode("online")} />
        {props.mode === "online" ? (
          <>
            <View style={styles.cardChoiceRow}><View style={[styles.cardChoice, styles.cardChoiceActive]}><Text style={styles.visaText}>VISA</Text></View><View style={styles.cardChoice}><Text style={styles.masterText}>MasterCard</Text></View></View>
            <View style={styles.creditCard}><Text style={styles.visaText}>VISA</Text><Text style={styles.cardLabel}>CARD NUMBER</Text><View style={styles.cardInput} /><View style={styles.cardBottom}><View><Text style={styles.cardLabel}>CARD HOLDER</Text><View style={[styles.cardInput, styles.cardHolder]} /></View><Text style={styles.cardLabel}>EXPIRES{"\n"}__/__</Text></View></View>
          </>
        ) : (
          <View style={styles.cashList}>{props.items.map((item) => <OrderLine key={item.id} item={item} qty={props.cart[item.id] ?? 0} />)}</View>
        )}
        <Text style={styles.paymentAmount}>{props.t.payment}: <Text style={styles.amount}>{formatCurrency(props.total, props.items[0]?.currency)}</Text></Text>
        {props.message ? <Text style={styles.errorText}>{props.message}</Text> : null}
        <View style={styles.bottomButtonSlot}><OrangeButton label={props.busy ? props.t.loading : props.t.pay} onPress={props.onPay} disabled={props.busy} /></View>
      </View>
      <BottomTabs active="menu" t={props.t} />
    </View>
  );
}

export function ThanksScreen({ t, onDone }: { t: AppCopy; onDone: () => void }) {
  return (
    <View style={styles.screenPad}>
      <View style={styles.successBody}>
        <View style={styles.successCircle}><Text style={styles.successCheck}>✓</Text></View>
        <Text style={styles.thanksTitle}>{t.thanks}</Text>
        <Text style={styles.thanksSub}>{t.thanksBody}</Text>
      </View>
      <View style={styles.bottomButtonSlot}><OrangeButton label={t.great} onPress={onDone} /></View>
    </View>
  );
}

export function OrdersScreen({ t, language, orders, onBack, onRefresh }: { t: AppCopy; language: string; orders: CustomerOrder[]; onBack: () => void; onRefresh: () => void }) {
  const pending = orders.filter((order) => !["completed", "cancelled"].includes(order.status));
  const past = orders.filter((order) => ["completed", "cancelled"].includes(order.status));
  return (
    <View style={styles.fullScreen}>
      <TopBar title={t.orders} language={language} onBack={onBack} />
      <ScrollView contentContainerStyle={styles.pageScroll}>
        <OrangeButton label={t.retry} onPress={onRefresh} />
        <Text style={styles.sectionTitle}>{t.pending}</Text>
        {pending.length ? pending.map((order) => <OrderSummary key={order.id} order={order} />) : <Text style={styles.emptySmall}>{t.noOrders}</Text>}
        <Text style={[styles.sectionTitle, styles.pastTitle]}>{t.past}</Text>
        {past.map((order) => <OrderSummary key={order.id} order={order} />)}
      </ScrollView>
      <BottomTabs active="menu" t={t} />
    </View>
  );
}

export function ProfileScreen(props: { t: AppCopy; language: string; languages: typeof supportedLanguages; customer: CustomerUser | null; restaurant: Restaurant; tableNumber: string; busy: boolean; onLanguage: (value: string) => void; onBack: () => void; onOrders: () => void; onLogout: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title={props.t.profile} language={props.language} onBack={props.onBack} />
      <View style={styles.profileHeader}><Image source={images.profile} style={styles.avatar} /><View><Text style={styles.profileName}>{props.customer?.name ?? "Guest"}</Text><Text style={styles.profileMeta}>{props.restaurant.name}</Text><Text style={styles.profileMeta}>{props.t.table} {props.tableNumber}</Text></View></View>
      <View style={styles.profileList}>
        <Text style={styles.profileMain}>⚙  {props.t.settings}</Text>
        <Text style={styles.profileLink}>{props.t.language}</Text>
        <View style={styles.profileLanguageGrid}>
          {props.languages.slice(0, 8).map((item) => (
            <Pressable key={item.code} onPress={() => props.onLanguage(item.code)} style={[styles.profileLanguageButton, props.language === item.code && styles.segmentActive]}>
              <Text style={styles.profileLanguageText}>{item.nativeName}</Text>
            </Pressable>
          ))}
        </View>
        <Pressable onPress={props.onOrders}><Text style={styles.profileMain}>▤  {props.t.orders}</Text></Pressable>
        <Pressable disabled={props.busy} onPress={props.onLogout}><Text style={styles.profileMain}>↪  {props.busy ? props.t.loading : props.t.logout}</Text></Pressable>
      </View>
      <BottomTabs active="profile" t={props.t} />
    </View>
  );
}

export function WaiterScreen({ t, onBack }: { t: AppCopy; onBack: () => void }) {
  return (
    <View style={styles.fullScreen}>
      <TopBar title={t.waiterDone} onBack={onBack} />
      <View style={styles.waiterBody}>
        <Text style={styles.waiterIcon}>🍽</Text>
        <Text style={styles.waiterText}>{t.waiterBody}</Text>
      </View>
      <BottomTabs active="waiter" t={t} />
    </View>
  );
}

function SmallFoodCard({ item, discount, onPress, onAdd }: { item: MenuItem; discount?: boolean; onPress: () => void; onAdd: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.smallFood}>
      <Image source={getMenuItemImage(item)} style={styles.smallFoodImage} />
      <Text numberOfLines={2} style={styles.smallFoodName}>{item.displayName}</Text>
      <Text numberOfLines={3} style={styles.smallFoodDescription}>{item.displayDescription}</Text>
      <View style={styles.priceRow}><Text style={styles.oldPrice}>{discount ? formatCurrency(item.price + 2, item.currency) : ""}</Text><Text style={styles.priceOrange}> {formatCurrency(Math.max(item.price - (discount ? 1 : 0), 1), item.currency)}</Text><Pressable onPress={onAdd}><Text style={styles.plusCircle}>+</Text></Pressable></View>
    </Pressable>
  );
}

function LargeFoodCard({ item, onPress, onAdd }: { item: MenuItem; onPress: () => void; onAdd: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.largeFood}>
      <Image source={getMenuItemImage(item)} style={styles.largeFoodImage} />
      <Text numberOfLines={2} style={styles.largeFoodName}>{item.displayName}</Text>
      <Text numberOfLines={3} style={styles.largeFoodDescription}>{item.displayDescription}</Text>
      <View style={styles.priceRow}><Text style={styles.largePrice}>{formatCurrency(item.price, item.currency)}</Text><Pressable onPress={onAdd}><Text style={styles.plusCircle}>+</Text></Pressable></View>
    </Pressable>
  );
}

function OrderLine({ item, qty, controls, onInc, onDec }: { item: MenuItem; qty: number; controls?: boolean; onInc?: () => void; onDec?: () => void }) {
  return (
    <View style={styles.orderLine}>
      <Image source={getMenuItemImage(item)} style={styles.orderImage} />
      <View style={styles.orderBody}><Text numberOfLines={2} style={styles.orderName}>{item.displayName}</Text>{controls ? <View style={styles.lineCounter}><Text onPress={onDec} style={styles.lineCounterText}>−</Text><Text style={styles.lineCounterText}>{qty}</Text><Text onPress={onInc} style={styles.lineCounterText}>+</Text></View> : <Text style={styles.orderQty}>{qty}</Text>}</View>
      <Text style={styles.orderPrice}>{formatCurrency(item.price, item.currency)}</Text>
    </View>
  );
}

function OrderSummary({ order }: { order: CustomerOrder }) {
  const firstLine = order.displayLines?.[0] ?? order.lines[0];
  return (
    <View style={styles.orderLine}>
      <Image source={images.bowl} style={styles.orderImage} />
      <View style={styles.orderBody}>
        <Text numberOfLines={2} style={styles.orderName}>{firstLine?.displayName ?? firstLine?.restaurantItemName ?? firstLine?.customerItemName ?? order.id}</Text>
        <Text style={styles.profileMeta}>{order.lines.reduce((sum, line) => sum + line.quantity, 0)} Items</Text>
        <Text style={styles.statusOrange}>{order.status}</Text>
      </View>
      <Text style={styles.orderPrice}>{formatCurrency(order.total, order.currency)}</Text>
    </View>
  );
}
