import React, { createContext, useContext, useState, useEffect } from "react";
import translations from "./translations";

const LanguageContext = createContext();
const STORAGE_KEY = "shiftup_lang";

/* ── Font config per language ──────────────────────────────────────────────
   Each language has:
   - googleUrl : the Google Fonts URL to inject
   - bodyFont  : CSS font-family for body text
   - headFont  : CSS font-family for headings (Bebas Neue replacement)
   - dir       : text direction (ltr / rtl)
──────────────────────────────────────────────────────────────────────────── */
const LANG_FONTS = {
  en: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    bodyFont:  "'DM Sans', sans-serif",
    headFont:  "'Bebas Neue', sans-serif",
    dir:       "ltr",
  },
  es: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    bodyFont:  "'DM Sans', sans-serif",
    headFont:  "'Bebas Neue', sans-serif",
    dir:       "ltr",
  },
  fr: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    bodyFont:  "'DM Sans', sans-serif",
    headFont:  "'Bebas Neue', sans-serif",
    dir:       "ltr",
  },
  pt: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap",
    bodyFont:  "'DM Sans', sans-serif",
    headFont:  "'Bebas Neue', sans-serif",
    dir:       "ltr",
  },
  hi: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Tiro+Devanagari+Hindi:ital@0;1&family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap",
    bodyFont:  "'Noto Sans Devanagari', sans-serif",
    headFont:  "'Tiro Devanagari Hindi', serif",
    dir:       "ltr",
  },
  ja: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@300;400;500;600;700;800&display=swap",
    bodyFont:  "'Noto Sans JP', sans-serif",
    headFont:  "'Noto Sans JP', sans-serif",
    dir:       "ltr",
  },
  zh: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@300;400;500;600;700;800&display=swap",
    bodyFont:  "'Noto Sans SC', sans-serif",
    headFont:  "'Noto Sans SC', sans-serif",
    dir:       "ltr",
  },
  mr: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;500;600;700;800&display=swap",
    bodyFont:  "'Noto Sans Devanagari', sans-serif",
    headFont:  "'Noto Sans Devanagari', sans-serif",
    dir:       "ltr",
  },
  ko: {
    googleUrl: "https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@300;400;500;600;700;800&display=swap",
    bodyFont:  "'Noto Sans KR', sans-serif",
    headFont:  "'Noto Sans KR', sans-serif",
    dir:       "ltr",
  },
};

const DEFAULT_FONT = LANG_FONTS.en;

/* ── inject / swap Google Font link tag ─────────────────────────────────── */
function applyFont(langCode) {
  const config = LANG_FONTS[langCode] || DEFAULT_FONT;

  // 1. Swap or create the <link> tag
  let link = document.getElementById("shiftup-lang-font");
  if (!link) {
    link = document.createElement("link");
    link.id  = "shiftup-lang-font";
    link.rel = "stylesheet";
    document.head.appendChild(link);
  }
  link.href = config.googleUrl;

  // 2. Apply CSS variables on :root so every component picks them up
  const root = document.documentElement;
  root.style.setProperty("--font-body", config.bodyFont);
  root.style.setProperty("--font-head", config.headFont);
  root.lang = langCode;
  root.dir  = config.dir;

  // 3. Apply directly to body for immediate effect
  document.body.style.fontFamily = config.bodyFont;
}

/* ── Provider ────────────────────────────────────────────────────────────── */
export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved   = localStorage.getItem(STORAGE_KEY);
    if (saved && translations[saved]) return saved;
    const browser = navigator.language?.slice(0, 2).toLowerCase();
    if (browser && translations[browser]) return browser;
    return "en";
  });

  // Apply font whenever lang changes
  useEffect(() => {
    applyFont(lang);
    localStorage.setItem(STORAGE_KEY, lang);
  }, [lang]);

  // Apply on first render too
  useEffect(() => { applyFont(lang); }, []); // eslint-disable-line

  const setLang = (code) => {
    if (translations[code]) setLangState(code);
  };

  const tObj = translations[lang] || translations.en;
  const tr   = (key) => tObj[key] ?? translations.en[key] ?? key;

  return (
    <LanguageContext.Provider value={{
      lang,
      setLang,
      t: tr,
      languages: translations,
      fontConfig: LANG_FONTS[lang] || DEFAULT_FONT,
    }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used inside LanguageProvider");
  return ctx;
}