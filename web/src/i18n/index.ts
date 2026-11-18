import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./en.json";
import hi from "./hi.json";
import mr from "./mr.json";

const resources = {
  en: { translation: en },
  hi: { translation: hi },
  mr: { translation: mr },
};

const savedLanguage =
  typeof window !== "undefined" ? localStorage.getItem("saans.lang") || "en" : "en";

// Set html lang attribute
if (typeof document !== "undefined") {
  document.documentElement.lang = savedLanguage;
}

i18n.use(initReactI18next).init({
  resources,
  lng: savedLanguage,
  fallbackLng: "en",
  interpolation: {
    escapeValue: false,
  },
});

export const changeLanguage = (lang: "en" | "hi" | "mr") => {
  i18n.changeLanguage(lang);
  if (typeof document !== "undefined") {
    document.documentElement.lang = lang;
    localStorage.setItem("saans.lang", lang);
  }
};

export default i18n;
