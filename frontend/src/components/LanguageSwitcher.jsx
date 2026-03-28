import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

export default function LanguageSwitcher({ light = false }) {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = languages[lang];

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 6,
          background: light ? "rgba(255,255,255,.12)" : "#f0f0ec",
          border: "none", borderRadius: 8,
          padding: "6px 12px", cursor: "pointer",
          color: light ? "#fff" : "#333",
          fontWeight: 600, fontSize: 12,
        }}
      >
        <span style={{ fontSize: 16 }}>{current.flag}</span>
        <span>{current.lang}</span>
        <span style={{ fontSize: 10, opacity: .6 }}>▼</span>
      </button>

      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 6px)", right: 0,
          background: "#fff", borderRadius: 12, minWidth: 160,
          boxShadow: "0 8px 30px rgba(0,0,0,.15)", zIndex: 9999,
          overflow: "hidden", border: "1px solid #f0f0ec",
        }}>
          {Object.entries(languages).map(([code, data]) => (
            <button
              key={code}
              onClick={() => { setLang(code); setOpen(false); }}
              style={{
                width: "100%", display: "flex", alignItems: "center", gap: 10,
                padding: "10px 16px", border: "none", cursor: "pointer", textAlign: "left",
                background: lang === code ? "#f5b800" : "#fff",
                color: lang === code ? "#1a1a1a" : "#333",
                fontWeight: lang === code ? 800 : 500, fontSize: 13,
                borderBottom: "1px solid #f5f5f5",
                transition: "background .1s",
              }}
              onMouseEnter={e => { if (lang !== code) e.currentTarget.style.background = "#fafaf8"; }}
              onMouseLeave={e => { if (lang !== code) e.currentTarget.style.background = "#fff"; }}
            >
              <span style={{ fontSize: 20 }}>{data.flag}</span>
              <span>{data.lang}</span>
              {lang === code && <span style={{ marginLeft: "auto", fontSize: 12 }}>✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}