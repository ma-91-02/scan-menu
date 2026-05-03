import { Pressable, Text, View } from "react-native";
import type { AppCopy } from "../i18n";
import { styles } from "../styles";

interface TopBarProps {
  title?: string;
  language?: string;
  onBack?: () => void;
}

export function TopBar({ title, language, onBack }: TopBarProps) {
  return (
    <View style={styles.top}>
      {onBack ? (
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backText}>‹</Text>
        </Pressable>
      ) : (
        <View style={styles.backButton} />
      )}
      {title ? <Text style={styles.screenTitle}>{title}</Text> : <View />}
      {language ? <Text style={styles.language}>{language.toUpperCase()}</Text> : <View style={styles.langSpace} />}
    </View>
  );
}

interface BottomTabsProps {
  active: string;
  t: AppCopy;
  onProfile?: () => void;
  onMenu?: () => void;
  onFavorite?: () => void;
  onWaiter?: () => void;
}

export function BottomTabs({ active, t, onProfile, onMenu, onFavorite, onWaiter }: BottomTabsProps) {
  const tabs = [
    ["profile", "👤", t.profile, onProfile],
    ["menu", "▤", t.orders, onMenu],
    ["favorite", "★", t.basket, onFavorite],
    ["waiter", "🍽", t.waiter, onWaiter]
  ] as const;

  return (
    <View style={styles.bottomNav}>
      {tabs.map(([id, icon, label, onPress]) => (
        <Pressable key={id} onPress={onPress} style={styles.tab}>
          <Text style={[styles.tabIcon, active === id && styles.tabActive]}>{icon}</Text>
          <Text numberOfLines={1} style={[styles.tabLabel, active === id && styles.tabActive]}>
            {label}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

export function Radio({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.radioRow}>
      <View style={[styles.radioOuter, active && styles.radioOuterActive]}>
        <View style={active ? styles.radioInner : undefined} />
      </View>
      <Text style={styles.radioLabel}>{label}</Text>
    </Pressable>
  );
}

export function OrangeButton({ label, onPress, disabled }: { label: string; onPress: () => void; disabled?: boolean }) {
  return (
    <Pressable disabled={disabled} onPress={onPress} style={[styles.orangeButton, disabled && styles.buttonDisabled]}>
      <Text style={styles.orangeButtonText}>{label}</Text>
    </Pressable>
  );
}

export function BigArrowButton({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.bigArrow}>
      <Text style={styles.bigArrowText}>{label}</Text>
      <Text style={styles.bigArrowIcon}>→</Text>
    </Pressable>
  );
}

export function FloatingBasket({ count, onPress }: { count: number; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={styles.floatingBasket}>
      <Text style={styles.floatingBasketText}>🛒</Text>
      {count ? <Text style={styles.cartBadge}>{count}</Text> : null}
    </Pressable>
  );
}
