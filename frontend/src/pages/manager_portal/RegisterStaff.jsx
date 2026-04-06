import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function RegisterStaff() {
  const { user } = useAuth();
  const isOwner  = user?.role === "owner";

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
  const [staffList,    setStaffList]    = useState([]);
  const [listLoading,  setListLoading]  = useState(true);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setListLoading(true);
    try {
      const res = await api.get("/users");
      setStaffList(res.data.users || []);
    } catch (err) {
      console.error("Failed to load staff:", err.message);
    } finally { setListLoading(false); }
  };

  const resetForm = () => {
    setFirstName(""); setLastName(""); setEmail("");
    setPassword(""); setPosition(""); setAvailability("Full-Time");
    setError(""); setSuccess("");
  };

  const handleCreate = async () => {
    setError(""); setSuccess("");
    if (!firstName.trim()) { setError("First name is required."); return; }
    if (!lastName.trim())  { setError("Last name is required."); return; }
    if (!email.trim())     { setError("Email is required."); return; }
    if (!password)         { setError("Password is required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (!/\S+@\S+\.\S+/.test(email)) { setError("Please enter a valid email."); return; }

    setLoading(true);
    try {
      const res = await api.post("/users/create-employee", {
        firstName: firstName.trim(), lastName: lastName.trim(),
        email: email.trim().toLowerCase(), password,
        position: position.trim(), availability, role,
      });
      setSuccess(`✅ ${res.data.message}`);
      resetForm();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account.");
    } finally { setLoading(false); }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name}? They will no longer be able to log in.`)) return;
    try {
      await api.delete(`/users/${id}`);
      setStaffList(prev => prev.filter(s => (s._id||s.id) !== id));
    } catch (err) {
      alert(err.response?.data?.message || "Failed to remove staff member.");
    }
  };

  const inputStyle = {
    width: "100%", padding: "11px 14px", border: "1.5px solid #e5e5e5",
    borderRadius: 10, fontFamily: "var(--font-body)", fontSize: 14,
    outline: "none", boxSizing: "border-box", background: "#fff",
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#888",
    display: "block", marginBottom: 6, textTransform: "uppercase", letterSpacing: .5,
  };
  const roleColorMap = { employee: "#4f46e5", manager: "#0891b2", owner: "#f5b800" };

  return (
    <div className="su-page">

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 className="su-title" style={{ marginBottom: 4 }}>
          {isOwner ? "Register Staff" : "Register Employee"}
        </h1>
        <p style={{ color: "#888", fontSize: 14, margin: 0 }}>
          {isOwner
            ? "Create accounts for your managers and employees."
            : "Create accounts for your employees."}
          {" "}Only staff you register will appear here.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 28, alignItems: "start" }}>

        {/* ── CREATE FORM ── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "26px 24px", boxShadow: "0 4px 20px rgba(0,0,0,.06)", border: "1px solid #f0f0f0" }}>
          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 24, margin: "0 0 20px" }}>New Account</h3>

          {/* Role toggle — only show manager for owners */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Account Type</label>
            <div style={{ display: "flex", gap: 8, background: "#f0f0ec", borderRadius: 10, padding: 4 }}>
              <button onClick={() => setRole("employee")} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, background: role==="employee"?"#4f46e5":"transparent", color: role==="employee"?"#fff":"#888", transition: "all .2s" }}>
                👤 Employee
              </button>
              {isOwner && (
                <button onClick={() => setRole("manager")} style={{ flex: 1, padding: "10px 0", border: "none", borderRadius: 8, cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700, background: role==="manager"?"#0891b2":"transparent", color: role==="manager"?"#fff":"#888", transition: "all .2s" }}>
                  🏷️ Manager
                </button>
              )}
            </div>
          </div>

          {error   && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}
          {success && <div style={{ padding:"10px 14px", background:"#dcfce7", borderRadius:8, color:"#16a34a", fontSize:13, marginBottom:14 }}>{success}</div>}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 12 }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="John" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="staff@email.com" />
          </div>

          <div style={{ marginBottom: 12 }}>
            <label style={labelStyle}>Temporary Password *</label>
            <input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)} placeholder="Min 6 characters" />
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>Share this with the staff member. They can change it in their Profile.</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 20 }}>
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

          <button onClick={handleCreate} disabled={loading} style={{ width: "100%", padding: "13px 0", background: loading?"#ccc":"#f5b800", color: "#1a1a1a", border: "none", borderRadius: 12, fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15, cursor: loading?"not-allowed":"pointer" }}>
            {loading ? "Creating..." : `+ Create ${role==="manager"?"Manager":"Employee"} Account`}
          </button>
        </div>

        {/* ── STAFF LIST ── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 14 }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 24, margin: 0 }}>
              Your Staff <span style={{ fontSize: 15, color: "#aaa", fontWeight: 400 }}>({staffList.length})</span>
            </h3>
            <button onClick={fetchStaff} style={{ background: "#f0f0ec", border: "none", borderRadius: 8, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#888", fontFamily: "var(--font-body)" }}>
              🔄 Refresh
            </button>
          </div>

          {listLoading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#aaa", background: "#fff", borderRadius: 16 }}>Loading...</div>
          ) : staffList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, background: "#f9f9f7", borderRadius: 16, border: "2px dashed #e5e5e5", color: "#aaa" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
              <div style={{ fontWeight: 700, marginBottom: 4 }}>No staff registered yet</div>
              <div style={{ fontSize: 13 }}>Use the form to add your first staff member</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 500, overflowY: "auto" }}>
              {staffList.map(s => {
                const id   = s._id || s.id;
                const name = `${s.firstName} ${s.lastName}`;
                const ini  = `${s.firstName?.[0]||""}${s.lastName?.[0]||""}`.toUpperCase();
                const bg   = roleColorMap[s.role] || "#888";
                return (
                  <div key={id} style={{ background: "#fff", borderRadius: 14, padding: "14px 16px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 10px rgba(0,0,0,.05)", border: "1px solid #f0f0f0" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 40, height: 40, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.role==="owner"?"#1a1a1a":"#fff", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                        {ini}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14 }}>{name}</div>
                        <div style={{ fontSize: 12, color: "#aaa" }}>{s.email}</div>
                        {s.position && <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>{s.position} · {s.availability}</div>}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <span style={{ padding: "3px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, background: s.role==="manager"?"#e0f2fe":"#ede9fe", color: s.role==="manager"?"#0891b2":"#4f46e5" }}>
                        {s.role}
                      </span>
                      <button onClick={() => handleDelete(id, name)} title="Remove" style={{ background: "none", border: "1px solid #fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 13, padding: "4px 10px", borderRadius: 8, fontWeight: 700, fontFamily: "var(--font-body)" }}>
                        ✕
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: 14, background: "#f0f7ff", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#3b82f6", border: "1px solid #bfdbfe" }}>
            💡 Staff log in at the <strong>Login page</strong> with their email and temporary password. They can update their password in their <strong>Profile</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}