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

function AppleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 814 1000">
      <path d="M788.1 340.9c-5.8 4.5-108.2 62.2-108.2 190.5 0 148.4 130.3 200.9 134.2 202.2-.6 3.2-20.7 71.9-68.7 141.9-42.8 61.6-87.5 123.1-155.5 123.1s-85.5-39.5-164-39.5c-76.5 0-103.7 40.8-165.9 40.8s-105-42.4-150.3-109.3C67.3 786.6 20 707.8 20 632.1 20 478.3 104.7 388 185.4 340.9c47.8-27.5 100.8-41.3 155.2-41.3 63 0 108.7 36.8 165.1 36.8 53.9 0 87.3-36.8 164.6-36.8 37.4 0 131.2 3.8 188.8 41.3zm-97-173.1c29.5-35.6 51-84.2 51-132.9 0-6.4-.6-12.9-1.9-18.7-47.8 2.5-103.5 31.9-137.9 74.6-26.8 32.5-50.6 82.1-50.6 131.4 0 7.1 1.3 14.2 1.9 16.5 3.2.6 8.4 1.3 13.6 1.3 43.7 0 95.5-27.5 123.9-72.2z"/>
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

export default function Register({ onLoginClick }) {
  const { t }        = useLanguage();
  const { register, loginWithPopup } = useAuth();
  const [form, setForm] = useState({ firstName:"", lastName:"", email:"", password:"", role:"employee", position:"", availability:"Full-Time" });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.email || !form.password) { setError(t("error")); return; }
    if (form.password.length < 6) { setError(t("error")); return; }
    setLoading(true);
    try { await register(form); }
    catch (err) { setError(err.response?.data?.message || t("registrationFailed")); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"var(--font-body)", position:"relative" }}>

      {/* ── Language switcher — top right ──────────────────────────── */}
      <div style={{ position:"absolute", top:20, right:24, zIndex:100 }}>
        <LanguageSwitcher />
      </div>

      {/* LEFT */}
      <div style={{ flex:1, background:"#1a1a1a", display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 48px" }}>
        <div className="su-brand" style={{ color:"#f5b800", marginBottom:24 }}>
          <div className="su-logobox">UP</div>{t("appName")}
        </div>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:54, color:"#f5b800", lineHeight:1, marginBottom:16 }}>{t("registerTitle")}</h1>
        <p style={{ color:"#999", fontSize:15, lineHeight:1.7 }}>{t("registerSubtitle")}</p>
      </div>

      {/* RIGHT */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", padding:"40px 24px", overflowY:"auto" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:4 }}>{t("registerTitle")}</h2>
          <p className="text-sm text-muted" style={{ marginBottom:20 }}>{t("registerSubtitle")}</p>

          {/* OAuth buttons */}
          <button onClick={handleGoogle} style={oauthBtn("#fff","#1a1a1a","#e0e0e0")}
              onMouseOver={e=>e.currentTarget.style.opacity=".85"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
              <GoogleIcon />{t("signUpWithGoogle")}
            </button>
          <button onClick={handleApple} style={oauthBtn("#000","#fff","#000")}
              onMouseOver={e=>e.currentTarget.style.opacity=".8"} onMouseOut={e=>e.currentTarget.style.opacity="1"}>
              <AppleIcon />{t("signUpWithApple")}
            </button>

          <Divider label={t("orContinueWith")} />

          {error && <div className="su-alert-err" style={{ marginBottom:16 }}>{error}</div>}

          {/* Name */}
          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label className="su-label">{t("firstName")} *</label>
              <input className="su-input" type="text" placeholder={t("firstName")} value={form.firstName} onChange={update("firstName")} />
            </div>
            <div style={{ flex:1 }}>
              <label className="su-label">{t("lastName")}</label>
              <input className="su-input" type="text" placeholder={t("lastName")} value={form.lastName} onChange={update("lastName")} />
            </div>
          </div>

          <div style={{ marginBottom:14 }}>
            <label className="su-label">{t("email")} *</label>
            <input className="su-input" type="email" placeholder="your@email.com" value={form.email} onChange={update("email")} />
          </div>

          <div style={{ marginBottom:14 }}>
            <label className="su-label">{t("password")} *</label>
            <input className="su-input" type="password" placeholder="••••••" value={form.password} onChange={update("password")} />
          </div>

          <div style={{ display:"flex", gap:12, marginBottom:14 }}>
            <div style={{ flex:1 }}>
              <label className="su-label">{t("role")} *</label>
              <select className="su-input" value={form.role} onChange={update("role")}>
                <option value="employee">{t("roleEmployee")}</option>
                <option value="manager">{t("roleManager")}</option>
                <option value="owner">{t("roleOwner")}</option>
              </select>
            </div>
            <div style={{ flex:1 }}>
              <label className="su-label">{t("availabilityLabel2")}</label>
              <select className="su-input" value={form.availability} onChange={update("availability")}>
                <option value="Full-Time">{t("fullTimeOpt")}</option>
                <option value="Part-Time">{t("partTimeOpt")}</option>
                <option value="On-Call">{t("onCallOpt")}</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom:20 }}>
            <label className="su-label">{t("position")}</label>
            <input className="su-input" type="text" placeholder={t("positionPlaceholder")} value={form.position} onChange={update("position")} />
          </div>

          <button className="su-btn su-btn-black w-full" onClick={handleSubmit} disabled={loading} style={{ width:"100%", marginBottom:16 }}>
            {loading ? <span className="spinner" /> : t("register")}
          </button>

          <p className="text-sm text-center">
            {t("haveAccount")}{" "}
            <span onClick={onLoginClick} style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }}>{t("signIn")}</span>
          </p>
        </div>
      </div>
    </div>
  );
}