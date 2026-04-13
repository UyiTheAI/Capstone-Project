import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import api from "../../api";
import "../../App.css";

/* ── Forgot Password Modal ────────────────────────────────── */
function ForgotPasswordModal({ onClose }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError("Please enter your email address."); return; }
    setLoading(true); setError("");
    try { await api.post("/auth/forgot-password", { email }); }
    catch {} // Always show success
    finally { setLoading(false); setSent(true); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:400, fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.25)", overflow:"hidden" }}>
        <div style={{ background:"#1a1a1a", padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"#fff" }}>Reset Password</div>
            <div style={{ fontSize:12, color:"#666", marginTop:2 }}>We'll send a link to your email</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"none", color:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"28px 24px" }}>
          {sent ? (
            <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ fontWeight:800, fontSize:16, color:"#1a1a1a", marginBottom:8 }}>Check your inbox</div>
              <div style={{ fontSize:13, color:"#888", lineHeight:1.7, marginBottom:24 }}>
                If an account exists for <strong>{email}</strong>, we've sent a password reset link.
              </div>
              <button onClick={onClose} style={{ width:"100%", padding:"13px", background:"#1a1a1a", color:"#f5b800", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                Back to Sign In
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div style={{ background:"#fee2e2", color:"#dc2626", padding:"10px 14px", borderRadius:9, fontSize:13, marginBottom:16 }}>⚠ {error}</div>}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.6, marginBottom:8 }}>Email Address</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" autoFocus required
                  style={{ width:"100%", padding:"12px 16px", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none", boxSizing:"border-box", transition:"border-color .2s" }}
                  onFocus={e=>e.target.style.borderColor="#f5b800"} onBlur={e=>e.target.style.borderColor="#e5e5e5"} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"13px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:loading?"not-allowed":"pointer", opacity:loading?.7:1, marginBottom:10 }}>
                {loading ? "Sending…" : "Send Reset Link →"}
              </button>
              <button type="button" onClick={onClose}
                style={{ width:"100%", padding:"10px", background:"transparent", color:"#aaa", border:"none", fontFamily:"var(--font-body)", fontSize:13, cursor:"pointer" }}>
                Cancel
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

/* ── Login Page ───────────────────────────────────────────── */
export default function Login({ onRegisterClick, onHomeClick }) {
  const { login }  = useAuth();
  const { t }      = useLanguage();
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPass,   setShowPass]   = useState(false);
  const [error,      setError]      = useState("");
  const [loading,    setLoading]    = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      await login(email.trim(), password);
    } catch (e) {
      setError(e.response?.data?.message || "Incorrect email or password. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  return (
    <>
      <div style={{ minHeight:"100vh", display:"grid", gridTemplateColumns:"420px 1fr", fontFamily:"var(--font-body)", background:"#f4f4f0" }}>

        {/* ── LEFT — dark brand panel ── */}
        <div style={{ background:"#111", display:"flex", flexDirection:"column", padding:"40px 44px", position:"relative", overflow:"hidden" }}>
          {/* top gold line */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#f5b800,#ffdd57,#f5b800)" }} />
          {/* subtle dot grid */}
          <div style={{ position:"absolute", inset:0, top:3, opacity:.03, backgroundImage:"radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize:"26px 26px", pointerEvents:"none" }} />

          {/* Brand */}
          <button onClick={onHomeClick} style={{ display:"flex", alignItems:"center", gap:10, background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:"auto" }}>
            <div style={{ width:36, height:36, background:"#f5b800", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:"#1a1a1a", fontWeight:900, flexShrink:0 }}>SU</div>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#fff", letterSpacing:2 }}>SHIFT-UP</span>
          </button>

          {/* Headline */}
          <div style={{ margin:"60px 0 48px" }}>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:"#fff", lineHeight:1, marginBottom:16, letterSpacing:.5 }}>
              WELCOME<br /><span style={{ color:"#f5b800" }}>BACK.</span>
            </h1>
            <p style={{ color:"#666", fontSize:13, lineHeight:1.8, maxWidth:300 }}>
              Sign in to manage your team's shifts, track attendance, and keep operations running smoothly.
            </p>
          </div>

          {/* Feature dots */}
          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:"auto" }}>
            {[
              ["#4f46e5","Smart shift scheduling"],
              ["#0891b2","Shift swap management"],
              ["#16a34a","Real-time dashboard"],
              ["#f59e0b","Tip distribution"],
              ["#8b5cf6","7 Canadian languages"],
            ].map(([c,txt]) => (
              <div key={txt} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:c, flexShrink:0 }} />
                <span style={{ fontSize:13, color:"#777" }}>{txt}</span>
              </div>
            ))}
          </div>

          {/* Footer */}
          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:40 }}>
            <LanguageSwitcher light />
            <span style={{ fontSize:11, color:"#333" }}>© {new Date().getFullYear()} SHIFT-UP</span>
          </div>
        </div>

        {/* ── RIGHT — login form ── */}
        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px", position:"relative" }}>

          {/* Back link top right */}
          <button onClick={onHomeClick}
            style={{ position:"absolute", top:24, right:24, padding:"7px 16px", background:"#fff", border:"1.5px solid #e5e5e5", borderRadius:8, fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, color:"#888", cursor:"pointer", transition:"all .15s" }}
            onMouseOver={e=>{e.currentTarget.style.borderColor="#1a1a1a";e.currentTarget.style.color="#1a1a1a";}}
            onMouseOut={e=>{e.currentTarget.style.borderColor="#e5e5e5";e.currentTarget.style.color="#888";}}>
            ← Home
          </button>

          <div style={{ width:"100%", maxWidth:400 }}>

            {/* Heading */}
            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, color:"#1a1a1a", marginBottom:4, letterSpacing:.5 }}>Sign In</h2>
            <p style={{ fontSize:13, color:"#aaa", marginBottom:32, lineHeight:1.6 }}>
              Enter your credentials to access your account.
            </p>

            {/* Error */}
            {error && (
              <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", color:"#dc2626", padding:"12px 16px", borderRadius:10, fontSize:13, marginBottom:20, display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

            {/* Email */}
            <div style={{ marginBottom:16 }}>
              <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:.6, marginBottom:8 }}>
                {t("email")}
              </label>
              <input
                type="email"
                value={email}
                onChange={e => { setEmail(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                placeholder="your@email.com"
                autoComplete="email"
                style={{ width:"100%", padding:"13px 16px", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none", background:"#fff", color:"#1a1a1a", transition:"border-color .2s", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#f5b800"}
                onBlur={e=>e.target.style.borderColor="#e5e5e5"}
              />
            </div>

            {/* Password */}
            <div style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:.6 }}>
                  {t("password")}
                </label>
                <button type="button" onClick={() => setShowPass(s=>!s)}
                  style={{ fontSize:12, color:"#aaa", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", padding:0 }}>
                  {showPass ? "Hide" : "Show"}
                </button>
              </div>
              <input
                type={showPass ? "text" : "password"}
                value={password}
                onChange={e => { setPassword(e.target.value); setError(""); }}
                onKeyDown={handleKey}
                placeholder="••••••••"
                autoComplete="current-password"
                style={{ width:"100%", padding:"13px 16px", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none", background:"#fff", color:"#1a1a1a", transition:"border-color .2s", boxSizing:"border-box" }}
                onFocus={e=>e.target.style.borderColor="#f5b800"}
                onBlur={e=>e.target.style.borderColor="#e5e5e5"}
              />
            </div>

            {/* Forgot password */}
            <div style={{ textAlign:"right", marginBottom:24 }}>
              <button onClick={() => setShowForgot(true)}
                style={{ fontSize:12, color:"#aaa", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", padding:0, transition:"color .15s" }}
                onMouseOver={e=>e.currentTarget.style.color="#1a1a1a"}
                onMouseOut={e=>e.currentTarget.style.color="#aaa"}>
                {t("forgotPassword")}
              </button>
            </div>

            {/* Submit */}
            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width:"100%", padding:"14px", background: loading ? "#e5e5e5" : "#1a1a1a", color: loading ? "#aaa" : "#f5b800", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20, transition:"all .15s" }}>
              {loading ? (
                <>
                  <span style={{ width:18, height:18, border:"2px solid rgba(245,184,0,.3)", borderTopColor:"#f5b800", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  Signing in…
                </>
              ) : (
                <>{t("login")} →</>
              )}
            </button>

            {/* Divider */}
            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:20 }}>
              <div style={{ flex:1, height:1, background:"#f0f0f0" }} />
              <span style={{ fontSize:11, color:"#ddd" }}>or</span>
              <div style={{ flex:1, height:1, background:"#f0f0f0" }} />
            </div>

            {/* Trust */}
            <div style={{ display:"flex", justifyContent:"center", gap:20 }}>
              {["SSL Secured","Stripe Protected"," Canada"].map(l => (
                <span key={l} style={{ fontSize:11, color:"#ccc" }}>{l}</span>
              ))}
            </div>

            {/* Info for new owners */}
            <div style={{ marginTop:28, padding:"14px 16px", background:"#f9f9f7", borderRadius:10, fontSize:12, color:"#aaa", lineHeight:1.7, textAlign:"center" }}>
              New owner?{" "}
              <span style={{ color:"#f5b800", fontWeight:700, cursor:"pointer" }} onClick={onHomeClick}>
                Start your free trial
              </span>
              {" "}from the homepage.
            </div>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}