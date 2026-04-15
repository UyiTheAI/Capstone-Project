import React, { useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

export default function Pricing({ onGetStarted, onLoginClick }) {
  const { user }              = useAuth();
  const { t }                 = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const FEATURES = [
    t("pricingFeat1"), t("pricingFeat2"), t("pricingFeat3"),
    t("pricingFeat4"), t("pricingFeat5"), t("pricingFeat6"),
    t("pricingFeat7"), t("pricingFeat8"), t("pricingFeat9"), t("pricingFeat10"),
  ];

  const HOW_STEPS = [
    { n:"1", text:t("pricingStep1") },
    { n:"2", text:t("pricingStep2") },
    { n:"3", text:t("pricingStep3") },
    { n:"4", text:t("pricingStep4") },
  ];

  const handleSubscribe = async () => {
    if (!user) { onGetStarted?.(); return; }
    if (user.role === "employee") {
      setError(t("error"));
      return;
    }
    if (user.subscriptionStatus === "active") {
      setError(t("ctaActive"));
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await api.post("/subscription/checkout");
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || t("error"));
    } finally { setLoading(false); }
  };

  const isActive = user?.subscriptionStatus === "active";

  return (
    <section id="pricing" style={{ background:"#111", padding:"80px 40px", fontFamily:"var(--font-body)" }}>

      <div style={{ textAlign:"center", marginBottom:56 }}>
        <div style={{ display:"inline-block", background:"#f5b800", color:"#1a1a1a", fontWeight:800, fontSize:11, padding:"4px 16px", borderRadius:20, letterSpacing:2, textTransform:"uppercase", marginBottom:16 }}>
          {t("pricingBadge")}
        </div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:56, color:"#fff", lineHeight:1, marginBottom:12 }}>
          {t("pricingTitle")}
        </h2>
        <p style={{ fontSize:17, color:"#888", maxWidth:480, margin:"0 auto" }}>
          {t("pricingSubtitle")}
        </p>
      </div>

      {error && (
        <div style={{ maxWidth:500, margin:"0 auto 32px", padding:"14px 20px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:14, textAlign:"center" }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth:520, margin:"0 auto" }}>

        <div style={{ background:"linear-gradient(135deg,#f5b800,#ffdd57)", borderRadius:"16px 16px 0 0", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:900, fontSize:16, color:"#1a1a1a" }}>🎁 {t("trialBannerTitle")}</div>
            <div style={{ fontSize:13, color:"#1a1a1a", opacity:.7, marginTop:2 }}>{t("trialBannerDesc")}</div>
          </div>
          <div style={{ fontFamily:"var(--font-head)", fontSize:28, color:"#1a1a1a", fontWeight:900, whiteSpace:"nowrap" }}>{t("trialBannerFree")}</div>
        </div>

        <div style={{ background:"linear-gradient(135deg,#1a1a1a,#222)", borderRadius:"0 0 24px 24px", border:"2px solid #f5b800", borderTop:"none", padding:"40px 44px", boxShadow:"0 20px 60px rgba(245,184,0,.12)" }}>

          <h3 style={{ fontFamily:"var(--font-head)", fontSize:38, color:"#fff", margin:"0 0 6px" }}>{t("proTitle")}</h3>
          <p style={{ color:"#888", fontSize:15, marginBottom:28 }}>{t("proDesc")}</p>

          <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:8 }}>
            <span style={{ fontFamily:"var(--font-head)", fontSize:72, color:"#f5b800", lineHeight:1 }}>$5</span>
            <div style={{ paddingBottom:10 }}>
              <div style={{ color:"#f5b800", fontSize:15, fontWeight:700 }}>CAD</div>
              <div style={{ color:"#666", fontSize:13 }}>{t("perMonth")}</div>
            </div>
          </div>

          <div style={{ marginBottom:36 }}>
            {FEATURES.map((f) => (
              <div key={f} style={{ display:"flex", alignItems:"center", gap:12, padding:"9px 0", borderBottom:"1px solid #2a2a2a", fontSize:14, color:"#ccc" }}>
                <div style={{ width:20, height:20, borderRadius:"50%", background:"#f5b800", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>
                  <span style={{ color:"#1a1a1a", fontSize:11, fontWeight:900 }}>✓</span>
                </div>
                {f}
              </div>
            ))}
          </div>

          {isActive && (
            <div style={{ background:"#222", borderRadius:12, padding:"14px 18px", marginBottom:20, border:"1px solid #f5b800" }}>
              <div style={{ color:"#f5b800", fontWeight:700, fontSize:13 }}>✅ {t("ctaActive")}</div>
            </div>
          )}

          <button onClick={handleSubscribe} disabled={loading || isActive} style={{
            width:"100%", padding:"18px 0",
            background: isActive ? "#333" : "#f5b800",
            color:       isActive ? "#666" : "#1a1a1a",
            border:"none", borderRadius:14,
            fontFamily:"var(--font-body)", fontWeight:800, fontSize:17,
            cursor: isActive ? "not-allowed" : "pointer", transition:"opacity .15s",
            opacity: loading ? .7 : 1,
          }}
            onMouseOver={e=>{ if (!loading && !isActive) e.currentTarget.style.opacity=".85"; }}
            onMouseOut={e =>{ e.currentTarget.style.opacity = loading ? ".7" : "1"; }}>
            {loading    ? t("ctaLoading")
             : isActive  ? t("ctaActive")
             : user      ? t("ctaWithAccount")
             :             t("ctaGuest")}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"#555", marginTop:12 }}>
            {t("ctaStripeNote")}
          </div>

          {!user && (
            <p style={{ textAlign:"center", fontSize:13, color:"#555", marginTop:10 }}>
              {t("alreadyAccount")}{" "}
              <span onClick={onLoginClick} style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }}>{t("signIn")}</span>
            </p>
          )}
        </div>

        <div style={{ marginTop:24, background:"#1a1a1a", borderRadius:16, padding:"24px 28px", border:"1px solid #2a2a2a" }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#f5b800", marginBottom:16 }}>{t("pricingHowTitle")}</div>
          {HOW_STEPS.map(s => (
            <div key={s.n} style={{ display:"flex", gap:14, alignItems:"flex-start", marginBottom:12 }}>
              <div style={{ width:26, height:26, borderRadius:"50%", background:"#f5b800", color:"#1a1a1a", fontWeight:900, fontSize:12, display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0 }}>{s.n}</div>
              <div style={{ fontSize:14, color:"#888", paddingTop:4 }}>{s.text}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
