import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.8-1.9 13.4-5l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C37.2 39.5 44 34.5 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}

const PORTALS = [
  { key:"employee", label:"Employee", color:"#4f46e5", textColor:"#fff"    },
  { key:"manager",  label:"Manager",  color:"#0891b2", textColor:"#fff"    },
  { key:"owner",    label:"Owner",    color:"#f5b800", textColor:"#1a1a1a" },
];

const DEMOS = {
  employee: { email:"maria@shiftup.com",   password:"password123" },
  manager:  { email:"manager@shiftup.com", password:"password123" },
  owner:    { email:"owner@shiftup.com",   password:"password123" },
};

export default function Login({ onHomeClick }) {
  const { t }                     = useLanguage();
  const { login, loginWithPopup } = useAuth();
  const [portal,   setPortal]     = useState("employee");
  const [email,    setEmail]      = useState(DEMOS.employee.email);
  const [password, setPassword]   = useState(DEMOS.employee.password);
  const [error,    setError]      = useState("");
  const [loading,  setLoading]    = useState(false);

  const switchPortal = (p) => {
    setPortal(p);
    setEmail(DEMOS[p].email);
    setPassword(DEMOS[p].password);
    setError("");
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please fill all fields"); return; }
    setLoading(true); setError("");
    try { await login(email, password); }
    catch (err) { setError(err.response?.data?.message || "Invalid email or password"); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => loginWithPopup(`${API}/auth/google?role=${portal}`);
  const activePortal = PORTALS.find(p => p.key === portal);

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"var(--font-body)", position:"relative" }}>
      <div style={{ position:"absolute", top:20, right:24, zIndex:100 }}><LanguageSwitcher /></div>

      {/* LEFT */}
      <div style={{ flex:"0 0 360px", background:"#1a1a1a", display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 40px" }}>
        <div className="su-brand" style={{ color:"#f5b800", marginBottom:28, cursor:"pointer" }} onClick={onHomeClick}>
          <div className="su-logobox">UP</div>SHIFT-UP
        </div>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:48, color:"#f5b800", lineHeight:1, marginBottom:12 }}>Welcome Back</h1>
        <p style={{ color:"#666", fontSize:14, lineHeight:1.7, marginBottom:28 }}>
          Sign in to your SHIFT-UP portal.
        </p>
        <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
          {PORTALS.map(p => (
            <div key={p.key} onClick={() => switchPortal(p.key)} style={{ padding:"12px 16px", borderRadius:12, cursor:"pointer", background: portal===p.key ? p.color : "#222", border:`1.5px solid ${portal===p.key ? p.color : "#333"}`, transition:"all .2s" }}>
              <div style={{ fontWeight:700, fontSize:13, color: portal===p.key ? p.textColor : "#888" }}>{p.label} Portal</div>
              <div style={{ fontSize:11, color: portal===p.key ? p.textColor : "#555", opacity:.8, marginTop:2 }}>{DEMOS[p.key].email}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop:16, fontSize:11, color:"#444" }}>
          Demo password: <span style={{ color:"#f5b800" }}>password123</span>
        </div>
        <div style={{ marginTop:16, padding:"12px 16px", background:"#222", borderRadius:12, fontSize:12, color:"#666", lineHeight:1.6 }}>
          💡 To change your password, log in and go to your <strong style={{ color:"#888" }}>Profile</strong> → <strong style={{ color:"#888" }}>Password</strong> tab.
        </div>
      </div>

      {/* RIGHT */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7" }}>
        <div style={{ width:"100%", maxWidth:400, padding:36 }}>

          <div style={{ display:"inline-flex", alignItems:"center", gap:8, background: activePortal.color, color: activePortal.textColor, padding:"6px 14px", borderRadius:20, fontSize:13, fontWeight:700, marginBottom:20 }}>
            {activePortal.label} Portal Login
          </div>

          <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, marginBottom:4 }}>Sign In</h2>
          <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Select your portal and sign in below.</p>

          {/* Portal tabs */}
          <div style={{ display:"flex", gap:4, background:"#efefec", borderRadius:10, padding:4, marginBottom:20 }}>
            {PORTALS.map(p => (
              <button key={p.key} onClick={() => switchPortal(p.key)} style={{ flex:1, padding:"8px 0", border:"none", borderRadius:7, cursor:"pointer", fontFamily:"var(--font-body)", fontSize:12, fontWeight:700, background: portal===p.key ? p.color : "transparent", color: portal===p.key ? p.textColor : "#888", transition:"all .2s" }}>
                {p.label}
              </button>
            ))}
          </div>

          {/* Google */}
          <button onClick={handleGoogle} style={{ width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10, padding:"12px 16px", border:"1.5px solid #e0e0e0", borderRadius:10, cursor:"pointer", background:"#fff", fontFamily:"var(--font-body)", fontSize:14, fontWeight:600, marginBottom:16 }}>
            <GoogleIcon /> Sign in with Google ({activePortal.label})
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 0 16px" }}>
            <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
            <span style={{ fontSize:12, color:"#aaa" }}>or email</span>
            <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
          </div>

          {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:12 }}>{error}</div>}

          <div className="su-form-row">
            <label className="su-label">Email</label>
            <input className="su-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          </div>

          <div className="su-form-row">
            <label className="su-label">Password</label>
            <input className="su-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Password" />
          </div>

          <button className="su-btn su-btn-black" onClick={handleLogin} disabled={loading} style={{ width:"100%", marginTop:4 }}>
            {loading ? <span className="spinner" /> : `Sign In as ${activePortal.label}`}
          </button>

          <div style={{ marginTop:16, padding:"12px 16px", background:"#f9f9f7", borderRadius:10, fontSize:12, color:"#888", textAlign:"center", lineHeight:1.6 }}>
            Forgot your password? Log in and go to <strong>Profile → Password</strong> tab to change it.
          </div>
        </div>
      </div>
    </div>
  );
}