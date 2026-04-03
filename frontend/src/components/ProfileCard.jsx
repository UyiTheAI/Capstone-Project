import React, { useState, useRef } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";

export default function ProfileCard({ onClose }) {
  const { user, updateUser } = useAuth();
  const [firstName,  setFirstName]  = useState(user?.firstName || "");
  const [lastName,   setLastName]   = useState(user?.lastName  || "");
  const [position,   setPosition]   = useState(user?.position  || "");
  const [avatar,     setAvatar]     = useState(user?.avatar    || null);
  const [saving,     setSaving]     = useState(false);
  const [success,    setSuccess]    = useState("");
  const [error,      setError]      = useState("");
  const fileRef = useRef();

  // Convert image file to base64
  const handlePhotoChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { setError("Photo must be under 2MB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => setAvatar(ev.target.result); // base64 string
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSuccess("");
    try {
      const res = await api.put("/auth/me", { firstName, lastName, position, avatar });
      updateUser({ ...user, firstName, lastName, position, avatar });
      setSuccess("Profile updated!");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save");
    } finally { setSaving(false); }
  };

  const initials = `${user?.firstName?.[0] || ""}${user?.lastName?.[0] || ""}`.toUpperCase();

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.5)", zIndex:1000, display:"flex", alignItems:"center", justifyContent:"center" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:36, width:"100%", maxWidth:440, fontFamily:"var(--font-body)", position:"relative" }}>

        {/* Close */}
        <button onClick={onClose} style={{ position:"absolute", top:16, right:16, background:"none", border:"none", fontSize:20, cursor:"pointer", color:"#888" }}>✕</button>

        <h2 style={{ fontFamily:"var(--font-head)", fontSize:28, marginBottom:24 }}>My Profile</h2>

        {/* Avatar */}
        <div style={{ display:"flex", flexDirection:"column", alignItems:"center", marginBottom:28 }}>
          <div
            onClick={() => fileRef.current.click()}
            style={{
              width:90, height:90, borderRadius:"50%", cursor:"pointer",
              overflow:"hidden", background:"#f5b800", display:"flex", alignItems:"center", justifyContent:"center",
              fontSize:32, fontWeight:800, color:"#1a1a1a", position:"relative",
              border:"3px solid #f5b800", boxShadow:"0 4px 16px rgba(245,184,0,.3)",
            }}
          >
            {avatar
              ? <img src={avatar} alt="avatar" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <span>{initials}</span>
            }
            {/* Hover overlay */}
            <div style={{ position:"absolute", inset:0, background:"rgba(0,0,0,.4)", display:"flex", alignItems:"center", justifyContent:"center", opacity:0, transition:".2s" }}
              onMouseEnter={e=>e.currentTarget.style.opacity="1"}
              onMouseLeave={e=>e.currentTarget.style.opacity="0"}>
              <span style={{ color:"#fff", fontSize:12, fontWeight:700 }}>Change</span>
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display:"none" }} onChange={handlePhotoChange} />
          <button onClick={() => fileRef.current.click()} style={{ marginTop:10, background:"none", border:"1px solid #e5e5e5", borderRadius:8, padding:"6px 14px", fontSize:12, cursor:"pointer", color:"#555" }}>
            📷 Upload Photo
          </button>
          <div style={{ fontSize:11, color:"#aaa", marginTop:4 }}>Max 2MB · JPG or PNG</div>
        </div>

        {success && <div style={{ padding:"10px 16px", background:"#dcfce7", borderRadius:8, color:"#16a34a", fontSize:14, marginBottom:12 }}>✓ {success}</div>}
        {error   && <div className="su-alert-err" style={{ marginBottom:12 }}>{error}</div>}

        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          <div className="su-form-row">
            <label className="su-label">First Name</label>
            <input className="su-input" value={firstName} onChange={e=>setFirstName(e.target.value)} />
          </div>
          <div className="su-form-row">
            <label className="su-label">Last Name</label>
            <input className="su-input" value={lastName} onChange={e=>setLastName(e.target.value)} />
          </div>
        </div>

        <div className="su-form-row">
          <label className="su-label">Position</label>
          <input className="su-input" value={position} onChange={e=>setPosition(e.target.value)} />
        </div>

        <div style={{ marginTop:8, padding:"12px 16px", background:"#f9f9f7", borderRadius:10, fontSize:13, color:"#888" }}>
          <div><strong>Email:</strong> {user?.email}</div>
          <div><strong>Role:</strong>  {user?.role}</div>
          {user?.orgCode && <div><strong>Org Code:</strong> <span style={{ fontWeight:800, letterSpacing:3, color:"#f5b800" }}>{user.orgCode}</span> — Share this with your team</div>}
        </div>

        <button className="su-btn su-btn-black" onClick={handleSave} disabled={saving} style={{ width:"100%", marginTop:20 }}>
          {saving ? <span className="spinner" /> : "Save Changes"}
        </button>
      </div>
    </div>
  );
}