import React, { useState } from "react";
import api from "../../api";

export default function ResetPassword() {
  // Get token from URL path /reset-password/TOKEN
  const token = window.location.pathname.split("/reset-password/")[1];

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [done,      setDone]       = useState(false);
  const [loading,   setLoading]    = useState(false);
  const [error,     setError]      = useState("");

  const handleReset = async () => {
    if (!password || password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }
    setLoading(true); setError("");
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
    } catch (err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", fontFamily:"var(--font-body)" }}>
      <div style={{ width:"100%", maxWidth:420, padding:36, background:"#fff", borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
        {done ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>✅</div>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:8 }}>Password Reset!</h2>
            <p style={{ color:"#888", marginBottom:24 }}>Your password has been updated. You can now log in.</p>
            <button className="su-btn su-btn-black" onClick={() => window.location.href = "/"} style={{ width:"100%" }}>
              Go to Login
            </button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:4 }}>Reset Password</h2>
            <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Enter your new password below.</p>
            {error && <div className="su-alert-err" style={{ marginBottom:12 }}>{error}</div>}
            <div className="su-form-row">
              <label className="su-label">New Password</label>
              <input className="su-input" type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" />
            </div>
            <div className="su-form-row">
              <label className="su-label">Confirm Password</label>
              <input className="su-input" type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
                onKeyDown={e=>e.key==="Enter"&&handleReset()} placeholder="Repeat password" />
            </div>
            <button className="su-btn su-btn-black" onClick={handleReset} disabled={loading} style={{ width:"100%", marginTop:8 }}>
              {loading ? <span className="spinner" /> : "Reset Password"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}