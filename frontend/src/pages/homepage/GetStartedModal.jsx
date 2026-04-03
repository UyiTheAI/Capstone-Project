import React, { useState } from "react";
import api from "../../api";

export default function GetStartedModal({ onClose, onAlreadyHaveAccount }) {
  const [step,      setStep]      = useState(1);
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");

  const handleStart = async () => {
    if (!firstName || !lastName || !email || !password) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setStep(2); setError("");
    try {
      // 1. Register as owner
      const regRes = await api.post("/auth/register", {
        firstName, lastName, email, password,
        role: "owner", position: "Owner", availability: "Full-Time",
      });
      localStorage.setItem("shiftup_token", regRes.data.token);
      localStorage.setItem("shiftup_user",  JSON.stringify(regRes.data.user));

      // 2. Start Stripe 7-day trial checkout
      setStep(3);
      const checkoutRes = await api.post("/subscription/checkout");
      window.location.href = checkoutRes.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setStep(1);
    }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:480, overflow:"hidden", fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.3)" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#f5b800,#ffdd57)", padding:"24px 32px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", fontSize:20, cursor:"pointer", color:"rgba(0,0,0,.4)" }}>✕</button>
          <div style={{ fontSize:32, marginBottom:6 }}>🚀</div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, color:"#1a1a1a", margin:"0 0 4px", lineHeight:1 }}>Start Your Free Trial</h2>
          <p style={{ fontSize:13, color:"#1a1a1a", opacity:.7, margin:0 }}>7 days free · Org code emailed instantly · Cancel = $0</p>
        </div>

        <div style={{ padding:"28px 32px" }}>
          {step === 3 ? (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ width:48, height:48, border:"4px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
              <div style={{ fontWeight:700, fontSize:16, color:"#1a1a1a", marginBottom:6 }}>Redirecting to Stripe…</div>
              <div style={{ fontSize:13, color:"#888" }}>Setting up your 7-day free trial. Please wait.</div>
            </div>
          ) : (
            <>
              <div style={{ display:"flex", gap:10, marginBottom:24 }}>
                {[{icon:"📅",label:"7 Days Free"},{icon:"📧",label:"Code via Email"},{icon:"❌",label:"Cancel = $0"}].map(b=>(
                  <div key={b.label} style={{ flex:1, textAlign:"center", background:"#f9f9f7", borderRadius:10, padding:"12px 6px" }}>
                    <div style={{ fontSize:22 }}>{b.icon}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#555", marginTop:4 }}>{b.label}</div>
                  </div>
                ))}
              </div>

              {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>{error}</div>}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div className="su-form-row">
                  <label className="su-label">First Name</label>
                  <input className="su-input" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div className="su-form-row">
                  <label className="su-label">Last Name</label>
                  <input className="su-input" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Smith" />
                </div>
              </div>

              <div className="su-form-row">
                <label className="su-label">📧 Email — your 6-digit org code will be sent here</label>
                <input className="su-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@restaurant.com" />
              </div>

              <div className="su-form-row">
                <label className="su-label">Password</label>
                <input className="su-input" type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleStart()} placeholder="Min 6 characters" />
              </div>

              <button onClick={handleStart} disabled={step===2} style={{
                width:"100%", padding:"15px", background:"#f5b800", color:"#1a1a1a",
                border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800,
                fontSize:15, cursor:"pointer", marginTop:8, marginBottom:10,
                opacity: step===2 ? .7 : 1,
              }}>
                {step===2 ? "Creating account…" : "🚀 Start Free Trial"}
              </button>

              <div style={{ fontSize:12, color:"#aaa", textAlign:"center", marginBottom:12 }}>
                Enter card details on the next page · Charged $5 CAD/mo after 7 days
              </div>

              <p style={{ fontSize:13, textAlign:"center", color:"#888", margin:0 }}>
                Already have an account?{" "}
                <span onClick={onAlreadyHaveAccount} style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }}>Sign in</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}