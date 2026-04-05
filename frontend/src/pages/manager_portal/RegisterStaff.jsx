import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function RegisterStaff() {
  const { user } = useAuth();
  const isOwner  = user?.role === "owner";

  // Form state
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

  // Staff list state
  const [staffList,   setStaffList]   = useState([]);
  const [listLoading, setListLoading] = useState(true);

  useEffect(() => { fetchStaff(); }, []);

  const fetchStaff = async () => {
    setListLoading(true);
    try {
      const res = await api.get("/users");
      setStaffList(res.data.users || []);
    } catch (err) {
      console.error("Failed to load staff:", err.message);
    } finally {
      setListLoading(false);
    }
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
        firstName: firstName.trim(),
        lastName:  lastName.trim(),
        email:     email.trim().toLowerCase(),
        password,
        position:     position.trim(),
        availability,
        role,
      });
      setSuccess(`✅ ${res.data.message} — ${firstName} ${lastName} can now log in.`);
      resetForm();
      fetchStaff();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, name) => {
    if (!window.confirm(`Remove ${name} from the system? This cannot be undone.`)) return;
    try {
      await api.delete(`/users/${id}`);
      fetchStaff();
    } catch {
      alert("Failed to remove staff member.");
    }
  };

  // Styles
  const inputStyle = {
    width: "100%", padding: "11px 14px",
    border: "1.5px solid #e5e5e5", borderRadius: 10,
    fontFamily: "var(--font-body)", fontSize: 14,
    outline: "none", boxSizing: "border-box", background: "#fff",
    transition: "border-color .2s",
  };
  const labelStyle = {
    fontSize: 12, fontWeight: 700, color: "#888",
    display: "block", marginBottom: 6,
    textTransform: "uppercase", letterSpacing: .5,
  };
  const roleColorMap = { employee: "#4f46e5", manager: "#0891b2", owner: "#f5b800" };

  return (
    <div className="su-page" style={{ fontFamily: "var(--font-body)" }}>

      {/* Page Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 className="su-title" style={{ marginBottom: 6 }}>
          {isOwner ? "Register Staff" : "Register Employee"}
        </h1>
        <p style={{ color: "#888", fontSize: 15, margin: 0 }}>
          {isOwner
            ? "Create login accounts for your managers and employees."
            : "Create login accounts for your employees."}
          {" "}Staff can log in immediately after creation.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 32, alignItems: "start" }}>

        {/* ── LEFT: Create Form ─────────────────────────────────────── */}
        <div style={{ background: "#fff", borderRadius: 20, padding: "28px 26px", boxShadow: "0 4px 24px rgba(0,0,0,.06)", border: "1px solid #f0f0f0" }}>

          <h3 style={{ fontFamily: "var(--font-head)", fontSize: 26, margin: "0 0 22px", color: "#1a1a1a" }}>
            New Account
          </h3>

          {/* Role toggle */}
          <div style={{ marginBottom: 20 }}>
            <label style={labelStyle}>Account Type</label>
            <div style={{ display: "flex", gap: 8, background: "#f0f0ec", borderRadius: 12, padding: 4 }}>
              <button
                onClick={() => setRole("employee")}
                style={{
                  flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                  cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                  background: role === "employee" ? "#4f46e5" : "transparent",
                  color:      role === "employee" ? "#fff" : "#888",
                  transition: "all .2s",
                }}
              >
                👤 Employee
              </button>
              {isOwner && (
                <button
                  onClick={() => setRole("manager")}
                  style={{
                    flex: 1, padding: "10px 0", border: "none", borderRadius: 8,
                    cursor: "pointer", fontFamily: "var(--font-body)", fontSize: 13, fontWeight: 700,
                    background: role === "manager" ? "#0891b2" : "transparent",
                    color:      role === "manager" ? "#fff" : "#888",
                    transition: "all .2s",
                  }}
                >
                  🏷️ Manager
                </button>
              )}
            </div>
            {!isOwner && (
              <div style={{ fontSize: 12, color: "#aaa", marginTop: 6 }}>
                Only owners can create manager accounts.
              </div>
            )}
          </div>

          {/* Alerts */}
          {error && (
            <div style={{ padding: "10px 14px", background: "#fee2e2", borderRadius: 8, color: "#dc2626", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
              ⚠️ {error}
            </div>
          )}
          {success && (
            <div style={{ padding: "10px 14px", background: "#dcfce7", borderRadius: 8, color: "#16a34a", fontSize: 13, marginBottom: 14, lineHeight: 1.5 }}>
              {success}
            </div>
          )}

          {/* Name row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 14 }}>
            <div>
              <label style={labelStyle}>First Name *</label>
              <input style={inputStyle} value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="John" />
            </div>
            <div>
              <label style={labelStyle}>Last Name *</label>
              <input style={inputStyle} value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Smith" />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Email *</label>
            <input style={inputStyle} type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="staff@restaurant.com" />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label style={labelStyle}>Temporary Password *</label>
            <input style={inputStyle} type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" />
            <div style={{ fontSize: 11, color: "#aaa", marginTop: 4 }}>
              Share this with the staff member. They can change it in their Profile.
            </div>
          </div>

          {/* Position + Availability */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12, marginBottom: 22 }}>
            <div>
              <label style={labelStyle}>Position</label>
              <input style={inputStyle} value={position} onChange={e => setPosition(e.target.value)} placeholder="e.g. Waitstaff" />
            </div>
            <div>
              <label style={labelStyle}>Availability</label>
              <select style={inputStyle} value={availability} onChange={e => setAvailability(e.target.value)}>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="On-Call">On-Call</option>
              </select>
            </div>
          </div>

          {/* Submit */}
          <button
            onClick={handleCreate}
            disabled={loading}
            style={{
              width: "100%", padding: "14px 0",
              background: loading ? "#ccc" : "#f5b800",
              color: "#1a1a1a", border: "none", borderRadius: 12,
              fontFamily: "var(--font-body)", fontWeight: 800, fontSize: 15,
              cursor: loading ? "not-allowed" : "pointer",
              transition: "background .2s",
            }}
          >
            {loading ? "Creating account..." : `+ Create ${role === "manager" ? "Manager" : "Employee"} Account`}
          </button>

          <div style={{ textAlign: "center", fontSize: 12, color: "#aaa", marginTop: 10 }}>
            Staff can log in immediately at the Login page
          </div>
        </div>

        {/* ── RIGHT: Staff List ─────────────────────────────────────── */}
        <div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
            <h3 style={{ fontFamily: "var(--font-head)", fontSize: 26, margin: 0 }}>
              Staff List
              <span style={{ fontSize: 16, color: "#aaa", fontWeight: 400, marginLeft: 8 }}>
                ({staffList.length})
              </span>
            </h3>
            <button
              onClick={fetchStaff}
              style={{ background: "#f0f0ec", border: "none", borderRadius: 8, padding: "7px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#888", fontFamily: "var(--font-body)" }}
            >
              🔄 Refresh
            </button>
          </div>

          {listLoading ? (
            <div style={{ textAlign: "center", padding: 48, color: "#aaa", background: "#fff", borderRadius: 16 }}>
              Loading staff...
            </div>
          ) : staffList.length === 0 ? (
            <div style={{ textAlign: "center", padding: 48, color: "#aaa", background: "#f9f9f7", borderRadius: 16, border: "2px dashed #e5e5e5" }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>👥</div>
              <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 4 }}>No staff yet</div>
              <div style={{ fontSize: 13 }}>Use the form to create the first account</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 10, maxHeight: 520, overflowY: "auto" }}>
              {staffList.map(s => {
                const id   = s._id || s.id;
                const name = `${s.firstName} ${s.lastName}`;
                const bg   = roleColorMap[s.role] || "#888";
                const ini  = `${s.firstName?.[0]||""}${s.lastName?.[0]||""}`.toUpperCase();
                return (
                  <div
                    key={id}
                    style={{ background: "#fff", borderRadius: 14, padding: "14px 18px", display: "flex", justifyContent: "space-between", alignItems: "center", boxShadow: "0 2px 12px rgba(0,0,0,.05)", border: "1px solid #f0f0f0" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                      <div style={{ width: 42, height: 42, borderRadius: "50%", background: bg, display: "flex", alignItems: "center", justifyContent: "center", color: s.role==="owner"?"#1a1a1a":"#fff", fontWeight: 900, fontSize: 14, flexShrink: 0 }}>
                        {ini}
                      </div>
                      <div>
                        <div style={{ fontWeight: 700, fontSize: 14, color: "#1a1a1a" }}>{name}</div>
                        <div style={{ fontSize: 12, color: "#aaa", marginTop: 1 }}>{s.email}</div>
                        {s.position && (
                          <div style={{ fontSize: 11, color: "#bbb", marginTop: 1 }}>{s.position} · {s.availability}</div>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
                      <span style={{
                        padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700,
                        background: s.role==="manager"?"#e0f2fe": s.role==="owner"?"#fef3c7":"#ede9fe",
                        color:      s.role==="manager"?"#0891b2": s.role==="owner"?"#92400e":"#4f46e5",
                      }}>
                        {s.role}
                      </span>
                      {isOwner && s.role !== "owner" && (
                        <button
                          onClick={() => handleDelete(id, name)}
                          title="Remove staff"
                          style={{ background: "none", border: "1px solid #fee2e2", color: "#dc2626", cursor: "pointer", fontSize: 13, padding: "4px 10px", borderRadius: 8, fontWeight: 700, fontFamily: "var(--font-body)" }}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Info box */}
          <div style={{ marginTop: 16, background: "#f0f7ff", borderRadius: 12, padding: "12px 16px", fontSize: 13, color: "#3b82f6", border: "1px solid #bfdbfe" }}>
            💡 Staff log in at the <strong>Login page</strong> using their email and temporary password.
            They can change their password in their <strong>Profile</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}