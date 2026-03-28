import React, { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const Login = ({ onRegisterClick, onHomeClick }) => {
  const { login } = useAuth();
  const [portal, setPortal] = useState("employee");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const demos = {
    employee: { email: "maria@shiftup.com", password: "password123" },
    manager:  { email: "manager@shiftup.com", password: "password123" },
    owner:    { email: "owner@shiftup.com", password: "password123" },
  };

  const switchPortal = (p) => {
    setPortal(p);
    setEmail(demos[p].email);
    setPassword(demos[p].password);
    setError("");
  };

  const handleLogin = async () => {
    if (!email || !password) { setError("Please enter email and password"); return; }
    setLoading(true);
    setError("");
    try {
      await login(email, password);
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex" }}>
      {/* LEFT PANEL */}
      <div style={{ flex: 1, background: "#1a1a1a", display: "flex", flexDirection: "column", justifyContent: "center", padding: 56 }}>
        <div className="su-brand" style={{ color: "#f5b800", marginBottom: 20 }} onClick={onHomeClick}>
          <div className="su-logobox">UP</div>
          SHIFT-UP
        </div>
        <h1 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 52, color: "#f5b800", lineHeight: 1 }}>
          WELCOME BACK
        </h1>
        <p style={{ color: "#999", marginTop: 14, fontSize: 15, lineHeight: 1.7 }}>
          The modern workforce management platform. Schedule smarter, swap easier, manage better.
        </p>
        <div style={{ marginTop: 32, background: "#222", borderRadius: 12, padding: 18 }}>
          <div className="text-xs text-muted mb-2" style={{ color: "#666" }}>DEMO ACCOUNTS (auto-fills on tab click)</div>
          {Object.entries(demos).map(([role, c]) => (
            <div key={role} style={{ fontSize: 12, color: "#777", marginBottom: 4 }}>
              <span style={{ color: "#555", textTransform: "capitalize" }}>{role}:</span>{" "}
              <span style={{ color: "#f5b800" }}>{c.email}</span>
              <span style={{ color: "#555" }}> / {c.password}</span>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "#f9f9f7" }}>
        <div style={{ width: "100%", maxWidth: 400, padding: 36 }}>
          <h2 style={{ fontFamily: "'Bebas Neue', sans-serif", fontSize: 34, marginBottom: 4 }}>Welcome Back!</h2>
          <p className="text-sm text-muted mb-4">Enter your credentials to access your account</p>

          {/* PORTAL TABS */}
          <div style={{ display: "flex", gap: 4, marginBottom: 22, background: "#efefec", borderRadius: 10, padding: 4 }}>
            {["employee", "manager", "owner"].map((p) => (
              <button
                key={p}
                onClick={() => switchPortal(p)}
                style={{
                  flex: 1, padding: "7px 0", border: "none", borderRadius: 7,
                  fontFamily: "'DM Sans', sans-serif", fontSize: 12, fontWeight: 600, cursor: "pointer",
                  background: portal === p ? "#fff" : "transparent",
                  boxShadow: portal === p ? "0 1px 4px rgba(0,0,0,.1)" : "none",
                  transition: "all .2s",
                }}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>

          {error && <div className="su-alert-err">{error}</div>}

          <div className="su-form-row">
            <label className="su-label">Email Address</label>
            <input className="su-input" type="email" placeholder="Enter your email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div className="su-form-row">
            <label className="su-label">Password</label>
            <input className="su-input" type="password" placeholder="Enter your password" value={password} onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()} />
          </div>

          <button className="su-btn su-btn-black w-full" onClick={handleLogin} disabled={loading}>
            {loading ? <span className="spinner" /> : "Login"}
          </button>

          <div style={{ textAlign: "center", color: "#ccc", fontSize: 12, margin: "14px 0" }}>or</div>

          <div className="flex gap-2">
            <button style={{ flex: 1, padding: 9, border: "1.5px solid #e0e0e0", borderRadius: 10, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              🌐 Google
            </button>
            <button style={{ flex: 1, padding: 9, border: "1.5px solid #e0e0e0", borderRadius: 10, background: "#fff", fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" }}>
              🍎 Apple
            </button>
          </div>

          <p className="text-sm text-center mt-3">
            Don't have an account?{" "}
            <span style={{ color: "#f5b800", cursor: "pointer", fontWeight: 600 }} onClick={onRegisterClick}>
              Register
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;