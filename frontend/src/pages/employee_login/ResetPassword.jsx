import React, { useState } from "react";
import api from "../../api";

export default function ResetPassword() {
  // Get token from URL path: /reset-password/TOKEN_HERE
  const pathParts = window.location.pathname.split("/reset-password/");
  const token     = pathParts.length > 1 ? pathParts[1] : "";

  const [password,  setPassword]  = useState("");
  const [confirm,   setConfirm]   = useState("");
  const [loading,   setLoading]   = useState(false);
  const [done,      setDone]      = useState(false);
  const [error,     setError]     = useState("");

  const strength = password.length === 0 ? 0
    : password.length < 4 ? 1
    : password.length < 7 ? 2
    : password.length < 10 ? 3 : 4;

  const strengthLabel = ["", "Weak", "Fair", "Good", "Strong"][strength];
  const strengthColor = ["", "#dc2626", "#f59e0b", "#3b82f6", "#22c55e"][strength];

  const handleReset = async () => {
    setError("");
    if (!token)           { setError("Invalid reset link. Please request a new one."); return; }
    if (!password)        { setError("Please enter a new password."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (password !== confirm) { setError("Passwords do not match."); return; }

    setLoading(true);
    try {
      await api.post(`/auth/reset-password/${token}`, { password });
      setDone(true);
    } catch(err) {
      setError(err.response?.data?.message || "Reset failed. The link may have expired. Please request a new one.");
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width:"100%", padding:"12px 14px",
    border:"1.5px solid #e0e0e0", borderRadius:10,
    fontFamily:"var(--font-body)", fontSize:14,
    outline:"none", boxSizing:"border-box",
  };

  // ── Invalid token ──────────────────────────────────────────────────────────
  if (!token) return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:440, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
        <div style={{ fontSize:52, marginBottom:12 }}>⚠️</div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:32, marginBottom:8 }}>Invalid Reset Link</h2>
        <p style={{ color:"#888", marginBottom:24, lineHeight:1.7 }}>
          This link is invalid or has already been used.<br/>Please request a new password reset.
        </p>
        <button
          onClick={() => window.location.href = "/"}
          style={{ width:"100%", padding:"13px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontWeight:800, cursor:"pointer", fontFamily:"var(--font-body)", fontSize:15 }}
        >
          Go to Login
        </button>
      </div>
    </div>
  );

  // ── Success ────────────────────────────────────────────────────────────────
  if (done) return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:440, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:34, marginBottom:8 }}>Password Reset!</h2>
        <p style={{ color:"#555", lineHeight:1.7, marginBottom:24 }}>
          Your password has been updated successfully.<br/>
          You can now log in with your new password.
        </p>
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12, padding:"12px 16px", marginBottom:24, fontSize:13, color:"#166534" }}>
          ✅ Password changed successfully
        </div>
        <button
          onClick={() => window.location.href = "/"}
          style={{ width:"100%", padding:"14px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"var(--font-body)" }}
        >
          Go to Login →
        </button>
      </div>
    </div>
  );

  // ── Reset form ─────────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:440, width:"100%", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

        <div style={{ textAlign:"center", marginBottom:28 }}>
          <div style={{ fontSize:52, marginBottom:12 }}>🔐</div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, margin:0 }}>Reset Password</h2>
          <p style={{ color:"#888", marginTop:8, fontSize:14 }}>
            Enter your new password below.
          </p>
        </div>

        {error && (
          <div style={{ padding:"12px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16, lineHeight:1.5 }}>
            {error}
          </div>
        )}

        {/* New Password */}
        <div style={{ marginBottom:14 }}>
          <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>
            New Password
          </label>
          <input
            type="password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            placeholder="Min 6 characters"
            autoFocus
            style={inputStyle}
          />
          {/* Strength bar */}
          {password.length > 0 && (
            <div style={{ marginTop:8 }}>
              <div style={{ display:"flex", gap:4, marginBottom:4 }}>
                {[1,2,3,4].map(i => (
                  <div key={i} style={{ flex:1, height:4, borderRadius:2, background: strength >= i ? strengthColor : "#e5e5e5", transition:"background .2s" }} />
                ))}
              </div>
              <div style={{ fontSize:11, color:strengthColor, fontWeight:600 }}>{strengthLabel}</div>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div style={{ marginBottom:20 }}>
          <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:8, textTransform:"uppercase", letterSpacing:.5 }}>
            Confirm Password
          </label>
          <input
            type="password"
            value={confirm}
            onChange={e => setConfirm(e.target.value)}
            onKeyDown={e => e.key === "Enter" && handleReset()}
            placeholder="Repeat new password"
            style={{
              ...inputStyle,
              borderColor: confirm.length > 0 ? (confirm === password ? "#22c55e" : "#dc2626") : "#e0e0e0",
            }}
          />
          {confirm.length > 0 && (
            <div style={{ fontSize:11, marginTop:4, color: confirm === password ? "#22c55e" : "#dc2626", fontWeight:600 }}>
              {confirm === password ? "✓ Passwords match" : "✗ Passwords do not match"}
            </div>
          )}
        </div>

        <button
          onClick={handleReset}
          disabled={loading}
          style={{ width:"100%", padding:"14px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:loading?"not-allowed":"pointer", opacity:loading?.7:1 }}
        >
          {loading ? "Resetting password..." : "Reset Password →"}
        </button>

        <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"#aaa" }}>
          Remember your password?{" "}
          <span onClick={() => window.location.href = "/"} style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }}>
            Back to Login
          </span>
        </div>
      </div>
    </div>
  );
}