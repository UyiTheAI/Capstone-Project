import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

export default function Register({onLoginClick }) {
  const { t } = useLanguage();
  const { register } = useAuth();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", password: "", role: "employee", position: "", availability: "Full-Time" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.email || !form.password || !form.role) {
      setError("Please fill all required fields.");
      return;
    }
    if (form.password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      <div style={{ flex: 1, background: "#1a1a1a", display: "flex", flexDirection: "column", justifyContent: "center", padding: 56 }}>
        <div className="su-brand" style={{ color: "#f5b800", marginBottom: 20 }}>
          <div className="su-logobox">UP</div>
          SHIFT-UP
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#f5b800", lineHeight: 1 }}>
          JOIN THE TEAM
        </h1>
        <p style={{ color: "#999", marginTop: 14, fontSize: 15, lineHeight: 1.7 }}>
          Create your account to start managing shifts smarter. Fill in your details to get started.
        </p>
      </div>
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f7" }}>
        <div style={{ width: "100%", maxWidth: 420, padding: 36 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, marginBottom: 4 }}>Get Started Now</h2>
          <p className="text-sm text-muted mb-4">Enter your details to create an account</p>

          {error && <div className="su-alert-err">{error}</div>}

          <div className="flex gap-2 mb-3">
            <div style={{ flex: 1 }}>
              <label className="su-label">First Name *</label>
              <input className="su-input" type="text" placeholder="First" value={form.firstName} onChange={(e) => setForm({ ...form, firstName: e.target.value })} />
            </div>
            <div style={{ flex: 1 }}>
              <label className="su-label">Last Name</label>
              <input className="su-input" type="text" placeholder="Last" value={form.lastName} onChange={(e) => setForm({ ...form, lastName: e.target.value })} />
            </div>
          </div>
          <div className="su-form-row">
            <label className="su-label">Email *</label>
            <input className="su-input" type="email" placeholder="your@email.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          </div>
          <div className="su-form-row">
            <label className="su-label">Password * (min 6 chars)</label>
            <input className="su-input" type="password" placeholder="••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
          </div>
          <div className="flex gap-2 mb-3">
            <div style={{ flex: 1 }}>
              <label className="su-label">Role *</label>
              <select className="su-input" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                <option value="employee">Employee</option>
                <option value="manager">Manager</option>
                <option value="owner">Owner</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="su-label">Availability</label>
              <select className="su-input" value={form.availability} onChange={(e) => setForm({ ...form, availability: e.target.value })}>
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="On-Call">On-Call</option>
              </select>
            </div>
          </div>
          <div className="su-form-row">
            <label className="su-label">Position / Role Title</label>
            <input className="su-input" type="text" placeholder="e.g. Waitstaff, Bartender" value={form.position} onChange={(e) => setForm({ ...form, position: e.target.value })} />
          </div>

          <div className="flex items-center gap-2 mb-3">
            <input type="checkbox" id="terms" required style={{ accentColor: "#f5b800" }} />
            <label htmlFor="terms" className="text-sm text-muted">I agree to the Terms & Policy</label>
          </div>

          <button className="su-btn su-btn-black w-full" onClick={handleSubmit} disabled={loading}>
            {loading ? <span className="spinner" /> : t("registerTitle")}
          </button>

          <p className="text-sm text-center mt-3">
            Already have an account?{" "}
            <span style={{ color: "#f5b800", cursor: "pointer", fontWeight: 600 }} onClick={onLoginClick}>
              Sign In
            </span>
          </p>
        </div>
      </div>
    </div>
  );
}