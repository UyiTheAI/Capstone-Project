import React, { useState, useRef, useEffect } from "react";
import { useLanguage } from "../context/LanguageContext";

const CODES = { en:"EN",fr:"FR",zh:"中",hi:"हि",es:"ES",tl:"TL",ar:"ع" };

export default function LanguageSwitcher({ light = false }) {
  const { lang, setLang, languages, translating } = useLanguage();
  const [open, setOpen] = useState(false);
  const ref = useRef();

  useEffect(() => {
    const h = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const cur  = languages[lang] || languages.en;
  const code = CODES[lang] || lang.toUpperCase();

  return (
    <div ref={ref} style={{ position:"relative", userSelect:"none", flexShrink:0 }}>
      <button
        onClick={() => !translating && setOpen(o=>!o)}
        disabled={translating}
        style={{ display:"flex", alignItems:"center", gap:7, background:light?"rgba(255,255,255,.15)":"#f0f0ec", border:light?"1px solid rgba(255,255,255,.2)":"1px solid transparent", borderRadius:8, padding:"6px 12px", cursor:translating?"not-allowed":"pointer", color:light?"#fff":"#1a1a1a", fontFamily:"var(--font-body)", fontSize:12, fontWeight:700, opacity:translating?.7:1, transition:"all .15s" }}>
        {translating ? (
          <>
            <span style={{ width:12,height:12,border:`2px solid ${light?"#fff":"#f5b800"}`,borderTopColor:"transparent",borderRadius:"50%",animation:"ls .7s linear infinite",display:"inline-block" }} />
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:11 }}>Translating…</span>
            <style>{`@keyframes ls{to{transform:rotate(360deg)}}`}</style>
          </>
        ) : (
          <>
            <span style={{ fontSize:16 }}>{cur.flag}</span>
            <span style={{ fontFamily:"'DM Sans',sans-serif",fontSize:13 }}>{cur.lang}</span>
            <span style={{ fontSize:9,opacity:.4,marginLeft:2 }}>▾</span>
          </>
        )}
      </button>

      {open && !translating && (
        <>
          <div onClick={()=>setOpen(false)} style={{ position:"fixed",inset:0,zIndex:498 }} />
          <div style={{ position:"absolute",top:"calc(100% + 8px)",right:0,background:"#fff",borderRadius:14,minWidth:220,boxShadow:"0 16px 48px rgba(0,0,0,.16)",zIndex:499,overflow:"hidden",border:"1px solid #f0f0ec" }}>

            {/* Header */}
            <div style={{ padding:"12px 16px 8px",background:"#f9f9f7",borderBottom:"1px solid #f0f0ec" }}>
              <div style={{ fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",letterSpacing:1,fontFamily:"'DM Sans',sans-serif" }}>🍁 Canadian Languages</div>
            </div>

            {Object.entries(languages).map(([code, data]) => {
              const active = lang === code;
              return (
                <button key={code}
                  onClick={() => { setLang(code); setOpen(false); }}
                  style={{ width:"100%",display:"flex",alignItems:"center",gap:12,padding:"11px 16px",border:"none",borderBottom:"1px solid #f9f9f7",cursor:"pointer",textAlign:"left",fontFamily:"'DM Sans',sans-serif",fontSize:13,fontWeight:active?700:500,background:active?"#1a1a1a":"#fff",color:active?"#f5b800":"#333",transition:"background .12s" }}
                  onMouseEnter={e=>{if(!active)e.currentTarget.style.background="#f9f9f7";}}
                  onMouseLeave={e=>{if(!active)e.currentTarget.style.background="#fff";}}>
                  <span style={{ fontSize:20,flexShrink:0 }}>{data.flag}</span>
                  <div style={{ flex:1,minWidth:0 }}>
                    <div style={{ fontWeight:active?700:600,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{data.lang}</div>
                    {data.label && <div style={{ fontSize:11,color:active?"#f5b800aa":"#aaa",marginTop:1 }}>{data.label}</div>}
                  </div>
                  {active && <span style={{ fontSize:14,flexShrink:0 }}>✓</span>}
                  {!active && data.isAWS && <span style={{ fontSize:9,color:"#ccc",background:"#f5f5f5",padding:"2px 6px",borderRadius:4,flexShrink:0,fontFamily:"'DM Sans',sans-serif" }}>AWS</span>}
                </button>
              );
            })}

            <div style={{ padding:"8px 16px",fontSize:10,color:"#ccc",fontFamily:"'DM Sans',sans-serif",textAlign:"center",borderTop:"1px solid #f0f0ec" }}>
              Powered by AWS Translate
            </div>
          </div>
        </>
      )}
    </div>
  );
}