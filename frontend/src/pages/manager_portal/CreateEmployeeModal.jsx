import React, { useState } from "react";
import api from "../../api";

export default function CreateEmployeeModal({ onClose, onCreated }) {
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [position,     setPosition]     = useState("");
  const [availability, setAvailability] = useState("Full-Time");
  const [role,         setRole]         = useState("employee");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState(false);

  const handleCreate = async () => {
    if (!firstName || !lastName || !email || !password) {
      setError("All fields are required."); return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters."); return;
    }
    setLoading(true); setError("");
    try {
      await api.post("/users/create-employee", {
        firstName, lastName, email, password, position, availability, role,
      });
      setSuccess(true);
      setTimeout(() => { onCreated?.(); onClose(); }, 1500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account.");
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width:"100%", padding:"10px 14px", border:"1.5px solid #e0e0e0",
    borderRadius:10, fontFamily:"var(--font-body)", fontSize:14,
    outline:"none", boxSizing:"border-box", marginTop:6,
  };
  const labelStyle = {
    fontSize:12, fontWeight:700, color:"#555", display:"block",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.6)", zIndex:2000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:480, fontFamily:"var(--font-body)", overflow:"hidden", boxShadow:"0 16px 60px rgba(0,0,0,.2)" }}>

        {/* Header */}
        <div style={{ background:"#1a1a1a", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:24, color:"#f5b800" }}>Create Employee Account</div>
          <button onClick={onClose} style={{ background:"none", border:"none", color:"#888", fontSize:20, cursor:"pointer" }}>✕</button>
        </div>

        <div style={{ padding:"24px 28px" }}>
          {success && (
            <div style={{ padding:"14px 18px", background:"#dcfce7", borderRadius:10, color:"#16a34a", fontWeight:700, marginBottom:16, textAlign:"center" }}>
              ✅ Employee account created successfully!
            </div>
          )}

          {error && (
            <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>
              {error}
            </div>
          )}

          {/* Role picker */}
          <div style={{ marginBottom:16 }}>
            <label style={labelStyle}>Role</label>
            <div style={{ display:"flex", gap:8, marginTop:6 }}>
              {["employee","manager"].map(r => (
                <button key={r} onClick={() => setRole(r)} style={{
                  flex:1, padding:"10px 0", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"var(--font-body)", fontSize:13, fontWeight:700,
                  background: role===r ? "#1a1a1a" : "#f0f0ec",
                  color:      role===r ? "#fff" : "#888",
                }}>
                  {r.charAt(0).toUpperCase() + r.slice(1)}
                </button>
              ))}
            </div>
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={labelStyle}>First Name</label>
              <input style={inputStyle} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div>
              <label style={labelStyle}>Last Name</label>
              <input style={inputStyle} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>Email</label>
            <input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="employee@email.com" />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={labelStyle}>Temporary Password</label>
            <input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            <div>
              <label style={labelStyle}>Position</label>
              <input style={inputStyle} value={position} onChange={e=>setPosition(e.target.value)} placeholder="e.g. Waitstaff" />
            </div>
            <div>
              <label style={labelStyle}>Availability</label>
              <select style={inputStyle} value={availability} onChange={e=>setAvailability(e.target.value)}>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="On-Call">On-Call</option>
              </select>
            </div>
          </div>

          <div style={{ display:"flex", gap:10 }}>
            <button onClick={onClose} style={{ flex:1, padding:"12px 0", background:"#f0f0ec", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:700, cursor:"pointer", color:"#666" }}>
              Cancel
            </button>
            <button onClick={handleCreate} disabled={loading || success} style={{ flex:2, padding:"12px 0", background:"#f5b800", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, cursor:"pointer", color:"#1a1a1a", fontSize:15 }}>
              {loading ? "Creating…" : success ? "✅ Created!" : "Create Account"}
            </button>
          </div>

          <div style={{ fontSize:11, color:"#aaa", textAlign:"center", marginTop:10 }}>
            The employee can log in immediately with these credentials.
          </div>
        </div>
      </div>
    </div>
  );
}