import React, { createContext, useContext, useState, useEffect, useRef } from "react";
import T from "./translations";
import api from "../api";

const Ctx = createContext();
const KEY = "shiftup_lang";

// Top languages used in Canada + practical for a workforce app
const AWS_LANGUAGES = {
  fr: { lang:"Français",  flag:"🇫🇷", label:"French"   }, // Official language Canada
  zh: { lang:"中文",      flag:"🇨🇳", label:"Chinese"   }, // Largest immigrant group
  hi: { lang:"हिंदी",    flag:"🇮🇳", label:"Hindi"     }, // Widely spoken South Asian language
  es: { lang:"Español",   flag:"🇲🇽", label:"Spanish"   }, // Growing Hispanic community
  tl: { lang:"Filipino",  flag:"🇵🇭", label:"Tagalog"   }, // Large Filipino community
  ar: { lang:"العربية",   flag:"🇸🇦", label:"Arabic"    }, // Growing Arabic community
};

const FONTS = {
  en: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif", dir:"ltr" },
  fr: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif", dir:"ltr" },
  zh: { url:"https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;600;700&display=swap", body:"'Noto Sans SC',sans-serif", head:"'Noto Sans SC',sans-serif", dir:"ltr" },
  hi: { url:"https://fonts.googleapis.com/css2?family=Noto+Sans+Devanagari:wght@400;600;700;800&display=swap", body:"'Noto Sans Devanagari',sans-serif", head:"'Noto Sans Devanagari',sans-serif", dir:"ltr" },
  es: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif", dir:"ltr" },
  tl: { url:"https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@300;400;500;600;700&display=swap", body:"'DM Sans',sans-serif", head:"'Bebas Neue',sans-serif", dir:"ltr" },
  ar: { url:"https://fonts.googleapis.com/css2?family=Noto+Sans+Arabic:wght@400;600;700&display=swap", body:"'Noto Sans Arabic',sans-serif", head:"'Noto Sans Arabic',sans-serif", dir:"rtl" },
};

function applyFont(code) {
  const f = FONTS[code] || FONTS.en;
  let link = document.getElementById("su-lang-font");
  if (!link) { link = document.createElement("link"); link.id="su-lang-font"; link.rel="stylesheet"; document.head.appendChild(link); }
  link.href = f.url;
  const root = document.documentElement;
  root.style.setProperty("--font-body", f.body);
  root.style.setProperty("--font-head", f.head);
  root.lang = code;
  root.dir  = f.dir;
  document.body.style.fontFamily = f.body;
}

export function LanguageProvider({ children }) {
  const [lang,        setLangState]  = useState(() => {
    const saved = localStorage.getItem(KEY);
    if (saved && (saved==="en" || AWS_LANGUAGES[saved])) return saved;
    const b = navigator.language?.slice(0,2).toLowerCase();
    return (b==="en" || AWS_LANGUAGES[b]) ? b : "en";
  });
  const [tObj,        setTObj]       = useState(T.en);
  const [translating, setTranslating]= useState(false);
  const cache = useRef({});

  useEffect(() => {
    applyFont(lang);
    localStorage.setItem(KEY, lang);
    if (lang==="en") { setTObj(T.en); }
    else if (cache.current[lang]) { setTObj(cache.current[lang]); }
  }, [lang]);

  useEffect(() => { applyFont(lang); }, []); // eslint-disable-line

  const setLang = async (code) => {
    if (code===lang) return;
    if (code==="en") { setLangState("en"); return; }
    if (!AWS_LANGUAGES[code]) return;
    if (cache.current[code]) { setTObj(cache.current[code]); setLangState(code); return; }

    setTranslating(true);
    try {
      const keys   = Object.keys(T.en).filter(k=>k!=="lang"&&k!=="flag");
      const values = keys.map(k=>T.en[k]);
      const res    = await api.post("/translate", { texts:values, targetLang:code });
      if (res.data.success && res.data.translations) {
        const out = { lang:AWS_LANGUAGES[code].lang, flag:AWS_LANGUAGES[code].flag };
        keys.forEach((k,i) => { out[k] = res.data.translations[i] || T.en[k]; });
        cache.current[code] = out;
        setTObj(out);
        setLangState(code);
      } else { setLangState("en"); }
    } catch(e) { console.error("AWS Translate:", e.message); setLangState("en"); }
    finally    { setTranslating(false); }
  };

  const t = (key) => {
    if (!key) return "";
    const v = tObj?.[key];
    return (v!==undefined&&v!==null) ? v : (T.en[key]??key);
  };

  const languages = {
    en: { lang:"English", flag:"🇨🇦", label:"English", isAWS:false },
    ...Object.fromEntries(Object.entries(AWS_LANGUAGES).map(([k,v])=>[k,{...v,isAWS:true}])),
  };

  return (
    <Ctx.Provider value={{ lang, setLang, t, translating, languages, fontConfig:FONTS[lang]||FONTS.en }}>
      {translating && (
        <div style={{ position:"fixed",top:0,left:0,right:0,height:3,zIndex:9999,overflow:"hidden",background:"#111" }}>
          <div style={{ height:"100%",background:"#f5b800",animation:"tbar 1.4s ease-in-out infinite" }} />
          <style>{`@keyframes tbar{0%{width:0%;margin-left:0}50%{width:60%;margin-left:20%}100%{width:0%;margin-left:100%}}`}</style>
        </div>
      )}
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