import React, { useState, useEffect } from "react";
import api from "../../api";

/**
 * GetStartedModal — Real-time Stripe payment embedded in the app.
 * Uses Stripe.js directly (no redirect to hosted checkout).
 *
 * Install in frontend:
 *   npm install @stripe/stripe-js @stripe/react-stripe-js
 */

const STRIPE_PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";

export default function GetStartedModal({ onClose, onAlreadyHaveAccount }) {
  const [step,        setStep]        = useState(1); // 1=info, 2=payment, 3=processing, 4=done
  const [firstName,   setFirstName]   = useState("");
  const [lastName,    setLastName]    = useState("");
  const [email,       setEmail]       = useState("");
  const [password,    setPassword]    = useState("");
  const [error,       setError]       = useState("");
  const [loading,     setLoading]     = useState(false);
  const [stripe,      setStripe]      = useState(null);
  const [elements,    setElements]    = useState(null);
  const [clientSecret, setClientSecret] = useState("");

  // Load Stripe.js dynamically
  useEffect(() => {
    if (!STRIPE_PUBLISHABLE_KEY) return;
    const script = document.createElement("script");
    script.src = "https://js.stripe.com/v3/";
    script.onload = () => {
      const stripeInstance = window.Stripe(STRIPE_PUBLISHABLE_KEY);
      setStripe(stripeInstance);
    };
    document.head.appendChild(script);
  }, []);

  // Mount Stripe card element when on step 2
  useEffect(() => {
    if (step !== 2 || !stripe || !clientSecret) return;
    const elementsInstance = stripe.elements({ clientSecret });
    setElements(elementsInstance);
    const card = elementsInstance.create("payment", {
      layout: "tabs",
    });
    setTimeout(() => {
      const container = document.getElementById("stripe-payment-element");
      if (container && container.children.length === 0) {
        card.mount("#stripe-payment-element");
      }
    }, 100);
  }, [step, stripe, clientSecret]);

  // Step 1: register + create payment intent
  const handleContinueToPayment = async () => {
    if (!firstName || !lastName || !email || !password) { setError("All fields are required."); return; }
    if (password.length < 6) { setError("Password must be at least 6 characters."); return; }
    setLoading(true); setError("");
    try {
      // 1. Register as owner
      const regRes = await api.post("/auth/register", {
        firstName, lastName, email, password,
        role: "owner", position: "Owner", availability: "Full-Time",
      });
      localStorage.setItem("shiftup_token", regRes.data.token);
      localStorage.setItem("shiftup_user",  JSON.stringify(regRes.data.user));

      // 2. Create subscription setup intent (trial)
      const intentRes = await api.post("/subscription/create-intent");
      setClientSecret(intentRes.data.clientSecret);
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong.");
    } finally { setLoading(false); }
  };

  // Step 2: confirm payment
  const handleConfirmPayment = async () => {
    if (!stripe || !elements) return;
    setLoading(true); setError("");
    setStep(3);
    try {
      const { error: stripeError } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: `${window.location.origin}/subscription/success`,
        },
        redirect: "if_required",
      });

      if (stripeError) {
        setError(stripeError.message);
        setStep(2);
      } else {
        // Payment confirmed — activate subscription
        await api.post("/subscription/activate");
        setStep(4);
        setTimeout(() => {
          window.location.reload();
        }, 2000);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
      setStep(2);
    } finally { setLoading(false); }
  };

  const inputStyle = {
    width:"100%", padding:"11px 14px", border:"1.5px solid #e0e0e0",
    borderRadius:10, fontFamily:"var(--font-body)", fontSize:14,
    outline:"none", boxSizing:"border-box",
  };

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.75)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:500, overflow:"hidden", fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.3)", maxHeight:"95vh", overflowY:"auto" }}>

        {/* Header */}
        <div style={{ background:"linear-gradient(135deg,#f5b800,#ffdd57)", padding:"24px 32px", position:"relative" }}>
          <button onClick={onClose} style={{ position:"absolute", top:14, right:16, background:"none", border:"none", fontSize:20, cursor:"pointer", color:"rgba(0,0,0,.4)" }}>✕</button>
          <div style={{ fontSize:32, marginBottom:6 }}>
            {step === 4 ? "🎉" : step === 3 ? "⏳" : "🚀"}
          </div>
          <h2 style={{ fontFamily:"var(--font-head)", fontSize:30, color:"#1a1a1a", margin:"0 0 4px", lineHeight:1 }}>
            {step === 4 ? "You're In!" : step === 3 ? "Processing…" : step === 2 ? "Enter Payment Details" : "Start Your Free Trial"}
          </h2>
          <p style={{ fontSize:13, color:"#1a1a1a", opacity:.7, margin:0 }}>
            {step === 4 ? "Check your email for your 6-digit org code!" : "7 days free · Org code emailed · Cancel = $0"}
          </p>
        </div>

        <div style={{ padding:"28px 32px" }}>

          {/* ── Step 4: Success ── */}
          {step === 4 && (
            <div style={{ textAlign:"center", padding:"20px 0" }}>
              <div style={{ fontSize:64, marginBottom:16 }}>📧</div>
              <h3 style={{ fontFamily:"var(--font-head)", fontSize:28, color:"#1a1a1a", marginBottom:8 }}>
                Check Your Email!
              </h3>
              <p style={{ color:"#555", fontSize:15, lineHeight:1.7, marginBottom:16 }}>
                Your 6-digit org code has been sent to <strong>{email}</strong>.<br/>
                Share it with your staff when they register.
              </p>
              <div style={{ background:"#f9f9f7", borderRadius:12, padding:16, fontSize:13, color:"#888" }}>
                Redirecting to your dashboard…
              </div>
            </div>
          )}

          {/* ── Step 3: Processing ── */}
          {step === 3 && (
            <div style={{ textAlign:"center", padding:"32px 0" }}>
              <div style={{ width:48, height:48, border:"4px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 20px" }} />
              <div style={{ fontWeight:700, fontSize:16, color:"#1a1a1a", marginBottom:6 }}>Processing payment…</div>
              <div style={{ fontSize:13, color:"#888" }}>Please wait, do not close this window.</div>
            </div>
          )}

          {/* ── Step 2: Payment form ── */}
          {step === 2 && (
            <>
              {/* Trial reminder */}
              <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12, padding:"12px 16px", marginBottom:20, fontSize:13, color:"#166534" }}>
                🎁 <strong>7-day free trial</strong> — your card will not be charged until the trial ends on{" "}
                <strong>{new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toLocaleDateString()}</strong>
              </div>

              {error && (
                <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>
                  {error}
                </div>
              )}

              {/* Stripe Payment Element */}
              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:13, fontWeight:700, color:"#555", marginBottom:8, display:"block" }}>
                  Card Details
                </label>
                <div
                  id="stripe-payment-element"
                  style={{ border:"1.5px solid #e0e0e0", borderRadius:10, padding:"12px 14px", minHeight:60 }}
                />
                {!STRIPE_PUBLISHABLE_KEY && (
                  <div style={{ fontSize:12, color:"#dc2626", marginTop:6 }}>
                    ⚠️ Add REACT_APP_STRIPE_PUBLISHABLE_KEY to frontend .env
                  </div>
                )}
              </div>

              <div style={{ fontSize:12, color:"#aaa", marginBottom:16, textAlign:"center" }}>
                🔒 Secured by Stripe · PCI compliant · Card never touches our servers
              </div>

              <button
                onClick={handleConfirmPayment}
                disabled={loading || !stripe}
                style={{ width:"100%", padding:"15px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:10 }}
              >
                {loading ? "Processing…" : "🚀 Start Free Trial — $0 for 7 days"}
              </button>

              <button onClick={() => setStep(1)} style={{ width:"100%", padding:"10px", background:"transparent", color:"#aaa", border:"none", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)" }}>
                ← Back
              </button>
            </>
          )}

          {/* ── Step 1: Account info ── */}
          {step === 1 && (
            <>
              <div style={{ display:"flex", gap:10, marginBottom:20 }}>
                {[{icon:"📅",label:"7 Days Free"},{icon:"📧",label:"Code via Email"},{icon:"❌",label:"Cancel = $0"}].map(b=>(
                  <div key={b.label} style={{ flex:1, textAlign:"center", background:"#f9f9f7", borderRadius:10, padding:"12px 6px" }}>
                    <div style={{ fontSize:22 }}>{b.icon}</div>
                    <div style={{ fontSize:11, fontWeight:700, color:"#555", marginTop:4 }}>{b.label}</div>
                  </div>
                ))}
              </div>

              {error && (
                <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:16 }}>
                  {error}
                </div>
              )}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block", textTransform:"uppercase", letterSpacing:.5 }}>First Name</label>
                  <input style={inputStyle} value={firstName} onChange={e=>setFirstName(e.target.value)} placeholder="John" />
                </div>
                <div style={{ marginBottom:12 }}>
                  <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block", textTransform:"uppercase", letterSpacing:.5 }}>Last Name</label>
                  <input style={inputStyle} value={lastName} onChange={e=>setLastName(e.target.value)} placeholder="Smith" />
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block", textTransform:"uppercase", letterSpacing:.5 }}>
                  📧 Email — org code sent here
                </label>
                <input style={inputStyle} type="email" value={email} onChange={e=>setEmail(e.target.value)} placeholder="you@restaurant.com" />
              </div>

              <div style={{ marginBottom:16 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", marginBottom:6, display:"block", textTransform:"uppercase", letterSpacing:.5 }}>Password</label>
                <input style={inputStyle} type="password" value={password} onChange={e=>setPassword(e.target.value)}
                  onKeyDown={e=>e.key==="Enter"&&handleContinueToPayment()} placeholder="Min 6 characters" />
              </div>

              <button
                onClick={handleContinueToPayment}
                disabled={loading}
                style={{ width:"100%", padding:"15px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:10, opacity: loading ? .7 : 1 }}
              >
                {loading ? "Setting up account…" : "Continue to Payment →"}
              </button>

              <div style={{ fontSize:12, color:"#aaa", textAlign:"center", marginBottom:12 }}>
                Card details on next step · $5 CAD/mo after 7 days
              </div>

              <p style={{ fontSize:13, textAlign:"center", color:"#888", margin:0 }}>
                Already have an account?{" "}
                <span onClick={onAlreadyHaveAccount} style={{ color:"#f5b800", cursor:"pointer", fontWeight:700 }}>Sign in</span>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}