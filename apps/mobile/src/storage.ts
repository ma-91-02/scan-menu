import AsyncStorage from "@react-native-async-storage/async-storage";
import { storageKeys } from "./theme";

export interface OnboardingState {
  language: string | null;
  isDone: boolean;
}

export async function getOnboardingState(): Promise<OnboardingState> {
  const [language, onboardingDone] = await Promise.all([
    AsyncStorage.getItem(storageKeys.language),
    AsyncStorage.getItem(storageKeys.onboardingDone)
  ]);

  return {
    language,
    isDone: onboardingDone === "true"
  };
}

export async function completeOnboarding(language: string) {
  await Promise.all([
    persistLanguage(language),
    AsyncStorage.setItem(storageKeys.onboardingDone, "true")
  ]);
}

export async function persistLanguage(language: string) {
  await AsyncStorage.setItem(storageKeys.language, language);
}
