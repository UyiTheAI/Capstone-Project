import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

export default function Register({ onLoginClick }) {
  const { t } = useLanguage();
  const { register } = useAuth();

  const [form, setForm] = useState({
    firstName:    "",
    lastName:     "",
    email:        "",
    password:     "",
    role:         "employee",
    position:     "",
    availability: "Full-Time",
  });
  const [error,   setError]   = useState("");
  const [loading, setLoading] = useState(false);

  const update = (field) => (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async () => {
    setError("");
    if (!form.firstName || !form.email || !form.password) {
      setError(t("error"));
      return;
    }
    if (form.password.length < 6) {
      setError(t("error"));
      return;
    }
    setLoading(true);
    try {
      await register(form);
    } catch (err) {
      setError(err.response?.data?.message || t("registrationFailed"));
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = { marginBottom: 0 };

  return (
    <div style={{ minHeight: "100vh", display: "flex", fontFamily: "var(--font-body)" }}>

      {/* ── LEFT PANEL ── */}
      <div style={{
        flex: 1, background: "#1a1a1a",
        display: "flex", flexDirection: "column",
        justifyContent: "center", padding: "56px 48px",
      }}>
        <div className="su-brand" style={{ color: "#f5b800", marginBottom: 24 }}>
          <div className="su-logobox">UP</div>
          {t("appName")}
        </div>
        <h1 style={{ fontFamily: "var(--font-head)", fontSize: 54, color: "#f5b800", lineHeight: 1, marginBottom: 16 }}>
          {t("registerTitle")}
        </h1>
        <p style={{ color: "#999", fontSize: 15, lineHeight: 1.7 }}>
          {t("registerSubtitle")}
        </p>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div style={{
        flex: 1, display: "flex",
        alignItems: "center", justifyContent: "center",
        background: "#f9f9f7", padding: "40px 24px",
        overflowY: "auto",
      }}>
        <div style={{ width: "100%", maxWidth: 420 }}>

          <h2 style={{ fontFamily: "var(--font-head)", fontSize: 32, marginBottom: 4 }}>
            {t("registerTitle")}
          </h2>
          <p className="text-sm text-muted" style={{ marginBottom: 20 }}>
            {t("registerSubtitle")}
          </p>

          {error && <div className="su-alert-err" style={{ marginBottom: 16 }}>{error}</div>}

          {/* First + Last name */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label className="su-label">{t("firstName")} *</label>
              <input
                className="su-input" type="text" style={inputStyle}
                placeholder={t("firstName")}
                value={form.firstName} onChange={update("firstName")}
              />
            </div>
            <div style={{ flex: 1 }}>
              <label className="su-label">{t("lastName")}</label>
              <input
                className="su-input" type="text" style={inputStyle}
                placeholder={t("lastName")}
                value={form.lastName} onChange={update("lastName")}
              />
            </div>
          </div>

          {/* Email */}
          <div style={{ marginBottom: 14 }}>
            <label className="su-label">{t("email")} *</label>
            <input
              className="su-input" type="email" style={inputStyle}
              placeholder="your@email.com"
              value={form.email} onChange={update("email")}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: 14 }}>
            <label className="su-label">{t("password")} *</label>
            <input
              className="su-input" type="password" style={inputStyle}
              placeholder="••••••"
              value={form.password} onChange={update("password")}
            />
          </div>

          {/* Role + Availability */}
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div style={{ flex: 1 }}>
              <label className="su-label">{t("role")} *</label>
              <select className="su-input" style={inputStyle} value={form.role} onChange={update("role")}>
                <option value="employee">{t("roleEmployee")}</option>
                <option value="manager">{t("roleManager")}</option>
                <option value="owner">{t("roleOwner")}</option>
              </select>
            </div>
            <div style={{ flex: 1 }}>
              <label className="su-label">{t("availabilityLabel2")}</label>
              <select className="su-input" style={inputStyle} value={form.availability} onChange={update("availability")}>
                <option value="Full-Time">{t("fullTimeOpt")}</option>
                <option value="Part-Time">{t("partTimeOpt")}</option>
                <option value="On-Call">{t("onCallOpt")}</option>
              </select>
            </div>
          </div>

          {/* Position */}
          <div style={{ marginBottom: 20 }}>
            <label className="su-label">{t("position")}</label>
            <input
              className="su-input" type="text" style={inputStyle}
              placeholder={t("positionPlaceholder")}
              value={form.position} onChange={update("position")}
            />
          </div>

          {/* Submit */}
          <button
            className="su-btn su-btn-black w-full"
            onClick={handleSubmit}
            disabled={loading}
            style={{ width: "100%", marginBottom: 16 }}
          >
            {loading ? <span className="spinner" /> : t("register")}
          </button>

          {/* Switch to login */}
          <p className="text-sm text-center">
            {t("haveAccount")}{" "}
            <span
              onClick={onLoginClick}
              style={{ color: "#f5b800", cursor: "pointer", fontWeight: 700 }}
            >
              {t("signIn")}
            </span>
          </p>

        </div>
      </div>
    </div>
  );
}