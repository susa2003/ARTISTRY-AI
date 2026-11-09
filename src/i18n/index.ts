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
