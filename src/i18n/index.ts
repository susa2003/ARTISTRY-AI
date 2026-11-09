import { useAppStore } from "../state/appStore";
import { en, TranslationKeys } from "./en";
import { ta } from "./ta";

export type SupportedLanguage = "en" | "ta";

export const translations: Record<SupportedLanguage, TranslationKeys> = {
  en,
  ta,
};

export function getTranslation(lang: SupportedLanguage = "en"): TranslationKeys {
  return translations[lang] || en;
}

export function t(lang: SupportedLanguage, keyPath: string): string {
  const dict = translations[lang] || en;
  const parts = keyPath.split(".");
  let cur: any = dict;
  for (const part of parts) {
    if (cur && typeof cur === "object" && part in cur) {
      cur = cur[part];
    } else {
      return keyPath;
    }
  }
  return typeof cur === "string" ? cur : keyPath;
}

export function useTranslation() {
  const language = useAppStore((state) => (state as any).language || "en") as SupportedLanguage;
  const setLanguage = useAppStore((state) => (state as any).setLanguage);

  return {
    t: translations[language] || en,
    language,
    setLanguage: (newLang: SupportedLanguage) => {
      if (setLanguage) {
        setLanguage(newLang);
      }
    },
  };
}
