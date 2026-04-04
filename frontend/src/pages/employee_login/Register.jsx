import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:5000/api";

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

export default function Register({ onHomeClick, onLoginClick }) {
  const { t }                        = useLanguage();
  const { register, loginWithPopup } = useAuth();
  const [role,         setRole]         = useState("employee");
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [position,     setPosition]     = useState("");
  const [availability, setAvailability] = useState("Full-Time");
  const [error,        setError]        = useState("");
  const [loading,      setLoading]      = useState(false);

  const handleGoogle = () => loginWithPopup(`${API_URL}/auth/google?role=${role}`);

  const handleRegister = async () => {
    if (!firstName || !lastName || !email || !password) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      await register({ firstName, lastName, email, password, role, position, availability });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed.");
    } finally { setLoading(false); }
  };

  const portalLabels = {
    employee: t("employeePortal") || "Employee",
    manager:  t("managerPortal")  || "Manager",
    owner:    t("ownerPortal")    || "Owner",
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", fontFamily:"var(--font-body)", position:"relative" }}>
      <div style={{ position:"absolute", top:20, right:24, zIndex:100 }}><LanguageSwitcher /></div>

      {/* LEFT */}
      <div style={{ flex:"0 0 340px", background:"#1a1a1a", display:"flex", flexDirection:"column", justifyContent:"center", padding:"56px 40px" }}>
        <div className="su-brand" style={{ color:"#f5b800", marginBottom:20, cursor:"pointer" }} onClick={onHomeClick}>
          <div className="su-logobox">UP</div>{t("appName") || "SHIFT-UP"}
        </div>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:48, color:"#f5b800", lineHeight:1 }}>Create Account</h1>
        <p style={{ color:"#999", marginTop:14, fontSize:14, lineHeight:1.7 }}>
          Select your role and create your account to get started.
        </p>
      </div>

      {/* RIGHT */}
      <div style={{ flex:1, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", overflowY:"auto", padding:"40px 24px" }}>
        <div style={{ width:"100%", maxWidth:420 }}>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:20 }}>Register</h2>

          {/* Portal picker */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>I am a</div>
            <div style={{ display:"flex", gap:4, background:"#efefec", borderRadius:10, padding:4 }}>
              {["employee","manager","owner"].map(p => (
                <button key={p} onClick={() => { setRole(p); setError(""); }} style={{
                  flex:1, padding:"9px 0", border:"none", borderRadius:7, cursor:"pointer",
                  fontFamily:"var(--font-body)", fontSize:12, fontWeight:700,
                  background: role===p ? PORTAL_COLORS[p] : "transparent",
                  color:      role===p ? (p==="owner" ? "#1a1a1a" : "#fff") : "#888",
                  transition: "all .2s",
                }}>{portalLabels[p]}</button>
              ))}
            </div>
          </div>

          {/* Google */}
          <button onClick={handleGoogle} style={{
            width:"100%", display:"flex", alignItems:"center", justifyContent:"center", gap:10,
            padding:"12px 16px", border:"1.5px solid #e0e0e0", borderRadius:10, cursor:"pointer",
            background:"#fff", fontFamily:"var(--font-body)", fontSize:14, fontWeight:600,
            marginBottom:16,
          }}>
            <GoogleIcon /> Sign up with Google
          </button>

          <div style={{ display:"flex", alignItems:"center", gap:10, margin:"0 0 16px" }}>
            <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
            <span style={{ fontSize:12, color:"#aaa" }}>or</span>
            <div style={{ flex:1, height:1, background:"#e5e5e5" }} />
          </div>

          {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:12 }}>{error}</div>}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
            <div className="su-form-row">
              <label className="su-label">First Name</label>
              <input className="su-input" value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div className="su-form-row">
              <label className="su-label">Last Name</label>
              <input className="su-input" value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div className="su-form-row">
            <label className="su-label">Email</label>
            <input className="su-input" type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="Email" />
          </div>
          <div className="su-form-row">
            <label className="su-label">Password</label>
            <input className="su-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>
          <div className="su-form-row">
            <label className="su-label">Position (optional)</label>
            <input className="su-input" value={position} onChange={e=>setPosition(e.target.value)} placeholder="e.g. Waitstaff, Cook" />
          </div>
          <div className="su-form-row">
            <label className="su-label">Availability</label>
            <select className="su-input" value={availability} onChange={e=>setAvailability(e.target.value)}>
              <option value="Full-Time">Full-Time</option>
              <option value="Part-Time">Part-Time</option>
              <option value="On-Call">On-Call</option>
            </select>
          </div>

          <button className="su-btn su-btn-black" onClick={handleRegister} disabled={loading} style={{ width:"100%", marginTop:8 }}>
            {loading ? <span className="spinner" /> : "Create Account"}
          </button>

          <p style={{ fontSize:13, textAlign:"center", marginTop:16 }}>
            Already have an account?{" "}
            <span style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }} onClick={onLoginClick}>Login</span>
          </p>
        </div>
      </div>
    </div>
  );
}