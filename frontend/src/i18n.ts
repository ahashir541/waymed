import i18n, { type Resource } from "i18next";
import { initReactI18next } from "react-i18next";
import english from "./locales/en.json";
import urdu from "./locales/ur.json";
import sindhi from "./locales/sd.json";

export const supportedLanguages = ["en", "ur", "sd"] as const;
export type Language = (typeof supportedLanguages)[number];

const directionByLanguage: Record<Language, "ltr" | "rtl"> = {
  en: "ltr",
  ur: "rtl",
  sd: "rtl",
};

function detectLanguage(): Language {
  try {
    // A saved visitor choice takes priority over the browser's language hint.
    const saved = window.localStorage.getItem("waymed-language");
    if (saved && supportedLanguages.includes(saved as Language)) {
      return saved as Language;
    }

    for (const browserLanguage of window.navigator.languages) {
      const baseLanguage = browserLanguage.split("-")[0]?.toLowerCase();
      if (baseLanguage && supportedLanguages.includes(baseLanguage as Language)) {
        return baseLanguage as Language;
      }
    }
  } catch (error) {
    console.warn("Language preference could not be read from browser storage.", error);
  }
  return "en";
}

const resources: Resource = {
  en: { translation: english },
  ur: { translation: urdu },
  sd: { translation: sindhi },
};

void i18n.use(initReactI18next).init({
  resources,
  lng: detectLanguage(),
  fallbackLng: "en",
  supportedLngs: [...supportedLanguages],
  interpolation: { escapeValue: false },
  react: { useSuspense: false },
});

i18n.on("languageChanged", (language) => {
  // Urdu and Sindhi use right-to-left layout; English uses left-to-right.
  const normalized = supportedLanguages.includes(language as Language)
    ? (language as Language)
    : "en";
  document.documentElement.lang = normalized;
  document.documentElement.dir = directionByLanguage[normalized];
  try {
    window.localStorage.setItem("waymed-language", normalized);
  } catch (error) {
    console.warn("Language preference could not be saved to browser storage.", error);
  }
});

document.documentElement.lang = i18n.language;
document.documentElement.dir =
  directionByLanguage[i18n.language as Language] ?? "ltr";

export default i18n;
