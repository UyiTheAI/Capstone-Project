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

const PORTAL_COLORS = { employee:"#4f46e5", manager:"#0891b2", owner:"#f5b800" };

export default function Login({ onHomeClick, onForgotPassword }) {
  const { t }                     = useLanguage();
  const { login, loginWithPopup } = useAuth();
  const [portal,   setPortal]     = useState("employee");
  const [email,    setEmail]      = useState("");
  const [password, setPassword]   = useState("");
  const [error,    setError]      = useState("");
  const [loading,  setLoading]    = useState(false);

  const demos = {
    employee: { email:"maria@shiftup.com",   password:"password123" },
    manager:  { email:"manager@shiftup.com", password:"password123" },
    owner:    { email:"owner@shiftup.com",   password:"password123" },
  };

  const switchPortal = (p) => {
    setPortal(p); setError("");
    setEmail(demos[p].email);
    setPassword(demos[p].password);
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter email and password"); return; }
    setLoading(true); setError("");
    try { await login(email, password); }
    catch (err) { setError(err.response?.data?.message || "Invalid email or password"); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => loginWithPopup(`${API}/auth/google?role=${portal}`);

  const portalLabel = { employee:"Employee", manager:"Manager", owner:"Owner" };
  const portalDesc  = {
    employee: "Access your shifts, availability and notifications.",
    manager:  "Manage schedules, approvals and staff reports.",
    owner:    "Full control — schedules, tips, subscription and more.",
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"var(--font-body)", position:"relative" }}>
      <div style={{ position:"absolute", top:20, right:24, zIndex:100 }}><LanguageSwitcher /></div>

      {/* LEFT — branding */}
      <div style={{ flex:"0 0 380px", background:"#1a1a1a", display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 48px" }}>
        <div className="su-brand" style={{ color:"#f5b800", marginBottom:24, cursor:"pointer" }} onClick={onHomeClick}>
          <div className="su-logobox">UP</div>SHIFT-UP
        </div>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:52, color:"#f5b800", lineHeight:1, marginBottom:16 }}>
          Welcome Back
        </h1>
        <p style={{ color:"#999", fontSize:14, lineHeight:1.8, marginBottom:32 }}>
          {portalDesc[portal]}
        </p>

        {/* Demo credentials */}
        <div style={{ background:"#222", borderRadius:12, padding:18 }}>
          <div style={{ color:"#555", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>Demo Credentials</div>
          {Object.entries(demos).map(([role, creds]) => (
            <div key={role} onClick={() => switchPortal(role)} style={{ fontSize:12, marginBottom:8, cursor:"pointer", padding:"6px 10px", borderRadius:8, background: portal===role ? "#333" : "transparent", transition:"background .2s" }}>
              <span style={{ color: PORTAL_COLORS[role], fontWeight:700, textTransform:"capitalize" }}>{portalLabel[role]}:</span>{" "}
              <span style={{ color:"#888" }}>{creds.email}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT — login form */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7" }}>
        <div style={{ width:"100%", maxWidth:400, padding:"0 36px" }}>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, marginBottom:4 }}>Login</h2>
          <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Select your portal and sign in</p>

          {/* Portal selector */}
          <div style={{ marginBottom:22 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
              Select Portal
            </div>
            <div style={{ display:"flex", gap:4, background:"#efefec", borderRadius:10, padding:4 }}>
              {["employee","manager","owner"].map(p => (
                <button key={p} onClick={() => switchPortal(p)} style={{
                  flex:1, padding:"10px 0", border:"none", borderRadius:7, cursor:"pointer",
                  fontFamily:"var(--font-body)", fontSize:12, fontWeight:700,
                  background: portal===p ? PORTAL_COLORS[p] : "transparent",
                  color:      portal===p ? (p==="owner" ? "#1a1a1a" : "#fff") : "#888",
                  transition: "all .2s",
                }}>{portalLabel[p]}</button>
              ))}
            </div>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            padding:"12px 16px", border:"1.5px solid #e0e0e0", borderRadius:10,
            background:"#fff", fontFamily:"var(--font-body)", fontSize:14, fontWeight:600,
            cursor:"pointer", marginBottom:16, transition:"opacity .15s",
          }} onMouseOver={e=>e.currentTarget.style.opacity=".8"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
            <GoogleIcon /> Sign in with Google as {portalLabel[portal]}
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:10, marginBottom:16 }}>
            <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
            <span style={{ fontSize:12, color:"#aaa" }}>or</span>
            <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
          </div>

          {error && (
            <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>
              {error}
            </div>
          )}

          <div className="su-form-row">
            <label className="su-label">Email</label>
            <input className="su-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" />
          </div>

          <div className="su-form-row">
            <label className="su-label" style={{ display:"flex", justifyContent:"space-between" }}>
              <span>Password</span>
              <span onClick={onForgotPassword} style={{ color:"#f5b800", cursor:"pointer", fontSize:12, fontWeight:600 }}>
                Forgot password?
              </span>
            </label>
            <input className="su-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} onKeyDown={e=>e.key==="Enter"&&handleLogin()} placeholder="Password" />
          </div>

          <button className="su-btn su-btn-black" onClick={handleLogin} disabled={loading} style={{ width:"100%", marginTop:8 }}>
            {loading ? <span className="spinner" /> : `Login as ${portalLabel[portal]}`}
          </button>

          <div style={{ marginTop:24, padding:"14px 18px", background:"#fff8e1", borderRadius:10, fontSize:12, color:"#7b5e00", textAlign:"center", lineHeight:1.6 }}>
            <strong>New user?</strong><br/>
            Contact your restaurant owner or manager.<br/>
            They will create your account from their portal.
          </div>
        </div>
      </div>
    </div>
  );
}