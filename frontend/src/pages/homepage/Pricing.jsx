import React, { useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";

const FEATURES = [
  "Schedule management & publishing",
  "Shift swap requests & approvals",
  "Staff reports & analytics",
  "Employee overview & performance",
  "Tip manager with notifications",
  "Google login",
  "9 language support",
  "Unlimited employees",
  "Notifications inbox",
  "CSV export",
];

export default function Pricing({ onGetStarted, onLoginClick }) {
  const { user }              = useAuth();
  const { t }                 = useLanguage();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubscribe = async () => {
    if (!user) { onGetStarted?.(); return; }
    if (user.role === "employee") {
      setError("Only managers and owners can subscribe. Ask your manager to set up billing.");
      return;
    }
    if (user.subscriptionStatus === "active") {
      setError("You already have an active subscription!");
      return;
    }
    setLoading(true); setError("");
    try {
      const res = await api.post("/subscription/checkout");
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start checkout.");
    } finally { setLoading(false); }
  };

  const isActive = user?.subscriptionStatus === "active";

  return (
    <section id="pricing" style={{ background:"#111", padding:"80px 40px", fontFamily:"var(--font-body)" }}>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:56 }}>
        <div style={{ display:"inline-block", background:"#f5b800", color:"#1a1a1a", fontWeight:800, fontSize:11, padding:"4px 16px", borderRadius:20, letterSpacing:2, textTransform:"uppercase", marginBottom:16 }}>
          Pricing
        </div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:56, color:"#fff", lineHeight:1, marginBottom:12 }}>
          {t("pricingTitle")}
        </h2>
        <p style={{ fontSize:17, color:"#888", maxWidth:480, margin:"0 auto" }}>
          Start free for 7 days. Then just $5 CAD/month. Cancel anytime.
        </p>
      </div>

      {error && (
        <div style={{ maxWidth:500, margin:"0 auto 32px", padding:"14px 20px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:14, textAlign:"center" }}>
          {error}
        </div>
      )}

      <div style={{ maxWidth:520, margin:"0 auto" }}>

        {/* ── Trial banner ─────────────────────────────────────────────── */}
        <div style={{ background:"linear-gradient(135deg,#f5b800,#ffdd57)", borderRadius:"16px 16px 0 0", padding:"16px 28px", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
          <div>
            <div style={{ fontWeight:900, fontSize:16, color:"#1a1a1a" }}>🎁 7-Day Free Trial</div>
            <div style={{ fontSize:13, color:"#1a1a1a", opacity:.7, marginTop:2 }}>No charge for 7 days — cancel before trial ends and pay nothing</div>
          </div>
          <div style={{ fontFamily:"var(--font-head)", fontSize:28, color:"#1a1a1a", fontWeight:900, whiteSpace:"nowrap" }}>FREE</div>
        </div>

        {/* ── Main card ────────────────────────────────────────────────── */}
        <div style={{ background:"linear-gradient(135deg,#1a1a1a,#222)", borderRadius:"0 0 24px 24px", border:"2px solid #f5b800", borderTop:"none", padding:"40px 44px", boxShadow:"0 20px 60px rgba(245,184,0,.12)" }}>

          <h3 style={{ fontFamily:"var(--font-head)", fontSize:38, color:"#fff", margin:"0 0 6px" }}>SHIFT-UP Pro</h3>
          <p style={{ color:"#888", fontSize:15, marginBottom:28 }}>Complete workforce management for your restaurant.</p>

          {/* Price */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:8 }}>
            <span style={{ fontFamily:"var(--font-head)", fontSize:72, color:"#f5b800", lineHeight:1 }}>$5</span>
            <div style={{ paddingBottom:10 }}>
              <div style={{ color:"#f5b800", fontSize:15, fontWeight:700 }}>CAD</div>
              <div style={{ color:"#666", fontSize:13 }}>{t("perMonth")} after trial</div>
            </div>
          </div>
          <div style={{ fontSize:13, color:"#666", marginBottom:32 }}>
            First 7 days free → then $5 CAD/month
          </div>

          {/* Features */}
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
              <div style={{ color:"#f5b800", fontWeight:700, fontSize:13 }}>✅ You're subscribed!</div>
              <div style={{ color:"#888", fontSize:13, marginTop:4 }}>Go to Subscription settings to find your 6-digit org code.</div>
            </div>
          )}

          {/* CTA */}
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
            {loading   ? "Redirecting to Stripe…"
             : isActive ? "✓ Already Subscribed"
             : user     ? "Start 7-Day Free Trial"
             :            "Start Free Trial — No Credit Card Now"}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"#555", marginTop:12 }}>
            🔒 Secured by Stripe · Cancel anytime · No hidden fees
          </div>

          {!user && (
            <p style={{ textAlign:"center", fontSize:13, color:"#555", marginTop:10 }}>
              Already have an account?{" "}
              <span onClick={onLoginClick} style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }}>Sign in</span>
            </p>
          )}
        </div>

        {/* How it works */}
        <div style={{ marginTop:24, background:"#1a1a1a", borderRadius:16, padding:"24px 28px", border:"1px solid #2a2a2a" }}>
          <div style={{ fontWeight:700, fontSize:14, color:"#f5b800", marginBottom:16 }}>How it works</div>
          {[
            { n:"1", text:"Start your 7-day free trial — enter card details but nothing is charged" },
            { n:"2", text:"After payment activates, you receive a unique 6-digit org code" },
            { n:"3", text:"Share the code with your staff when they register" },
            { n:"4", text:"Cancel anytime before trial ends — pay nothing" },
          ].map(s => (
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