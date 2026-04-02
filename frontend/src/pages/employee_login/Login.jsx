import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const API = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

const oauthBtn = (bg, color, border) => ({
  width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
  padding:"11px 16px", border:`1.5px solid ${border}`, borderRadius:10, cursor:"pointer",
  background:bg, color, fontFamily:"var(--font-body)", fontSize:14, fontWeight:600,
  marginBottom:10, transition:"opacity .15s",
});

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 48 48">
      <path fill="#FFC107" d="M43.6 20.1H42V20H24v8h11.3C33.6 32.7 29.2 36 24 36c-6.6 0-12-5.4-12-12s5.4-12 12-12c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 12.9 4 4 12.9 4 24s8.9 20 20 20 20-8.9 20-20c0-1.3-.1-2.6-.4-3.9z"/>
      <path fill="#FF3D00" d="M6.3 14.7l6.6 4.8C14.6 16 19 13 24 13c3.1 0 5.8 1.1 7.9 2.9l5.7-5.7C34 6.5 29.3 4 24 4 16.3 4 9.7 8.3 6.3 14.7z"/>
      <path fill="#4CAF50" d="M24 44c5.2 0 9.8-1.9 13.4-5l-6.2-5.2C29.2 35.3 26.7 36 24 36c-5.2 0-9.6-3.3-11.3-8H6.3C9.7 35.7 16.3 44 24 44z"/>
      <path fill="#1976D2" d="M43.6 20.1H42V20H24v8h11.3c-.8 2.3-2.3 4.2-4.3 5.5l6.2 5.2C37.2 39.5 44 34.5 44 24c0-1.3-.1-2.6-.4-3.9z"/>
    </svg>
  );
}


const Divider = ({ label }) => (
  <div style={{ display:"flex", alignItems:"center", gap:10, margin:"16px 0" }}>
    <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
    <span style={{ fontSize:12, color:"#aaa", fontWeight:600 }}>{label}</span>
    <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
  </div>
);

const PORTAL_COLORS = { employee:"#4f46e5", manager:"#0891b2", owner:"#f5b800" };

const Login = ({ onHomeClick, onRegisterClick }) => {
  const { t }                    = useLanguage();
  const { login, loginWithPopup } = useAuth();
  const [portal,   setPortal]    = useState("employee");
  const [email,    setEmail]     = useState("");
  const [password, setPassword]  = useState("");
  const [error,    setError]     = useState("");
  const [loading,  setLoading]   = useState(false);

  const demos = {
    employee: { email:"maria@shiftup.com",   password:"password123" },
    manager:  { email:"manager@shiftup.com", password:"password123" },
    owner:    { email:"owner@shiftup.com",   password:"password123" },
  };

  const switchPortal = (p) => {
    setPortal(p);
    setEmail(demos[p].email);
    setPassword(demos[p].password);
    setError("");
  };

  const handleLogin = async () => {
    if (!email || !password) { setError(t("error")); return; }
    setLoading(true); setError("");
    try { await login(email, password); }
    catch (err) { setError(err.response?.data?.message || t("invalidCredentials")); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => loginWithPopup(`${API}/auth/google?role=${portal}`);

  const portalLabels = {
    employee: t("employeePortal"),
    manager:  t("managerPortal"),
    owner:    t("ownerPortal"),
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"var(--font-body)", position:"relative" }}>

      {/* Language switcher */}
      <div style={{ position:"absolute", top:20, right:24, zIndex:100 }}>
        <LanguageSwitcher />
      </div>

      {/* LEFT panel */}
      <div style={{ flex:1, background:"#1a1a1a", display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 48px" }}>
        <div className="su-brand" style={{ color:"#f5b800", marginBottom:20, cursor:"pointer" }} onClick={onHomeClick}>
          <div className="su-logobox">UP</div>{t("appName")}
        </div>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:52, color:"#f5b800", lineHeight:1 }}>{t("loginTitle")}</h1>
        <p style={{ color:"#999", marginTop:14, fontSize:15, lineHeight:1.7 }}>{t("loginSubtitle")}</p>
        <div style={{ marginTop:32, background:"#222", borderRadius:12, padding:18 }}>
          <div style={{ color:"#666", fontSize:12, marginBottom:10 }}>{t("demoCredentials")}</div>
          {Object.entries(demos).map(([role, creds]) => (
            <div key={role} style={{ fontSize:12, color:"#777", marginBottom:4 }}>
              <span style={{ color:"#555", textTransform:"capitalize" }}>{portalLabels[role]}:</span>{" "}
              <span style={{ color:"#f5b800" }}>{creds.email}</span>
              <span style={{ color:"#555" }}> / {creds.password}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT panel */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7" }}>
        <div style={{ width:"100%", maxWidth:400, padding:36 }}>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:34, marginBottom:4 }}>{t("loginTitle")}</h2>
          <p style={{ color:"#888", fontSize:14, marginBottom:22 }}>{t("loginSubtitle")}</p>

          {/* 1. Pick portal */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
              {t("role")}
            </div>
            <div style={{ display:"flex", gap:4, background:"#efefec", borderRadius:10, padding:4 }}>
              {["employee","manager","owner"].map((p) => (
                <button key={p} onClick={() => switchPortal(p)} style={{
                  flex:1, padding:"9px 0", border:"none", borderRadius:7, cursor:"pointer",
                  fontFamily:"var(--font-body)", fontSize:12, fontWeight:700,
                  background: portal===p ? PORTAL_COLORS[p] : "transparent",
                  color:      portal===p ? (p==="owner" ? "#1a1a1a" : "#fff") : "#888",
                  boxShadow:  portal===p ? "0 2px 8px rgba(0,0,0,.15)" : "none",
                  transition: "all .2s",
                }}>{portalLabels[p]}</button>
              ))}
            </div>
          </div>

          {/* 2. OAuth buttons — open popup, stay on localhost:3000 */}
          <button style={oauthBtn("#fff","#1a1a1a","#e0e0e0")} onClick={handleGoogle}
            onMouseOver={e=>e.currentTarget.style.opacity=".85"}
            onMouseOut={e=>e.currentTarget.style.opacity="1"}>
            <GoogleIcon />{t("continueWithGoogle")}
          </button>

          <Divider label={t("orContinueWith")} />

          {/* 3. Email + password */}
          {error && <div className="su-alert-err" style={{ marginBottom:12 }}>{error}</div>}

          <div className="su-form-row">
            <label className="su-label">{t("email")}</label>
            <input className="su-input" type="email" placeholder={t("email")}
              value={email} onChange={e=>setEmail(e.target.value)} />
          </div>
          <div className="su-form-row">
            <label className="su-label">{t("password")}</label>
            <input className="su-input" type="password" placeholder={t("password")}
              value={password} onChange={e=>setPassword(e.target.value)}
              onKeyDown={e=>e.key==="Enter"&&handleLogin()} />
          </div>

          <button className="su-btn su-btn-black w-full" onClick={handleLogin}
            disabled={loading} style={{ width:"100%", marginTop:4 }}>
            {loading ? <span className="spinner" /> : t("login")}
          </button>

          <p style={{ fontSize:13, textAlign:"center", marginTop:16 }}>
            {t("noAccount")}{" "}
            <span style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }} onClick={onRegisterClick}>
              {t("register")}
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;