import React, { useState } from "react";
import { useGoogleLogin } from "@react-oauth/google";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import api from "../../api";
import "../../App.css";

function ForgotPasswordModal({ onClose }) {
  const { t } = useLanguage();
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) { setError(t("errInvalidEmail")); return; }
    setLoading(true); setError("");
    try { await api.post("/auth/forgot-password", { email }); }
    catch {}
    finally { setLoading(false); setSent(true); }
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:4000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:18, width:"100%", maxWidth:400, fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.25)", overflow:"hidden" }}>
        <div style={{ background:"#1a1a1a", padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:"#fff" }}>{t("resetPwdTitle")}</div>
            <div style={{ fontSize:12, color:"#666", marginTop:2 }}>{t("resetPwdSubtitle")}</div>
          </div>
          <button onClick={onClose} style={{ width:30, height:30, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"none", color:"#fff", cursor:"pointer", fontSize:16, display:"flex", alignItems:"center", justifyContent:"center" }}>✕</button>
        </div>
        <div style={{ padding:"28px 24px" }}>
          {sent ? (
            <div style={{ textAlign:"center", padding:"8px 0" }}>
              <div style={{ fontWeight:800, fontSize:16, color:"#1a1a1a", marginBottom:8 }}>{t("checkInboxTitle")}</div>
              <div style={{ fontSize:13, color:"#888", lineHeight:1.7, marginBottom:24 }}>
                {t("contactSuccessMsg")}
              </div>
              <button onClick={onClose} style={{ width:"100%", padding:"13px", background:"#1a1a1a", color:"#f5b800", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                {t("backToSignIn")}
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <div style={{ background:"#fee2e2", color:"#dc2626", padding:"10px 14px", borderRadius:9, fontSize:13, marginBottom:16 }}>⚠ {error}</div>}
              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.6, marginBottom:8 }}>{t("emailAddressLabel")}</label>
                <input type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="your@email.com" autoFocus required
                  style={{ width:"100%", padding:"12px 16px", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none", boxSizing:"border-box", transition:"border-color .2s" }}
                  onFocus={e=>e.target.style.borderColor="#f5b800"} onBlur={e=>e.target.style.borderColor="#e5e5e5"} />
              </div>
              <button type="submit" disabled={loading}
                style={{ width:"100%", padding:"13px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:loading?"not-allowed":"pointer", opacity:loading?.7:1, marginBottom:10 }}>
                {loading ? t("contactSending") : `${t("sendResetBtn")} →`}
              </button>
              <button type="button" onClick={onClose}
                style={{ width:"100%", padding:"10px", background:"transparent", color:"#aaa", border:"none", fontFamily:"var(--font-body)", fontSize:13, cursor:"pointer" }}>
                {t("cancel")}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Login({ onRegisterClick, onHomeClick }) {
  const { login, logout, loginWithOAuthData } = useAuth();
  const { t }      = useLanguage();
  const [email,          setEmail]          = useState("");
  const [password,       setPassword]       = useState("");
  const [showPass,       setShowPass]       = useState(false);
  const [error,          setError]          = useState("");
  const [loading,        setLoading]        = useState(false);
  const [gLoading,       setGLoading]       = useState(false);
  const [showForgot,     setShowForgot]     = useState(false);
  const [selectedPortal, setSelectedPortal] = useState("employee");

  // Google Sign-In via access token → backend verify → ShiftUp JWT
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGLoading(true);
      setError("");
      try {
        const res = await api.post("/auth/google/token", {
          accessToken: tokenResponse.access_token,
          role: selectedPortal,
        });
        const { token, user: userData } = res.data;

        // Portal enforcement for Google login
        const role = userData?.role || "";
        const portalMatch =
          (selectedPortal === "owner"    && role === "owner") ||
          (selectedPortal === "manager"  && role === "manager") ||
          (selectedPortal === "employee" && role !== "owner" && role !== "manager");

        if (!portalMatch) {
          const roleLabel =
            role === "owner"   ? (t("ownerLabel")   || "Owner")   :
            role === "manager" ? (t("managerLabel") || "Manager") :
                                 (t("employeeLabel") || "Employee");
          setError(
            (t("wrongPortalError") || "Wrong portal selected.") +
            " This account is a " + roleLabel + " account. Please select \"" + roleLabel + "\" above and try again."
          );
        } else {
          loginWithOAuthData(token, userData);
        }
      } catch (e) {
        setError(e.response?.data?.message || "Google sign-in failed. Please try again.");
      } finally {
        setGLoading(false);
      }
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed. Please try again.");
    },
  });

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError(t("errAllFields"));
      return;
    }
    setLoading(true);
    setError("");
    try {
      const loggedInUser = await login(email.trim(), password);
      const role = loggedInUser?.role || "";

      const portalMatch =
        (selectedPortal === "owner"    && role === "owner") ||
        (selectedPortal === "manager"  && role === "manager") ||
        (selectedPortal === "employee" && role !== "owner" && role !== "manager");

      if (!portalMatch) {
        logout();
        const roleLabel =
          role === "owner"   ? (t("ownerLabel")   || "Owner")   :
          role === "manager" ? (t("managerLabel") || "Manager") :
                               (t("employeeLabel") || "Employee");
        setError(
          (t("wrongPortalError") || "Wrong portal selected.") +
          " This account is a " + roleLabel + " account. Please select \"" + roleLabel + "\" above and try again."
        );
      }
    } catch (e) {
      setError(e.response?.data?.message || t("loginError"));
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (e) => {
    if (e.key === "Enter") handleLogin();
  };

  const TRUST_LABELS = [t("trustSsl"), t("trustStripe"), t("trustCanada")];

  return (
    <>
      <div style={{ minHeight:"100vh", display:"grid", gridTemplateColumns:"420px 1fr", fontFamily:"var(--font-body)", background:"#f4f4f0" }}>

        <div style={{ background:"#111", display:"flex", flexDirection:"column", padding:"40px 44px", position:"relative", overflow:"hidden" }}>
          <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"linear-gradient(90deg,#f5b800,#ffdd57,#f5b800)" }} />
          <div style={{ position:"absolute", inset:0, top:3, opacity:.03, backgroundImage:"radial-gradient(circle at 1px 1px,#fff 1px,transparent 0)", backgroundSize:"26px 26px", pointerEvents:"none" }} />

          <button onClick={onHomeClick} style={{ display:"flex", alignItems:"center", gap:10, background:"none", border:"none", cursor:"pointer", padding:0, marginBottom:"auto" }}>
            <div style={{ width:36, height:36, background:"#f5b800", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:"#1a1a1a", fontWeight:900, flexShrink:0 }}>SU</div>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#fff", letterSpacing:2 }}>{t("appName")}</span>
          </button>

          <div style={{ margin:"60px 0 48px" }}>
            <h1 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:52, color:"#fff", lineHeight:1, marginBottom:16, letterSpacing:.5 }}>
              {t("welcomeBack").toUpperCase()}<br /><span style={{ color:"#f5b800" }}>.</span>
            </h1>
            <p style={{ color:"#666", fontSize:13, lineHeight:1.8, maxWidth:300 }}>
              {t("loginSubtitle")}
            </p>
          </div>

          <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:"auto" }}>
            {[
              ["#4f46e5", t("mySchedule")],
              ["#0891b2", t("shiftSwap")],
              ["#16a34a", t("dashboard")],
              ["#f59e0b", t("tips")],
              ["#8b5cf6", t("pricingFeat7")],
            ].map(([c,txt]) => (
              <div key={txt} style={{ display:"flex", alignItems:"center", gap:10 }}>
                <div style={{ width:7, height:7, borderRadius:"50%", background:c, flexShrink:0 }} />
                <span style={{ fontSize:13, color:"#777" }}>{txt}</span>
              </div>
            ))}
          </div>

          <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", marginTop:40 }}>
            <LanguageSwitcher light />
            <span style={{ fontSize:11, color:"#333" }}>© {new Date().getFullYear()} SHIFT-UP</span>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", justifyContent:"center", padding:"40px 32px", position:"relative" }}>

          <button onClick={onHomeClick}
            style={{ position:"absolute", top:24, right:24, padding:"7px 16px", background:"#fff", border:"1.5px solid #e5e5e5", borderRadius:8, fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, color:"#888", cursor:"pointer", transition:"all .15s" }}
            onMouseOver={e=>{e.currentTarget.style.borderColor="#1a1a1a";e.currentTarget.style.color="#1a1a1a";}}
            onMouseOut={e=>{e.currentTarget.style.borderColor="#e5e5e5";e.currentTarget.style.color="#888";}}>
            ← {t("navFeatures").split(" ")[0]}
          </button>

          <div style={{ width:"100%", maxWidth:400 }}>


            {/* ── Portal Selector ── */}
            <div style={{ display:"flex", gap:8, marginBottom:28 }}>
              {[
                { key:"employee", label:t("employeeLabel")||"Employee" },
                { key:"owner",    label:t("ownerLabel")||"Owner" },
                { key:"manager",  label:t("managerLabel")||"Manager" },
              ].map(p => {
                const active = selectedPortal === p.key;
                return (
                  <button key={p.key} onClick={()=>setSelectedPortal(p.key)}
                    style={{ flex:1, padding:"11px 6px", border:active?"2px solid #1a1a1a":"1.5px solid #e5e5e5", borderRadius:10, background:active?"#1a1a1a":"#fff", color:active?"#f5b800":"#888", fontFamily:"var(--font-body)", fontWeight:active?800:500, fontSize:13, cursor:"pointer", transition:"all .15s" }}>
                    {p.label}
                  </button>
                );
              })}
            </div>

            <h2 style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:34, color:"#1a1a1a", marginBottom:4, letterSpacing:.5 }}>{t("signIn")}</h2>
            <p style={{ fontSize:13, color:"#aaa", marginBottom:32, lineHeight:1.6 }}>
              {t("loginSubtitle")}
            </p>

            {error && (
              <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", color:"#dc2626", padding:"12px 16px", borderRadius:10, fontSize:13, marginBottom:20, display:"flex", alignItems:"flex-start", gap:10 }}>
                <span style={{ fontSize:16, flexShrink:0, marginTop:1 }}>⚠</span>
                <span>{error}</span>
              </div>
            )}

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

            <div style={{ marginBottom:10 }}>
              <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:8 }}>
                <label style={{ fontSize:11, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:.6 }}>
                  {t("password")}
                </label>
                <button type="button" onClick={() => setShowPass(s=>!s)}
                  style={{ fontSize:12, color:"#aaa", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", padding:0 }}>
                  {showPass ? t("hide") : t("show")}
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

            <div style={{ textAlign:"right", marginBottom:24 }}>
              <button onClick={() => setShowForgot(true)}
                style={{ fontSize:12, color:"#aaa", background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", padding:0, transition:"color .15s" }}
                onMouseOver={e=>e.currentTarget.style.color="#1a1a1a"}
                onMouseOut={e=>e.currentTarget.style.color="#aaa"}>
                {t("forgotPassword")}
              </button>
            </div>

            <button
              onClick={handleLogin}
              disabled={loading}
              style={{ width:"100%", padding:"14px", background: loading ? "#e5e5e5" : "#1a1a1a", color: loading ? "#aaa" : "#f5b800", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor: loading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20, transition:"all .15s" }}>
              {loading ? (
                <>
                  <span style={{ width:18, height:18, border:"2px solid rgba(245,184,0,.3)", borderTopColor:"#f5b800", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} />
                  <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
                  {t("signingIn")}
                </>
              ) : (
                <>{t("login")} →</>
              )}
            </button>

            <div style={{ display:"flex", alignItems:"center", gap:12, marginBottom:16 }}>
              <div style={{ flex:1, height:1, background:"#f0f0f0" }} />
              <span style={{ fontSize:11, color:"#ddd" }}>{t("orDivider")}</span>
              <div style={{ flex:1, height:1, background:"#f0f0f0" }} />
            </div>

            {/* Google Sign-In Button */}
            <button
              onClick={() => googleLogin()}
              disabled={gLoading}
              style={{ width:"100%", padding:"13px 16px", background: gLoading ? "#f9f9f9" : "#fff", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, fontWeight:600, color: gLoading ? "#aaa" : "#3c3c3c", cursor: gLoading ? "not-allowed" : "pointer", display:"flex", alignItems:"center", justifyContent:"center", gap:10, marginBottom:20, transition:"all .15s", boxShadow:"0 1px 4px rgba(0,0,0,.06)" }}
              onMouseOver={e=>{ if(!gLoading){e.currentTarget.style.borderColor="#bbb";e.currentTarget.style.boxShadow="0 2px 8px rgba(0,0,0,.1)";}}}
              onMouseOut={e=>{e.currentTarget.style.borderColor="#e5e5e5";e.currentTarget.style.boxShadow="0 1px 4px rgba(0,0,0,.06)";}}>
              {gLoading ? (
                <>
                  <span style={{ width:16, height:16, border:"2px solid #e5e5e5", borderTopColor:"#4285F4", borderRadius:"50%", animation:"spin .7s linear infinite", display:"inline-block" }} />
                  Signing in…
                </>
              ) : (
                <>
                  <svg width="18" height="18" viewBox="0 0 48 48" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#EA4335" d="M24 9.5c3.14 0 5.95 1.08 8.17 2.84l6.1-6.1C34.46 3.1 29.5 1 24 1 14.82 1 7.07 6.48 3.96 14.27l7.1 5.52C12.7 13.6 17.93 9.5 24 9.5z"/>
                    <path fill="#4285F4" d="M46.52 24.5c0-1.64-.15-3.22-.43-4.75H24v9h12.7c-.55 2.97-2.2 5.5-4.68 7.2l7.2 5.6C43.4 37.5 46.52 31.5 46.52 24.5z"/>
                    <path fill="#FBBC05" d="M11.07 28.21A14.63 14.63 0 0 1 9.5 24c0-1.47.26-2.9.72-4.21l-7.1-5.52A23.93 23.93 0 0 0 0 24c0 3.85.92 7.5 2.55 10.73l7.09-5.5-.57-.02z"/>
                    <path fill="#34A853" d="M24 47c5.5 0 10.13-1.82 13.5-4.95l-7.2-5.6c-1.82 1.22-4.15 1.95-6.3 1.95-6.07 0-11.3-4.1-13.14-9.7l-7.09 5.5C7.07 41.52 14.82 47 24 47z"/>
                  </svg>
                  {t("googleSignIn") || "Continue with Google"}
                </>
              )}
            </button>

            <div style={{ display:"flex", justifyContent:"center", gap:20, marginBottom:4 }}>
              {TRUST_LABELS.map(l => (
                <span key={l} style={{ fontSize:11, color:"#ccc" }}>{l}</span>
              ))}
            </div>

            <div style={{ marginTop:28, padding:"14px 16px", background:"#f9f9f7", borderRadius:10, fontSize:12, color:"#aaa", lineHeight:1.7, textAlign:"center" }}>
              {t("newOwnerMsg")}{" "}
              <span style={{ color:"#f5b800", fontWeight:700, cursor:"pointer" }} onClick={onHomeClick}>
                {t("startFreeTrialLink")}
              </span>
              {" "}{t("fromHomepage")}
            </div>
          </div>
        </div>
      </div>

      {showForgot && <ForgotPasswordModal onClose={() => setShowForgot(false)} />}
    </>
  );
}
