import React, { useState, useEffect } from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

export default function SubscriptionPage() {
  const { user }               = useAuth();
  const [status,  setStatus]   = useState(null);
  const [loading, setLoading]  = useState(true);
  const [action,  setAction]   = useState(false);
  const [message, setMessage]  = useState("");
  const [error,   setError]    = useState("");
  const [copied,  setCopied]   = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  useEffect(() => { fetchStatus(); }, []);

  const fetchStatus = async () => {
    setLoading(true);
    try { const res = await api.get("/subscription/status"); setStatus(res.data); }
    catch { setError("Failed to load subscription."); }
    finally { setLoading(false); }
  };

  const subscribe = async () => {
    setAction(true); setError(""); setMessage("");
    try { const res = await api.post("/subscription/checkout"); window.location.href = res.data.url; }
    catch (err) { setError(err.response?.data?.message || "Failed to start checkout."); }
    finally { setAction(false); }
  };

  const openPortal = async () => {
    setAction(true); setError(""); setMessage("");
    try { const res = await api.post("/subscription/portal"); window.location.href = res.data.url; }
    catch (err) { setError(err.response?.data?.message || "Failed to open billing portal."); }
    finally { setAction(false); }
  };

  const cancelSub = async () => {
    setAction(true); setError(""); setMessage(""); setShowCancelConfirm(false);
    try {
      const res = await api.post("/subscription/cancel");
      const dateStr = new Date(res.data.cancelDate).toLocaleDateString();
      setMessage(res.data.wasTrial
        ? `Trial cancelled. Access ends ${dateStr} — no charge made.`
        : `Subscription will cancel on ${dateStr}. You keep full access until then.`
      );
      fetchStatus();
    } catch (err) { setError(err.response?.data?.message || "Failed to cancel."); }
    finally { setAction(false); }
  };

  const copyCode = () => {
    navigator.clipboard.writeText(status?.orgCode || "");
    setCopied(true); setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div style={{ padding:48, textAlign:"center", color:"#888", fontFamily:"var(--font-body)" }}>Loading…</div>;

  const isActive  = status?.active;
  const isTrial   = status?.trial;
  const sub       = status?.subscription;
  const orgCode   = status?.orgCode;
  const trialEnd  = sub?.trialEnd ? new Date(sub.trialEnd) : null;
  const periodEnd = sub?.currentPeriodEnd ? new Date(sub.currentPeriodEnd) : null;

  // Days remaining in trial
  const trialDaysLeft = trialEnd ? Math.max(0, Math.ceil((trialEnd - new Date()) / (1000*60*60*24))) : 0;

  return (
    <div style={{ fontFamily:"var(--font-body)", padding:"48px 40px", maxWidth:680, margin:"0 auto" }}>
      <h1 style={{ fontFamily:"var(--font-head)", fontSize:48, marginBottom:4 }}>Subscription</h1>
      <p style={{ color:"#888", marginBottom:36 }}>Manage your SHIFT-UP plan and billing.</p>

      {message && <div style={{ padding:"14px 18px", background:"#dcfce7", borderRadius:10, color:"#16a34a", marginBottom:20, fontSize:14 }}>✓ {message}</div>}
      {error   && <div style={{ padding:"14px 18px", background:"#fee2e2", borderRadius:10, color:"#dc2626", marginBottom:20, fontSize:14 }}>{error}</div>}

      {/* ── Plan Status ──────────────────────────────────────────────────── */}
      <div style={{ background:"#1a1a1a", borderRadius:20, padding:"36px 32px", marginBottom:24, border: isActive ? `2px solid ${isTrial ? "#f59e0b" : "#f5b800"}` : "2px solid #333", position:"relative", overflow:"hidden" }}>
        <div style={{ position:"absolute", top:0, left:0, right:0, height:4, background: isTrial ? "linear-gradient(90deg,#f59e0b,#fbbf24)" : "#f5b800", display: isActive ? "block" : "none" }} />

        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", flexWrap:"wrap", gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:"#555", textTransform:"uppercase", letterSpacing:1, marginBottom:8 }}>Current Plan</div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:32, color: isActive ? (isTrial ? "#fbbf24" : "#f5b800") : "#666" }}>
              {isActive ? (isTrial ? "Free Trial" : "SHIFT-UP Pro") : "Free"}
            </div>
            <div style={{ fontSize:13, color:"#666", marginTop:4 }}>
              {isActive
                ? isTrial ? `Trial ends in ${trialDaysLeft} day${trialDaysLeft !== 1 ? "s" : ""} → then $5 CAD/month`
                : "$5 CAD / month · All features included"
                : "Basic access only"}
            </div>
          </div>
          <div style={{ padding:"6px 16px", borderRadius:20, fontWeight:800, fontSize:12,
            background: isTrial ? "#fef3c7" : isActive ? (sub?.cancelAtEnd ? "#fef3c7" : "#dcfce7") : "#333",
            color:      isTrial ? "#92400e" : isActive ? (sub?.cancelAtEnd ? "#92400e" : "#16a34a") : "#888",
          }}>
            {isTrial ? `🎁 Trial — ${trialDaysLeft}d left` : isActive ? (sub?.cancelAtEnd ? "⚠ Cancelling" : "✓ Active") : "Free"}
          </div>
        </div>

        {/* Trial progress bar */}
        {isTrial && trialEnd && (
          <div style={{ marginTop:20 }}>
            <div style={{ display:"flex", justifyContent:"space-between", fontSize:12, color:"#666", marginBottom:6 }}>
              <span>Trial started</span>
              <span>{trialDaysLeft} days remaining</span>
              <span>Billing starts {trialEnd.toLocaleDateString()}</span>
            </div>
            <div style={{ background:"#333", borderRadius:99, height:8, overflow:"hidden" }}>
              <div style={{ height:"100%", borderRadius:99, background:"linear-gradient(90deg,#f59e0b,#fbbf24)", width: `${Math.round((1 - trialDaysLeft/7) * 100)}%`, transition:"width .3s" }} />
            </div>
          </div>
        )}

        {isActive && !isTrial && sub && (
          <div style={{ marginTop:20, padding:"12px 16px", background:"#222", borderRadius:10, fontSize:13, color:"#888" }}>
            {sub.cancelAtEnd
              ? `⚠️  Access ends ${periodEnd?.toLocaleDateString()} — org code deactivates after this`
              : `🔄 Next billing: ${periodEnd?.toLocaleDateString()}`}
          </div>
        )}
      </div>

      {/* ── Org Code ─────────────────────────────────────────────────────── */}
      {isActive && orgCode && (
        <div style={{ background:"#fff", border:"2px solid #f5b800", borderRadius:16, padding:"24px 28px", marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>🔑 Organisation Code</div>
          <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:12 }}>
            <div style={{ fontFamily:"monospace", fontSize:44, fontWeight:900, color:"#f5b800", letterSpacing:10 }}>{orgCode}</div>
            <button onClick={copyCode} style={{ padding:"10px 20px", background: copied ? "#dcfce7" : "#f5b800", border:"none", borderRadius:10, fontWeight:800, fontSize:13, cursor:"pointer", color: copied ? "#16a34a" : "#1a1a1a", transition:"all .2s" }}>
              {copied ? "✓ Copied!" : "📋 Copy"}
            </button>
          </div>
          <div style={{ fontSize:13, color:"#888" }}>Share with your staff — they enter it when registering.</div>
        </div>
      )}

      {/* ── Billing ──────────────────────────────────────────────────────── */}
      {isActive && !isTrial && (
        <div style={{ background:"#fff", border:"1px solid #f0f0f0", borderRadius:16, padding:"24px 28px", marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1, marginBottom:16 }}>Billing</div>
          <button onClick={openPortal} disabled={action} style={{ padding:"12px 24px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"var(--font-body)" }}>
            {action ? "Loading…" : "🔧 Manage Billing & Invoices"}
          </button>
          <div style={{ fontSize:12, color:"#aaa", marginTop:8 }}>Update payment method, download invoices.</div>
        </div>
      )}

      {/* ── Cancel Section (Trial or Active) ─────────────────────────────── */}
      {isActive && !sub?.cancelAtEnd && (
        <div style={{ background:"#fff", border:"2px solid #fee2e2", borderRadius:16, padding:"24px 28px", marginBottom:24 }}>
          <div style={{ fontSize:12, fontWeight:700, color:"#dc2626", textTransform:"uppercase", letterSpacing:1, marginBottom:12 }}>
            {isTrial ? "⚠️ Cancel Free Trial" : "⚠️ Cancel Subscription"}
          </div>

          {isTrial ? (
            <p style={{ fontSize:14, color:"#555", marginBottom:20, lineHeight:1.6 }}>
              Cancel your trial now and <strong>pay nothing</strong>. Your access will end on{" "}
              <strong>{trialEnd?.toLocaleDateString()}</strong>. No charges will be made to your card.
            </p>
          ) : (
            <p style={{ fontSize:14, color:"#555", marginBottom:20, lineHeight:1.6 }}>
              Cancelling stops your subscription at the end of the billing period.
              You keep <strong>full access</strong> until{" "}
              <strong>{periodEnd?.toLocaleDateString()}</strong>.
              After that your org code will be deactivated.
            </p>
          )}

          {!showCancelConfirm ? (
            <button onClick={() => setShowCancelConfirm(true)} style={{
              padding:"12px 24px", background:"#fff", color:"#dc2626",
              border:"2px solid #dc2626", borderRadius:10, fontWeight:700, fontSize:14,
              cursor:"pointer", fontFamily:"var(--font-body)", transition:"all .2s",
            }} onMouseOver={e=>e.currentTarget.style.background="#fee2e2"} onMouseOut={e=>e.currentTarget.style.background="#fff"}>
              {isTrial ? "Cancel Free Trial" : "Cancel Subscription"}
            </button>
          ) : (
            <div style={{ background:"#fee2e2", borderRadius:12, padding:"20px 24px" }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#dc2626", marginBottom:8 }}>Are you sure?</div>
              <div style={{ fontSize:13, color:"#555", marginBottom:16 }}>
                {isTrial
                  ? "Your trial will end immediately. No charge will be made."
                  : `Access ends ${periodEnd?.toLocaleDateString()}. This cannot be undone.`}
              </div>
              <div style={{ display:"flex", gap:10 }}>
                <button onClick={cancelSub} disabled={action} style={{ padding:"10px 22px", background:"#dc2626", color:"#fff", border:"none", borderRadius:8, fontWeight:800, fontSize:14, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                  {action ? "Cancelling…" : isTrial ? "Yes, Cancel Trial" : "Yes, Cancel Subscription"}
                </button>
                <button onClick={() => setShowCancelConfirm(false)} style={{ padding:"10px 22px", background:"#fff", color:"#555", border:"1px solid #ddd", borderRadius:8, fontWeight:600, fontSize:14, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                  Keep {isTrial ? "Trial" : "Subscription"}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Already cancelled */}
      {isActive && sub?.cancelAtEnd && (
        <div style={{ background:"#fef3c7", border:"2px solid #f59e0b", borderRadius:16, padding:"24px 28px", marginBottom:24 }}>
          <div style={{ fontWeight:800, fontSize:15, color:"#92400e", marginBottom:8 }}>
            {isTrial ? "🎁 Trial Cancelled" : "⚠️ Subscription Cancelled"}
          </div>
          <p style={{ fontSize:14, color:"#78350f", margin:0 }}>
            {isTrial
              ? `Your trial ends ${trialEnd?.toLocaleDateString()}. No charges will be made.`
              : `Full access until ${periodEnd?.toLocaleDateString()}. Org code deactivates after.`}
          </p>
        </div>
      )}

      {/* Subscribe CTA for free users */}
      {!isActive && (
        <div style={{ background:"#1a1a1a", borderRadius:16, padding:"32px 28px", textAlign:"center" }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:32, color:"#f5b800", marginBottom:4 }}>Start Free Trial</div>
          <div style={{ color:"#888", fontSize:14, marginBottom:8 }}>7 days free, then $5 CAD/month</div>
          <div style={{ color:"#666", fontSize:13, marginBottom:24 }}>Cancel anytime before trial ends — no charge</div>
          <button onClick={subscribe} disabled={action} style={{ padding:"14px 32px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"var(--font-body)" }}>
            {action ? "Redirecting…" : "🎁 Start 7-Day Free Trial"}
          </button>
        </div>
      )}
    </div>
  );
}