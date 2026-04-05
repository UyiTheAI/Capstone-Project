import React, { useState } from "react";
import api from "../api";

export default function ChangePassword() {
  const [current, setCurrent] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState(false);

  const strength = newPass.length === 0 ? 0
    : newPass.length < 4 ? 1
    : newPass.length < 7 ? 2
    : newPass.length < 10 ? 3 : 4;
  const strengthLabel = ["","Weak","Fair","Good","Strong"][strength];
  const strengthColor = ["","#dc2626","#f59e0b","#3b82f6","#22c55e"][strength];

  const handleSubmit = async () => {
    setError("");
    if (!current)            { setError("Enter your current password."); return; }
    if (!newPass)            { setError("Enter a new password."); return; }
    if (newPass.length < 6)  { setError("New password must be at least 6 characters."); return; }
    if (newPass !== confirm)  { setError("New passwords do not match."); return; }
    if (newPass === current)  { setError("New password must be different from current."); return; }
    setLoading(true);
    try {
      await api.put("/auth/change-password", { currentPassword: current, newPassword: newPass });
      setSuccess(true);
      setCurrent(""); setNewPass(""); setConfirm("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to change password.");
    } finally { setLoading(false); }
  };

  const inputStyle = { width:"100%", padding:"11px 14px", border:"1.5px solid #e0e0e0", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none", boxSizing:"border-box" };
  const labelStyle = { fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 };

  if (success) return (
    <div style={{ textAlign:"center", padding:"32px 0" }}>
      <div style={{ fontSize:56, marginBottom:12 }}>✅</div>
      <div style={{ fontFamily:"var(--font-head)", fontSize:26, marginBottom:8 }}>Password Changed!</div>
      <div style={{ color:"#888", fontSize:14, marginBottom:20 }}>Your password has been updated successfully.</div>
      <button onClick={() => setSuccess(false)} style={{ padding:"11px 28px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontWeight:800, cursor:"pointer", fontFamily:"var(--font-body)", fontSize:14 }}>
        Done
      </button>
    </div>
  );

  return (
    <div>
      <div style={{ marginBottom:20, padding:"12px 16px", background:"#f9f9f7", borderRadius:10, fontSize:13, color:"#888" }}>
        🔐 You must know your current password to change it.
      </div>

      {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>{error}</div>}

      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>Current Password</label>
        <input type="password" value={current} onChange={e=>setCurrent(e.target.value)} placeholder="Enter current password" style={inputStyle} />
      </div>

      <div style={{ marginBottom:14 }}>
        <label style={labelStyle}>New Password</label>
        <input type="password" value={newPass} onChange={e=>setNewPass(e.target.value)} placeholder="Min 6 characters" style={inputStyle} />
        {newPass.length > 0 && (
          <div style={{ marginTop:8 }}>
            <div style={{ display:"flex", gap:4, marginBottom:4 }}>
              {[1,2,3,4].map(i => (
                <div key={i} style={{ flex:1, height:4, borderRadius:2, background: strength>=i ? strengthColor : "#e5e5e5", transition:"background .2s" }} />
              ))}
            </div>
            <div style={{ fontSize:11, color:strengthColor, fontWeight:600 }}>{strengthLabel}</div>
          </div>
        )}
      </div>

      <div style={{ marginBottom:20 }}>
        <label style={labelStyle}>Confirm New Password</label>
        <input
          type="password" value={confirm} onChange={e=>setConfirm(e.target.value)}
          onKeyDown={e=>e.key==="Enter"&&handleSubmit()} placeholder="Repeat new password"
          style={{ ...inputStyle, borderColor: confirm.length>0 ? (confirm===newPass?"#22c55e":"#dc2626") : "#e0e0e0" }}
        />
        {confirm.length > 0 && (
          <div style={{ fontSize:11, marginTop:4, color: confirm===newPass?"#22c55e":"#dc2626", fontWeight:600 }}>
            {confirm===newPass ? "✓ Passwords match" : "✗ Passwords do not match"}
          </div>
        )}
      </div>

      <button onClick={handleSubmit} disabled={loading} style={{ width:"100%", padding:"13px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:loading?"not-allowed":"pointer", opacity:loading?.7:1 }}>
        {loading ? "Changing password..." : "Change Password"}
      </button>
    </div>
  );
}