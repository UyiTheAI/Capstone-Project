import React, { createContext, useContext, useState, useEffect } from "react";
import T from "./translations";

const Ctx = createContext();
const KEY = "shiftup_lang";

const LANGUAGES = {
  en: { lang:"English",   flag:"🇨🇦", label:"English",  dir:"ltr" },
  fr: { lang:"Français",  flag:"🇫🇷", label:"French",   dir:"ltr" },
  zh: { lang:"中文",      flag:"🇨🇳", label:"Chinese",  dir:"ltr" },
  hi: { lang:"हिंदी",    flag:"🇮🇳", label:"Hindi",    dir:"ltr" },
  es: { lang:"Español",   flag:"🇲🇽", label:"Spanish",  dir:"ltr" },
  tl: { lang:"Filipino",  flag:"🇵🇭", label:"Tagalog",  dir:"ltr" },
  ar: { lang:"العربية",   flag:"🇸🇦", label:"Arabic",   dir:"rtl" },
};

const FONTS = {
  en: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif" },
  fr: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif" },
  zh: { url:"https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap", body:"'Noto Sans SC',sans-serif", head:"'Noto Sans SC',sans-serif" },
  hi: { url:"https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap", body:"'Noto Sans Devanagari',sans-serif", head:"'Noto Sans Devanagari',sans-serif" },
  es: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif" },
  tl: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif" },
  ar: { url:"https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap", body:"'Noto Sans Arabic',sans-serif", head:"'Noto Sans Arabic',sans-serif" },
};

function applyFont(code) {
  const f = FONTS[code] || FONTS.en;
  const d = LANGUAGES[code]?.dir || "ltr";
  let link = document.getElementById("su-lang-font");
  if (!link) { link = document.createElement("link"); link.id = "su-lang-font"; link.rel = "stylesheet"; document.head.appendChild(link); }
  link.href = f.url;
  const root = document.documentElement;
  root.style.setProperty("--font-body", f.body);
  root.style.setProperty("--font-head", f.head);
  root.lang = code;
  root.dir  = d;
  document.body.style.fontFamily = f.body;
}

export function LanguageProvider({ children }) {
  const [lang, setLangState] = useState(() => {
    const saved = localStorage.getItem(KEY);
    if (saved && LANGUAGES[saved]) return saved;
    const b = navigator.language?.slice(0, 2).toLowerCase();
    return LANGUAGES[b] ? b : "en";
  });

  const [tObj, setTObj] = useState(() => T[lang] || T.en);

  useEffect(() => {
    applyFont(lang);
    localStorage.setItem(KEY, lang);
    setTObj(T[lang] || T.en);
  }, [lang]);

  useEffect(() => { applyFont(lang); }, []); // eslint-disable-line

  const setLang = (code) => {
    if (code === lang) return;
    if (!LANGUAGES[code]) return;
    setLangState(code);
  };

  const t = (key) => {
    if (!key) return "";
    const v = tObj?.[key];
    return (v !== undefined && v !== null) ? v : (T.en[key] ?? key);
  };

  const languages = Object.fromEntries(
    Object.entries(LANGUAGES).map(([k, v]) => [k, { ...v, isStatic: true }])
  );

  return (
    <Ctx.Provider value={{ lang, setLang, t, translating: false, languages, fontConfig: FONTS[lang] || FONTS.en }}>
      {children}
    </Ctx.Provider>
  );
}

export const useLanguage = () => {
  const c = useContext(Ctx);
  if (!c) throw new Error("useLanguage must be inside LanguageProvider");
  return c;
};
export default Ctx;
