import React, { createContext, useContext, useState, useEffect } from "react";
import translations from "./translations";

const LanguageContext = createContext();

const STORAGE_KEY = "shiftup_lang";

export function LanguageProvider({ children }) {
  const [lang, setLang] = useState(() => {
    // 1. Saved preference
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    // 2. Browser language
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    if (browser && translations[browser]) return browser;
    return "en";
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, lang);
    document.documentElement.lang = lang;
  }, [lang]);

  const t = translations[lang] || translations.en;

  // Helper: translate with fallback to English
  const tr = (key) => t[key] ?? translations.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{ lang, setLang, t: tr, languages: translations }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}