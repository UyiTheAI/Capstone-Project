import React, { useState } from "react";

export default function GetStartedModal({ onClose, onAlreadyHaveAccount, onProceedToPayment }) {
  const [firstName, setFirstName] = useState("");
  const [lastName,  setLastName]  = useState("");
  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");

  const handleContinue = () => {
    if (!firstName || !lastName || !email || !password) { setError("All fields are required."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }

    // Store temporarily — NOT saved to DB yet
    localStorage.setItem("shiftup_pending_owner", JSON.stringify({
      firstName, lastName, email, password,
      role: "owner", position: "Owner", availability: "Full-Time",
    }));

    onProceedToPayment?.();
  };

  const inputStyle = {
    width:"100%", padding:"11px 14px", border:"1.5px solid #e0e0e0",
    borderRadius:10, fontFamily:"var(--font-body)", fontSize:14,
    outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:480, overflow:"hidden", fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.3)" }}>

        <div style={{ background:"linear-gradient(135deg,#f5b800,#ffdd57)", padding:"24px 32px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", fontSize:20, cursor:"pointer", color:"rgba(0,0,0,.4)" }}>✕</button>
          <div style={{ fontSize:32, marginBottom:6 }}>🚀</div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, color:"#1a1a1a", margin:"0 0 4px", lineHeight:1 }}>Start Your Free Trial</h2>
          <p style={{ fontSize:13, color:"#1a1a1a", opacity:.7, margin:0 }}>7 days free · Account created after payment · Cancel = $0</p>
        </div>

        <div style={{ padding:"28px 32px" }}>

          {/* Steps */}
          <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:24 }}>
            {[{ n:"1", label:"Your Info", active:true }, { n:"2", label:"Payment", active:false }, { n:"3", label:"Done!", active:false }].map((s, i) => (
              <React.Fragment key={s.n}>
                <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                  <div style={{ width:28, height:28, borderRadius:"50%", background: s.active ? "#f5b800" : "#e5e5e5", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color: s.active ? "#1a1a1a" : "#aaa" }}>{s.n}</div>
                  <span style={{ fontSize:12, fontWeight: s.active ? 700 : 400, color: s.active ? "#1a1a1a" : "#aaa" }}>{s.label}</span>
                </div>
                {i < 2 && <div style={{ flex:1, height:1, background:"#e5e5e5" }} />}
              </React.Fragment>
            ))}
          </div>

          <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:13, color:"#166534" }}>
            🔒 Your account is created <strong>only after payment</strong> — nothing is saved until you complete checkout.
          </div>

          {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>{error}</div>}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block" }}>FIRST NAME</label>
              <input style={inputStyle} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="John" />
            </div>
            <div style={{ marginBottom:12 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block" }}>LAST NAME</label>
              <input style={inputStyle} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block" }}>EMAIL</label>
            <input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@restaurant.com" />
          </div>

          <div style={{ marginBottom:20 }}>
            <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block" }}>PASSWORD</label>
            <input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleContinue()} placeholder="Min 6 characters" />
          </div>

          <button onClick={handleContinue} style={{ width:"100%", padding:"15px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:10 }}>
            Continue to Payment →
          </button>

          <div style={{ fontSize:12, color:"#aaa", textAlign:"center", marginBottom:12 }}>
            Your account is created only after successful payment
          </div>

          <p style={{ fontSize:13, textAlign:"center", color:"#888", margin:0 }}>
            Already have an account?{" "}
            <span onClick={onAlreadyHaveAccount} style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }}>Sign in</span>
          </p>
        </div>
      </div>
    </div>
  );
}