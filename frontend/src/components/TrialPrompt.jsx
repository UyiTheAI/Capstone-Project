import React, { useState } from "react";
import api from "../api";

export default function TrialPrompt({ onClose }) {
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleStart = async () => {
    setLoading(true); setError("");
    try {
      const res = await api.post("/subscription/checkout");
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start trial.");
      setLoading(false);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.7)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:24 }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:480, overflow:"hidden", fontFamily:"var(--font-body)" }}>
        <div style={{ background:"linear-gradient(135deg,#f5b800,#ffdd57)", padding:"28px 32px" }}>
          <div style={{ fontSize:40, marginBottom:8 }}>🎁</div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, color:"#1a1a1a", margin:0, lineHeight:1 }}>Start Your Free Trial</h2>
          <p style={{ color:"#1a1a1a", opacity:.7, fontSize:14, margin:"8px 0 0" }}>7 days free — no charge until trial ends</p>
        </div>
        <div style={{ padding:"28px 32px" }}>
          <div style={{ display:"flex", gap:12, marginBottom:24 }}>
            {[{ icon:"📅", title:"7 Days Free", desc:"Full access" }, { icon:"🔑", title:"Org Code", desc:"Share with team" }, { icon:"❌", title:"Cancel Free", desc:"No charge" }].map(b => (
              <div key={b.title} style={{ flex:1, textAlign:"center", padding:"14px 8px", background:"#f9f9f7", borderRadius:12 }}>
                <div style={{ fontSize:24, marginBottom:6 }}>{b.icon}</div>
                <div style={{ fontWeight:800, fontSize:13, color:"#1a1a1a" }}>{b.title}</div>
                <div style={{ fontSize:11, color:"#888", marginTop:2 }}>{b.desc}</div>
              </div>
            ))}
          </div>
          {error && <div style={{ padding:"10px 16px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>{error}</div>}
          <button onClick={handleStart} disabled={loading} style={{ width:"100%", padding:"16px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:16, cursor:"pointer", marginBottom:10, opacity: loading ? .7 : 1 }}>
            {loading ? "Redirecting to Stripe…" : "🚀 Start 7-Day Free Trial"}
          </button>
          <button onClick={onClose} style={{ width:"100%", padding:"12px", background:"transparent", color:"#aaa", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:600, fontSize:14, cursor:"pointer" }}>
            Maybe later — continue to app
          </button>
        </div>
      </div>
    </div>
  );
}
