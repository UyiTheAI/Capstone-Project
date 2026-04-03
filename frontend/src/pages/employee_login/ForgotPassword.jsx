import React, { useState } from "react";
import api from "../../api";

export default function ForgotPassword({ onBack }) {
  const [email,   setEmail]   = useState("");
  const [sent,    setSent]    = useState(false);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!email) { setError("Please enter your email."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to send reset email.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", fontFamily:"var(--font-body)" }}>
      <div style={{ width:"100%", maxWidth:420, padding:36, background:"#fff", borderRadius:20, boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

        {sent ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:56, marginBottom:16 }}>📧</div>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:8 }}>Check your email</h2>
            <p style={{ color:"#888", marginBottom:24 }}>We sent a password reset link to <strong>{email}</strong>. It expires in 30 minutes.</p>
            <button className="su-btn su-btn-black" onClick={onBack} style={{ width:"100%" }}>Back to Login</button>
          </div>
        ) : (
          <>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:4 }}>Forgot Password</h2>
            <p style={{ color:"#888", fontSize:14, marginBottom:24 }}>Enter your email and we'll send you a reset link.</p>

            {error && <div className="su-alert-err" style={{ marginBottom:12 }}>{error}</div>}

            <div className="su-form-row">
              <label className="su-label">Email</label>
              <input className="su-input" type="email" value={email} onChange={e=>setEmail(e.target.value)}
                placeholder="your@email.com" onKeyDown={e=>e.key==="Enter"&&handleSubmit()} />
            </div>

            <button className="su-btn su-btn-black" onClick={handleSubmit} disabled={loading} style={{ width:"100%", marginTop:8 }}>
              {loading ? <span className="spinner" /> : "Send Reset Link"}
            </button>

            <p style={{ fontSize:13, textAlign:"center", marginTop:16 }}>
              <span style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }} onClick={onBack}>← Back to Login</span>
            </p>
          </>
        )}
      </div>
    </div>
  );
}