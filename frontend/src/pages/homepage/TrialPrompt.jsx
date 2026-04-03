import React, { useState } from "react";
import api from "../api";

/**
 * TrialPrompt — shown automatically when an owner/manager
 * logs in and has no active subscription.
 */
export default function TrialPrompt({ onClose, onSuccess }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleStart = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post("/subscription/checkout");
      window.location.href = res.data.url; // redirect to Stripe
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start trial. Please try again.");
      setLoading(false);
    }
  };

  return (
    <div style={{
      position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:2000,
      display:"flex", alignItems:"center", justifyContent:"center", padding:24,
    }}>
      <div style={{
        background:"#fff", borderRadius:24, width:"100%", maxWidth:480,
        overflow:"hidden", fontFamily:"var(--font-body)",
        boxShadow:"0 24px 80px rgba(0,0,0,.3)",
      }}>
        {/* Gold header */}
        <div style={{ background:"linear-gradient(135deg,#f5b800,#ffdd57)", padding:"28px 32px" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🎁</div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, color:"#1a1a1a", margin:0, lineHeight:1 }}>
            Start Your Free Trial
          </h2>
          <p style={{ color:"#1a1a1a", opacity:.7, fontSize:14, margin:"8px 0 0" }}>
            7 days free — no charge until trial ends
          </p>
        </div>

        {/* Body */}
        <div style={{ padding:"28px 32px" }}>

          {/* Trial details */}
          <div style={{ display:"flex", gap:16, marginBottom:24 }}>
            {[
              { icon:"📅", title:"7 Days Free",     desc:"Full access, no limits" },
              { icon:"🔑", title:"Org Code",         desc:"Share with your team" },
              { icon:"❌", title:"Cancel Anytime",   desc:"No charge if cancelled" },
            ].map(b => (
              <div key={b.title} style={{ flex:1, textAlign:"center", padding:"14px 8px", background:"#f9f9f7", borderRadius:12 }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{b.icon}</div>
                <div style={{ fontWeight:800, fontSize:13, color:"#1a1a1a" }}>{b.title}</div>
                <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{b.desc}</div>
              </div>
            ))}
          </div>

          {/* What happens */}
          <div style={{ background:"#f9f9f7", borderRadius:12, padding:"16px 18px", marginBottom:20, fontSize:13, color:"#555", lineHeight:1.8 }}>
            <div><strong>After trial starts:</strong></div>
            <div>1. Enter your card via Stripe (nothing charged for 7 days)</div>
            <div>2. Receive your unique <strong>6-digit org code</strong></div>
            <div>3. Share code with your staff so they can register</div>
            <div>4. Cancel before trial ends → <strong>$0 charged</strong></div>
          </div>

          {error && (
            <div style={{ padding:"10px 16px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>
              {error}
            </div>
          )}

          {/* Buttons */}
          <button onClick={handleStart} disabled={loading} style={{
            width:"100%", padding:"16px", background:"#f5b800", color:"#1a1a1a",
            border:"none", borderRadius:12, fontFamily:"var(--font-body)",
            fontWeight:800, fontSize:16, cursor:"pointer", marginBottom:10,
            transition:"opacity .15s", opacity: loading ? .7 : 1,
          }}
            onMouseOver={e=>{ if (!loading) e.currentTarget.style.opacity=".85"; }}
            onMouseOut={e=>e.currentTarget.style.opacity=loading?".7":"1"}>
            {loading ? "Redirecting to Stripe…" : "🚀 Start 7-Day Free Trial"}
          </button>

          <button onClick={onClose} style={{
            width:"100%", padding:"12px", background:"transparent", color:"#aaa",
            border:"none", borderRadius:12, fontFamily:"var(--font-body)",
            fontWeight:600, fontSize:14, cursor:"pointer",
          }}>
            Maybe later — continue to app
          </button>

          <div style={{ textAlign:"center", fontSize:11, color:"#ccc", marginTop:8 }}>
            🔒 Secured by Stripe
          </div>
        </div>
      </div>
    </div>
  );
}