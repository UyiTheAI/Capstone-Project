import React, { useEffect } from "react";

export function SubscriptionSuccess() {
  useEffect(() => {
    // Redirect to portal after 3 seconds
    setTimeout(() => { window.location.href = "/"; }, 3000);
  }, []);

  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f0ec", fontFamily:"var(--font-body)" }}>
      <div style={{ textAlign:"center", background:"#fff", borderRadius:20, padding:"56px 48px", boxShadow:"0 8px 40px rgba(0,0,0,.1)", maxWidth:440 }}>
        <div style={{ fontSize:64, marginBottom:20 }}>🎉</div>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:42, color:"#1a1a1a", marginBottom:12 }}>
          You're subscribed!
        </h1>
        <p style={{ color:"#888", fontSize:16, lineHeight:1.6, marginBottom:28 }}>
          Your subscription is now active. All features are unlocked. Redirecting you to the dashboard…
        </p>
        <div style={{ width:48, height:4, background:"#f5b800", borderRadius:2, margin:"0 auto" }} />
      </div>
    </div>
  );
}

export function SubscriptionCancel() {
  return (
    <div style={{ minHeight:"100vh", display:"flex", alignItems:"center", justifyContent:"center", background:"#f0f0ec", fontFamily:"var(--font-body)" }}>
      <div style={{ textAlign:"center", background:"#fff", borderRadius:20, padding:"56px 48px", boxShadow:"0 8px 40px rgba(0,0,0,.1)", maxWidth:440 }}>
        <div style={{ fontSize:64, marginBottom:20 }}>😕</div>
        <h1 style={{ fontFamily:"var(--font-head)", fontSize:42, color:"#1a1a1a", marginBottom:12 }}>
          Checkout cancelled
        </h1>
        <p style={{ color:"#888", fontSize:16, lineHeight:1.6, marginBottom:28 }}>
          No payment was taken. You can subscribe anytime from the pricing page.
        </p>
        <button
          onClick={() => window.location.href = "/pricing"}
          style={{ padding:"12px 28px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:10, fontWeight:700, fontSize:14, cursor:"pointer", fontFamily:"var(--font-body)" }}
        >
          View Plans
        </button>
      </div>
    </div>
  );
}