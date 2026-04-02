import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function SubscriptionPage() {
  const { user }                   = useAuth();
  const [status,  setStatus]       = useState(null);
  const [loading, setLoading]      = useState(true);
  const [action,  setAction]       = useState(false);
  const [message, setMessage]      = useState("");
  const [error,   setError]        = useState("");

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get("/subscription/status");
      setStatus(res.data);
    } catch { setError("Failed to load subscription status."); }
    finally   { setLoading(false); }
  };

  const openPortal = async () => {
    setAction(true); setError(""); setMessage("");
    try {
      const res = await api.post("/subscription/portal");
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to open billing portal.");
    } finally { setAction(false); }
  };

  const subscribe = async () => {
    setAction(true); setError(""); setMessage("");
    try {
      const res = await api.post("/subscription/checkout");
      window.location.href = res.data.url;
    } catch (err) {
      setError(err.response?.data?.message || "Failed to start checkout.");
    } finally { setAction(false); }
  };

  const cancelSub = async () => {
    if (!window.confirm("Cancel your subscription? You'll keep access until the end of the billing period.")) return;
    setAction(true); setError(""); setMessage("");
    try {
      const res = await api.post("/subscription/cancel");
      setMessage(`Subscription will cancel on ${new Date(res.data.cancelDate).toLocaleDateString()}.`);
      fetchStatus();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel subscription.");
    } finally { setAction(false); }
  };

  const isActive = status?.active;
  const sub      = status?.subscription;

  if (loading) {
    return (
      <div style={{ padding:48, textAlign:"center", color:"#888", fontFamily:"var(--font-body)" }}>
        Loading subscription…
      </div>
    );
  }

  return (
    <div style={{ fontFamily:"var(--font-body)", padding:"48px 40px", maxWidth:640, margin:"0 auto" }}>
      <h1 style={{ fontFamily:"var(--font-head)", fontSize:48, marginBottom:4 }}>Subscription</h1>
      <p style={{ color:"#888", marginBottom:36 }}>Manage your SHIFT-UP plan and billing.</p>

      {message && (
        <div style={{ padding:"12px 18px", background:"#dcfce7", borderRadius:10, color:"#16a34a", marginBottom:20, fontSize:14 }}>
          ✓ {message}
        </div>
      )}
      {error && (
        <div style={{ padding:"12px 18px", background:"#fee2e2", borderRadius:10, color:"#dc2626", marginBottom:20, fontSize:14 }}>
          {error}
        </div>
      )}

      {/* Status card */}
      <div style={{
        background:"#1a1a1a", borderRadius:20, padding:"36px 32px", marginBottom:24,
        border: isActive ? "2px solid #f5b800" : "2px solid #333",
        position:"relative", overflow:"hidden",
      }}>
        {isActive && <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background:"#f5b800" }} />}

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>
              Current Plan
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:32, color: isActive ? "#f5b800" : "#666" }}>
              {isActive ? "SHIFT-UP Pro" : "Free"}
            </div>
            <div style={{ fontSize:13, color:"#666", marginTop:4 }}>
              {isActive ? "$5 CAD / month · All features included" : "Basic access only"}
            </div>
          </div>

          {/* Badge */}
          <div style={{
            padding:"6px 16px", borderRadius:20, fontWeight:800, fontSize:12,
            background: isActive
              ? sub?.cancelAtEnd ? "#fef3c7" : "#dcfce7"
              : "#f0f0f0",
            color: isActive
              ? sub?.cancelAtEnd ? "#92400e" : "#16a34a"
              : "#888",
          }}>
            {isActive ? (sub?.cancelAtEnd ? "⚠ Cancelling" : "✓ Active") : "Free"}
          </div>
        </div>

        {/* Renewal / cancel info */}
        {isActive && sub && (
          <div style={{ marginTop:20, padding:"12px 16px", background:"#222", borderRadius:10, fontSize:13, color:"#888" }}>
            {sub.cancelAtEnd
              ? `⚠️  Access ends ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
              : `🔄 Renews ${new Date(sub.currentPeriodEnd).toLocaleDateString()}`
            }
          </div>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ display:"flex", gap:12, flexWrap:"wrap" }}>
        {isActive ? (
          <>
            <button onClick={openPortal} disabled={action} style={{
              padding:"12px 24px", background:"#f5b800", color:"#1a1a1a",
              border:"none", borderRadius:10, fontWeight:800, fontSize:14,
              cursor:"pointer", fontFamily:"var(--font-body)",
            }}>
              {action ? "Loading…" : "🔧 Manage Billing"}
            </button>
            {!sub?.cancelAtEnd && (
              <button onClick={cancelSub} disabled={action} style={{
                padding:"12px 24px", background:"#fff", color:"#dc2626",
                border:"2px solid #dc2626", borderRadius:10, fontWeight:700, fontSize:14,
                cursor:"pointer", fontFamily:"var(--font-body)",
              }}>
                Cancel Subscription
              </button>
            )}
          </>
        ) : (
          <button onClick={subscribe} disabled={action} style={{
            padding:"14px 32px", background:"#f5b800", color:"#1a1a1a",
            border:"none", borderRadius:10, fontWeight:800, fontSize:15,
            cursor:"pointer", fontFamily:"var(--font-body)",
          }}>
            {action ? "Redirecting…" : "⚡ Subscribe — $5 CAD/mo"}
          </button>
        )}
      </div>

      {/* Features list */}
      <div style={{ marginTop:48 }}>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:28, marginBottom:20 }}>What's included</h2>
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
          {[
            "Schedule management",
            "Shift swap requests",
            "Staff reports",
            "Employee overview",
            "Tip manager",
            "Google / Apple login",
            "Notifications",
            "CSV export",
            "9 languages",
            "Unlimited employees",
          ].map((f) => (
            <div key={f} style={{
              display:"flex", alignItems:"center", gap:10,
              padding:"12px 16px", background:"#fff", borderRadius:10,
              border:"1px solid #f0f0f0", fontSize:14, color:"#555",
            }}>
              <span style={{ color:"#f5b800", fontWeight:800 }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}