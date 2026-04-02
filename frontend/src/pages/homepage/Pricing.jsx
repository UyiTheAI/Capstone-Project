import React, { useState } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const FEATURES = [
  "Schedule management",
  "Shift swap requests & approvals",
  "Staff reports & analytics",
  "Employee overview & performance",
  "Tip manager (owner only)",
  "Google & Apple login",
  "Notifications inbox",
  "CSV export",
  "9 language support",
  "Unlimited employees",
];

export default function Pricing({ onGetStarted }) {
  const { user }              = useAuth();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const handleSubscribe = async () => {
    if (!user) { onGetStarted?.(); return; }
    if (user.role === "employee") {
      setError("Only managers and owners can subscribe. Ask your manager to set up billing.");
      return;
    }
    setLoading(true);
    setError("");
    try {
      const res = await api.post("/subscription/checkout");
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ fontFamily:"var(--font-body)", padding:"72px 40px", background:"#f9f9f7", minHeight:"100vh" }}>

      {/* Header */}
      <div style={{ textAlign:"center", marginBottom:56 }}>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:56, color:"#1a1a1a", lineHeight:1, marginBottom:12 }}>
          Simple Pricing
        </h1>
        <p style={{ fontSize:18, color:"#888", maxWidth:500, margin:"0 auto" }}>
          One flat monthly fee. All features included. Cancel anytime.
        </p>
      </div>

      {error && (
        <div style={{ maxWidth:480, margin:"0 auto 32px", padding:"14px 20px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:14, textAlign:"center" }}>
          {error}
        </div>
      )}

      {/* Single plan card */}
      <div style={{ maxWidth:480, margin:"0 auto" }}>
        <div style={{
          background:"#1a1a1a", borderRadius:24, padding:"48px 40px",
          boxShadow:"0 16px 60px rgba(0,0,0,.2)", position:"relative", overflow:"hidden",
        }}>
          {/* Gold accent bar */}
          <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"#f5b800" }} />

          {/* Badge */}
          <div style={{
            display:"inline-block", background:"#f5b800", color:"#1a1a1a",
            fontWeight:800, fontSize:11, padding:"4px 14px", borderRadius:20,
            letterSpacing:1, textTransform:"uppercase", marginBottom:24,
          }}>
            Everything Included
          </div>

          {/* Plan name */}
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:42, color:"#fff", margin:"0 0 8px" }}>
            SHIFT-UP Pro
          </h2>
          <p style={{ color:"#888", fontSize:15, marginBottom:32 }}>
            Full access to every feature for your entire team.
          </p>

          {/* Price */}
          <div style={{ display:"flex", alignItems:"flex-end", gap:8, marginBottom:40 }}>
            <span style={{ fontFamily:"var(--font-head)", fontSize:72, color:"#f5b800", lineHeight:1 }}>$5</span>
            <div style={{ paddingBottom:10 }}>
              <div style={{ color:"#888", fontSize:14 }}>CAD</div>
              <div style={{ color:"#666", fontSize:13 }}>per month</div>
            </div>
          </div>

          {/* Features */}
          <ul style={{ listStyle:"none", padding:0, margin:"0 0 40px", display:"flex", flexDirection:"column", gap:12 }}>
            {FEATURES.map((f) => (
              <li key={f} style={{ display:"flex", alignItems:"center", gap:12, fontSize:15, color:"#ccc" }}>
                <span style={{ color:"#f5b800", fontWeight:800, fontSize:16, flexShrink:0 }}>✓</span>
                {f}
              </li>
            ))}
          </ul>

          {/* CTA */}
          <button
            onClick={handleSubscribe}
            disabled={loading}
            style={{
              width:"100%", padding:"16px 0",
              background:"#f5b800", color:"#1a1a1a",
              border:"none", borderRadius:12,
              fontFamily:"var(--font-body)", fontWeight:800, fontSize:16,
              cursor:"pointer", transition:"opacity .15s",
              opacity: loading ? .7 : 1,
            }}
            onMouseOver={e => { if (!loading) e.currentTarget.style.opacity = ".85"; }}
            onMouseOut={e => e.currentTarget.style.opacity = loading ? ".7" : "1"}
          >
            {loading ? "Redirecting to checkout…" : user ? "Subscribe Now — $5 CAD/mo" : "Get Started Free"}
          </button>

          <div style={{ textAlign:"center", marginTop:16, fontSize:12, color:"#555" }}>
            🔒 Secured by Stripe · Cancel anytime · No hidden fees
          </div>
        </div>

        {/* Free tier note */}
        <div style={{ textAlign:"center", marginTop:32, padding:"20px 24px", background:"#fff", borderRadius:16, border:"1px solid #f0f0f0" }}>
          <div style={{ fontWeight:700, fontSize:15, color:"#1a1a1a", marginBottom:6 }}>
            Also available for free
          </div>
          <div style={{ fontSize:13, color:"#888" }}>
            Basic schedule viewing and notifications — no subscription needed for employees.
          </div>
        </div>
      </div>
    </div>
  );
}