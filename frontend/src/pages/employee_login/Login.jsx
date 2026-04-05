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
  { key: "employee", label: "Employee", color: "#4f46e5", textColor: "#fff"    },
  { key: "manager",  label: "Manager",  color: "#0891b2", textColor: "#fff"    },
  { key: "owner",    label: "Owner",    color: "#f5b800", textColor: "#1a1a1a" },
];

export default function Login({ onHomeClick }) {
  const { t }                     = useLanguage();
  const { login, loginWithPopup } = useAuth();
  const [portal,   setPortal]     = useState("employee");
  const [email,    setEmail]      = useState("");
  const [password, setPassword]   = useState("");
  const [error,    setError]      = useState("");
  const [loading,  setLoading]    = useState(false);

  const switchPortal = (p) => { setPortal(p); setError(""); };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter your email and password."); return; }
    setLoading(true); setError("");
    try { await login(email, password); }
    catch (err) { setError(err.response?.data?.message || "Invalid email or password."); }
    finally { setLoading(false); }
  };

  const handleGoogle = () => loginWithPopup(`${API}/auth/google?role=${portal}`);
  const activePortal = PORTALS.find(p => p.key === portal);

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "var(--font-body)", position: "relative" }}>
      <div style={{ position: "absolute", top: 20, right: 24, zIndex: 100 }}>
        <LanguageSwitcher />
      </div>

      {/* ── LEFT PANEL ── */}
      <div style={{ flex: "0 0 380px", background: "#1a1a1a", display: "flex", flexDirection: "column", justifyContent: "center", padding: "56px 44px" }}>
        <div className="su-brand" style={{ color: "#f5b800", marginBottom: 32, cursor: "pointer" }} onClick={onHomeClick}>
          <div className="su-logobox">UP</div>SHIFT-UP
        </div>

        <h1 style={{ fontFamily: "var(--font-head)", fontSize: 52, color: "#f5b800", lineHeight: 1, marginBottom: 14 }}>
          Welcome Back
        </h1>
        <p style={{ color: "#666", fontSize: 15, lineHeight: 1.7, marginBottom: 32 }}>
          Sign in to your SHIFT-UP workforce management portal.
        </p>

        {/* Portal selector cards */}
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {PORTALS.map(p => (
            <div
              key={p.key}
              onClick={() => switchPortal(p.key)}
              style={{
                padding: "14px 18px", borderRadius: 12, cursor: "pointer",
                background: portal === p.key ? p.color : "#222",
                border: `1.5px solid ${portal === p.key ? p.color : "#333"}`,
                transition: "all .2s",
              }}
            >
              <div style={{ fontWeight: 800, fontSize: 14, color: portal === p.key ? p.textColor : "#888" }}>
                {p.label} Portal
              </div>
              <div style={{ fontSize: 12, color: portal === p.key ? p.textColor : "#555", opacity: .8, marginTop: 2 }}>
                {p.key === "owner"
                  ? "Restaurant owners and administrators"
                  : p.key === "manager"
                  ? "Floor managers and supervisors"
                  : "Restaurant staff and employees"}
              </div>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 24, padding: "14px 16px", background: "#222", borderRadius: 12, fontSize: 13, color: "#555", lineHeight: 1.6 }}>
          🔐 To change your password, log in and click your profile avatar in the top right.
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f7" }}>
        <div style={{ width: "100%", maxWidth: 420, padding: 40 }}>

          {/* Active portal badge */}
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: activePortal.color, color: activePortal.textColor, padding: "6px 16px", borderRadius: 20, fontSize: 13, fontWeight: 700, marginBottom: 24 }}>
            {activePortal.label} Portal
          </div>

          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 40, marginBottom: 6 }}>Sign In</h2>
          <p style={{ color: "#888", fontSize: 14, marginBottom: 28 }}>
            Enter your credentials to access your portal.
          </p>

          {/* Portal tabs */}
          <div style={{ display: "flex", gap: 4, background: "#efefec", borderRadius: 10, padding: 4, marginBottom: 24 }}>
            {PORTALS.map(p => (
              <button
                key={p.key}
                onClick={() => switchPortal(p.key)}
                style={{
                  flex: 1, padding: "9px 0", border: "none", borderRadius: 7, cursor: "pointer",
                  fontFamily: "var(--font-body)", fontSize: 12, fontWeight: 700,
                  background: portal === p.key ? p.color : "transparent",
                  color:      portal === p.key ? p.textColor : "#888",
                  transition: "all .2s",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>

          {/* Google login */}
          <button
            onClick={handleGoogle}
            style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, padding: "12px 16px", border: "1.5px solid #e0e0e0", borderRadius: 10, cursor: "pointer", background: "#fff", fontFamily: "var(--font-body)", fontSize: 14, fontWeight: 600, marginBottom: 20, transition: "border-color .2s" }}
            onMouseOver={e => e.currentTarget.style.borderColor = "#f5b800"}
            onMouseOut={e  => e.currentTarget.style.borderColor = "#e0e0e0"}
          >
            <GoogleIcon /> Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 20 }}>
            <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
            <span style={{ fontSize: 12, color: "#aaa" }}>or sign in with email</span>
            <div style={{ flex: 1, height: 1, background: "#e5e5e5" }} />
          </div>

          {error && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 16 }}>
              {error}
            </div>
          )}

          <div className="su-form-row">
            <label className="su-label">Email</label>
            <input
              className="su-input" type="email" value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="your@email.com"
              autoComplete="email"
            />
          </div>

          <div className="su-form-row">
            <label className="su-label">Password</label>
            <input
              className="su-input" type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleLogin()}
              placeholder="Your password"
              autoComplete="current-password"
            />
          </div>

          <button
            className="su-btn su-btn-black"
            onClick={handleLogin}
            disabled={loading}
            style={{ width: "100%", marginTop: 8 }}
          >
            {loading ? <span className="spinner" /> : `Sign In as ${activePortal.label}`}
          </button>

          <div style={{ marginTop: 20, padding: "12px 16px", background: "#f9f9f7", borderRadius: 10, fontSize: 13, color: "#888", lineHeight: 1.6 }}>
            <strong style={{ color: "#555" }}>Don't have an account?</strong><br />
            Contact your restaurant owner or manager to create an account for you.
          </div>
        </div>
      </div>
    </div>
  );
}