import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

const DROP_W = 238;

export default function LanguageSwitcher({ light = false }) {
  const { lang, setLang, languages } = useLanguage();
  const [open, setOpen] = useState(false);
  const [pos,  setPos]  = useState({});
  const btnRef = useRef();

  // Close on outside click
  useEffect(() => {
    const h = (e) => {
      if (btnRef.current && !btnRef.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const handleToggle = () => {
    if (!open && btnRef.current) {
      const r       = btnRef.current.getBoundingClientRect();
      const vw      = window.innerWidth;
      const vh      = window.innerHeight;
      const dropH   = Math.min(Object.keys(languages).length * 52 + 76, 380);

      // ── Vertical: open upward if not enough space below ──────────────
      const openUp  = vh - r.bottom < dropH + 12;
      const top     = openUp ? r.top - dropH - 6 : r.bottom + 6;

      // ── Horizontal: right-align to button; clamp so it never overflows ─
      // Try to align dropdown's right edge with button's right edge
      let left = r.right - DROP_W;
      if (left < 8)           left = 8;           // don't overflow left
      if (left + DROP_W > vw - 8) left = vw - DROP_W - 8; // don't overflow right

      setPos({ top, left });
    }
    setOpen(o => !o);
  };

  const cur = languages[lang] || languages.en;

  return (
    <div ref={btnRef} style={{ position: "relative", userSelect: "none", flexShrink: 0 }}>

      {/* ── Trigger button ── */}
      <button
        onClick={handleToggle}
        style={{
          display: "flex", alignItems: "center", gap: 7,
          background: light ? "rgba(255,255,255,.15)" : "#f0f0ec",
          border:     light ? "1px solid rgba(255,255,255,.25)" : "1px solid transparent",
          borderRadius: 8, padding: "6px 12px", cursor: "pointer",
          color:        light ? "#fff" : "#1a1a1a",
          fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
          transition: "all .15s",
        }}>
        <span style={{ fontSize: 16 }}>{cur.flag}</span>
        <span style={{ fontFamily: "'DM Sans',sans-serif", fontSize: 13 }}>{cur.lang}</span>
        <span style={{ fontSize: 9, opacity: .45, marginLeft: 2, transform: open ? "rotate(180deg)" : "none", display:"inline-block", transition:"transform .15s" }}>▾</span>
      </button>

      {open && (
        <>
          {/* Transparent backdrop — catches clicks outside */}
          <div onClick={() => setOpen(false)}
               style={{ position: "fixed", inset: 0, zIndex: 8000 }} />

          {/* Dropdown panel — fixed so no ancestor overflow can clip it */}
          <div style={{
            position: "fixed",
            top:      pos.top,
            left:     pos.left,
            width:    DROP_W,
            maxHeight: 380,
            overflowY: "auto",
            background: "#fff",
            borderRadius: 14,
            boxShadow: "0 12px 40px rgba(0,0,0,.18), 0 2px 8px rgba(0,0,0,.08)",
            zIndex: 8001,
            border: "1px solid #ebebeb",
          }}>

            <div style={{
              padding: "12px 16px 8px",
              background: "#f9f9f7",
              borderBottom: "1px solid #f0f0ec",
              position: "sticky", top: 0,
            }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "#aaa", textTransform: "uppercase", letterSpacing: 1, fontFamily: "'DM Sans',sans-serif" }}>
                🍁 Canadian Languages
              </div>
            </div>

            {Object.entries(languages).map(([code, data]) => {
              const active = lang === code;
              return (
                <button key={code}
                  onClick={() => { setLang(code); setOpen(false); }}
                  style={{
                    width: "100%", display: "flex", alignItems: "center", gap: 12,
                    padding: "11px 16px",
                    border: "none", borderBottom: "1px solid #f5f5f5",
                    cursor: "pointer", textAlign: "left",
                    fontFamily: "'DM Sans',sans-serif", fontSize: 13,
                    fontWeight: active ? 700 : 500,
                    background: active ? "#1a1a1a" : "#fff",
                    color:      active ? "#f5b800" : "#333",
                    transition: "background .1s",
                  }}
                  onMouseEnter={e => { if (!active) e.currentTarget.style.background = "#f5f5f5"; }}
                  onMouseLeave={e => { if (!active) e.currentTarget.style.background = "#fff"; }}>
                  <span style={{ fontSize: 20, flexShrink: 0 }}>{data.flag}</span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      {data.lang}
                    </div>
                    {data.label && (
                      <div style={{ fontSize: 11, color: active ? "rgba(245,184,0,.7)" : "#bbb", marginTop: 1 }}>
                        {data.label}
                      </div>
                    )}
                  </div>
                  {active && <span style={{ fontSize: 13, flexShrink: 0, color: "#f5b800" }}>✓</span>}
                </button>
              );
            })}

            <div style={{ padding: "8px 16px", fontSize: 10, color: "#ccc", fontFamily: "'DM Sans',sans-serif", textAlign: "center", borderTop: "1px solid #f0f0ec" }}>
              7 languages supported
            </div>
          </div>
        </>
      )}
    </div>
  );
}
