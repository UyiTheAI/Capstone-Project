import React, { useState } from "react";
import api from "../../api";

export default function ForgotPassword({ onBack }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [sent,    setSent]    = useState(false);
  const [error,   setError]   = useState("");

  const handleSubmit = async () => {
    if (!email) { setError("Please enter your email address."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email."); return; }
    setLoading(true); setError("");
    try {
      await api.post("/auth/forgot-password", { email });
      setSent(true);
    } catch(err) {
      setError(err.response?.data?.message || "Failed to send reset email. Please try again.");
    } finally { setLoading(false); }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:440, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

        {sent ? (
          <div style={{ textAlign:"center" }}>
            <div style={{ fontSize:64, marginBottom:16 }}>📧</div>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:8 }}>Check Your Email!</h2>
            <p style={{ color:"#555", lineHeight:1.7, marginBottom:20 }}>
              We sent a password reset link to<br/><strong>{email}</strong>
            </p>
            <div style={{ background:"#f9f9f7", borderRadius:12, padding:"14px 16px", fontSize:13, color:"#888", marginBottom:24, textAlign:"left", lineHeight:1.8 }}>
              <div>✅ Check your inbox</div>
              <div>📁 Check your spam/junk folder</div>
              <div>⏰ Link expires in 30 minutes</div>
            </div>
            <button
              onClick={() => { setSent(false); setEmail(""); }}
              style={{ width:"100%", padding:"12px", background:"#f0f0ec", border:"none", borderRadius:10, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)", marginBottom:10, fontSize:14 }}
            >
              Try Different Email
            </button>
            <button
              onClick={onBack}
              style={{ width:"100%", padding:"12px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer", fontFamily:"var(--font-body)", fontSize:14 }}
            >
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <div style={{ textAlign:"center", marginBottom:28 }}>
              <div style={{ fontSize:52, marginBottom:12 }}>🔑</div>
              <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, margin:0 }}>Forgot Password?</h2>
              <p style={{ color:"#888", marginTop:8, fontSize:14, lineHeight:1.6 }}>
                No worries! Enter your email and we'll send you a reset link.
              </p>
            </div>

            {error && (
              <div style={{ padding:"12px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>
                {error}
              </div>
            )}

            <div style={{ marginBottom:20 }}>
              <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => e.key === "Enter" && handleSubmit()}
                placeholder="you@restaurant.com"
                autoFocus
                style={{ width:"100%", padding:"12px 14px", border:"1.5px solid #e0e0e0", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none", boxSizing:"border-box" }}
              />
            </div>

            <button
              onClick={handleSubmit}
              disabled={loading}
              style={{ width:"100%", padding:"14px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:loading?"not-allowed":"pointer", marginBottom:12, opacity:loading?.7:1 }}
            >
              {loading ? "Sending reset link..." : "Send Reset Link →"}
            </button>

            <button
              onClick={onBack}
              style={{ width:"100%", padding:"12px", background:"transparent", color:"#aaa", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", fontSize:14 }}
            >
              ← Back to Login
            </button>
          </>
        )}
      </div>
    </div>
  );
}