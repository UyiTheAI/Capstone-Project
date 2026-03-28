import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

// Language code labels shown as text badges (emoji flags unreliable on Windows)
const LANG_CODES = { en: "EN", es: "ES", fr: "FR", pt: "PT" };

export default function LanguageSwitcher({ light = false }) {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const current = languages[lang];
  const code    = LANG_CODES[lang] || lang.toUpperCase();

  return (
    <div ref={ref} style={{ position: "relative", userSelect: "none" }}>

      {/* ── Trigger Button ── */}
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: light ? "rgba(255,255,255,.15)" : "#f0f0ec",
          border: light ? "1px solid rgba(255,255,255,.2)" : "1px solid transparent",
          borderRadius: 8, padding: "5px 11px",
          cursor: "pointer", color: light ? "#fff" : "#1a1a1a",
          fontWeight: 700, fontSize: 12, lineHeight: 1,
        }}
      >
        {/* Code badge */}
        <span style={{
          background: light ? "rgba(255,255,255,.25)" : "#1a1a1a",
          color: light ? "#fff" : "#f5b800",
          borderRadius: 5, padding: "2px 5px",
          fontSize: 10, fontWeight: 800, letterSpacing: .5,
        }}>
          {code}
        </span>
        <span style={{ fontSize: 12 }}>{current.lang}</span>
        <span style={{ fontSize: 9, opacity: .5, marginLeft: 2 }}>▼</span>
      </button>

      {/* ── Dropdown ── */}
      {open && (
        <div style={{
          position: "absolute", top: "calc(100% + 8px)", right: 0,
          background: "#fff", borderRadius: 14, minWidth: 170,
          boxShadow: "0 12px 40px rgba(0,0,0,.15)", zIndex: 9999,
          overflow: "hidden", border: "1px solid #f0f0ec",
        }}>
          {/* Header label */}
          <div style={{
            padding: "8px 16px 6px", fontSize: 10, fontWeight: 700,
            color: "#aaa", textTransform: "uppercase", letterSpacing: 1,
            borderBottom: "1px solid #f5f5f5",
          }}>
            Language
          </div>

          {Object.entries(languages).map(([code, data], i, arr) => {
            const isActive  = lang === code;
            const shortCode = LANG_CODES[code] || code.toUpperCase();
            return (
              <button
                key={code}
                onClick={() => { setLang(code); setOpen(false); }}
                style={{
                  width: "100%", display: "flex", alignItems: "center", gap: 10,
                  padding: "10px 16px",
                  border: "none",
                  borderBottom: i < arr.length - 1 ? "1px solid #f5f5f5" : "none",
                  cursor: "pointer", textAlign: "left",
                  background: isActive ? "#f5b800" : "#fff",
                  color: isActive ? "#1a1a1a" : "#333",
                  fontWeight: isActive ? 800 : 500,
                  fontSize: 13,
                  transition: "background .12s",
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = "#fafaf8"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = "#fff"; }}
              >
                {/* Code badge */}
                <span style={{
                  background: isActive ? "rgba(0,0,0,.15)" : "#f0f0ec",
                  color: isActive ? "#1a1a1a" : "#666",
                  borderRadius: 5, padding: "2px 6px",
                  fontSize: 10, fontWeight: 800, letterSpacing: .5,
                  minWidth: 28, textAlign: "center",
                }}>
                  {shortCode}
                </span>

                {/* Language name */}
                <span style={{ flex: 1 }}>{data.lang}</span>

                {/* Active checkmark */}
                {isActive && (
                  <span style={{
                    fontSize: 13, fontWeight: 800, color: "#1a1a1a",
                  }}>✓</span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}