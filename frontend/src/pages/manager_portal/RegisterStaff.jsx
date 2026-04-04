import React, { useState, useEffect } from "react";
import api from "../../api";

const POSITIONS = ["Waitstaff","Cook","Bartender","Host","Cashier","Supervisor","Dishwasher","Delivery","Other"];
const AVAILABILITIES = ["Full-Time","Part-Time","On-Call"];

export default function RegisterStaff() {
  const [role,         setRole]         = useState("employee");
  const [firstName,    setFirstName]    = useState("");
  const [lastName,     setLastName]     = useState("");
  const [email,        setEmail]        = useState("");
  const [password,     setPassword]     = useState("");
  const [position,     setPosition]     = useState("");
  const [availability, setAvailability] = useState("Full-Time");
  const [loading,      setLoading]      = useState(false);
  const [error,        setError]        = useState("");
  const [success,      setSuccess]      = useState("");
  const [staff,        setStaff]        = useState([]);
  const [loadingStaff, setLoadingStaff] = useState(true);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setLoadingStaff(true);
    try {
      const res = await api.get("/users");
      setStaff(res.data.users || []);
    } catch {}
    finally { setLoadingStaff(false); }
  };

  const reset = () => {
    setFirstName(""); setLastName(""); setEmail("");
    setPassword(""); setPosition(""); setAvailability("Full-Time");
  };

  const handleCreate = async () => {
    if (!firstName || !lastName || !email || !password) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError(""); setSuccess("");
    try {
      await api.post("/users/create-employee", { firstName, lastName, email, password, position, availability, role });
      setSuccess(`✅ ${role === "manager" ? "Manager" : "Employee"} account created! They can now log in.`);
      reset();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account.");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}?`)) return;
    try { await api.delete(`/users/${id}`); fetchStaff(); } catch {}
  };

  const inp = {
    width:"100%", padding:"11px 14px", border:"1.5px solid #e0e0e0",
    borderRadius:10, fontFamily:"var(--font-body)", fontSize:14,
    outline:"none", boxSizing:"border-box",
  };
  const lbl = { fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6 };

  return (
    <div style={{ padding:"32px 40px", fontFamily:"var(--font-body)", maxWidth:1100, margin:"0 auto" }}>
      <h1 style={{ fontFamily:"var(--font-head)", fontSize:42, marginBottom:4 }}>Register Staff</h1>
      <p style={{ color:"#888", marginBottom:36 }}>Create login accounts for your employees and managers.</p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:32 }}>

        {/* ── CREATE FORM ── */}
        <div style={{ background:"#fff", borderRadius:20, padding:"28px 24px", boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:26, marginBottom:20 }}>Create Account</h2>

          {/* Role toggle */}
          <div style={{ marginBottom:20 }}>
            <label style={lbl}>Role</label>
            <div style={{ display:"flex", gap:6, background:"#f0f0ec", borderRadius:10, padding:4 }}>
              {[["employee","👤 Employee"],["manager","🧑‍💼 Manager"]].map(([r,label]) => (
                <button key={r} onClick={() => setRole(r)} style={{
                  flex:1, padding:"10px 0", border:"none", borderRadius:8, cursor:"pointer",
                  fontFamily:"var(--font-body)", fontSize:13, fontWeight:700,
                  background: role===r ? "#1a1a1a" : "transparent",
                  color:      role===r ? "#fff" : "#888", transition:"all .2s",
                }}>{label}</button>
              ))}
            </div>
          </div>

          {success && <div style={{ padding:"12px 16px", background:"#dcfce7", borderRadius:10, color:"#16a34a", fontSize:13, marginBottom:14, fontWeight:600 }}>{success}</div>}
          {error   && <div style={{ padding:"12px 16px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:13, marginBottom:14 }}>{error}</div>}

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
            <div>
              <label style={lbl}>First Name *</label>
              <input style={inp} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="First name" />
            </div>
            <div>
              <label style={lbl}>Last Name *</label>
              <input style={inp} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Last name" />
            </div>
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Email *</label>
            <input style={inp} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="employee@email.com" />
          </div>

          <div style={{ marginBottom:12 }}>
            <label style={lbl}>Temporary Password *</label>
            <input style={inp} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" />
          </div>

          <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:20 }}>
            <div>
              <label style={lbl}>Position</label>
              <select style={inp} value={position} onChange={e=>setPosition(e.target.value)}>
                <option value="">Select…</option>
                {POSITIONS.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label style={lbl}>Availability</label>
              <select style={inp} value={availability} onChange={e=>setAvailability(e.target.value)}>
                {AVAILABILITIES.map(a => <option key={a} value={a}>{a}</option>)}
              </select>
            </div>
          </div>

          <button onClick={handleCreate} disabled={loading} style={{
            width:"100%", padding:"14px 0", background:"#f5b800", color:"#1a1a1a",
            border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800,
            fontSize:15, cursor:"pointer", transition:"opacity .15s", opacity: loading ? .7 : 1,
          }}>
            {loading ? "Creating account…" : `Create ${role === "manager" ? "Manager" : "Employee"} Account`}
          </button>

          <div style={{ fontSize:11, color:"#aaa", textAlign:"center", marginTop:10 }}>
            They can log in immediately with these credentials.
          </div>
        </div>

        {/* ── STAFF LIST ── */}
        <div style={{ background:"#fff", borderRadius:20, padding:"28px 24px", boxShadow:"0 4px 20px rgba(0,0,0,.06)" }}>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:26, marginBottom:4 }}>Your Staff</h2>
          <p style={{ color:"#888", fontSize:13, marginBottom:20 }}>{staff.length} accounts</p>

          {loadingStaff ? (
            <div style={{ textAlign:"center", color:"#aaa", padding:"40px 0" }}>Loading…</div>
          ) : staff.length === 0 ? (
            <div style={{ textAlign:"center", color:"#aaa", padding:"40px 0", fontSize:14 }}>
              No staff yet. Create an account on the left.
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:460, overflowY:"auto" }}>
              {staff.map(s => (
                <div key={s._id || s.id} style={{ display:"flex", alignItems:"center", justifyContent:"space-between", padding:"12px 14px", background:"#f9f9f7", borderRadius:12 }}>
                  <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                    <div style={{ width:36, height:36, borderRadius:"50%", background: s.role === "manager" ? "#0891b2" : "#4f46e5", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:14 }}>
                      {s.firstName?.[0]}{s.lastName?.[0]}
                    </div>
                    <div>
                      <div style={{ fontWeight:700, fontSize:14, color:"#1a1a1a" }}>{s.firstName} {s.lastName}</div>
                      <div style={{ fontSize:12, color:"#888" }}>{s.email}</div>
                      <div style={{ fontSize:11, marginTop:2 }}>
                        <span style={{ background: s.role === "manager" ? "#e0f2fe" : "#ede9fe", color: s.role === "manager" ? "#0369a1" : "#5b21b6", padding:"2px 8px", borderRadius:99, fontWeight:700 }}>
                          {s.role}
                        </span>
                        {s.position && <span style={{ color:"#aaa", marginLeft:6 }}>{s.position}</span>}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(s._id || s.id, `${s.firstName} ${s.lastName}`)} style={{ background:"none", border:"none", color:"#dc2626", cursor:"pointer", fontSize:18, padding:"4px 8px" }}>
                    🗑
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}