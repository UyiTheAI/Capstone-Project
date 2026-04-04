import React from "react";
import api from "../../api";

const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";

/**
 * PaymentPage — Complete payment FIRST, THEN register owner in DB.
 * Uses public endpoints that don't require authentication.
 */
export default function PaymentPage({ onBack, onGoToLogin }) {
  const [stripe,       setStripe]       = React.useState(null);
  const [clientSecret, setClientSecret] = React.useState("");
  const [customerId,   setCustomerId]   = React.useState("");
  const [step,         setStep]         = React.useState("loading");
  const [error,        setError]        = React.useState("");
  const [userEmail,    setUserEmail]    = React.useState("");
  const elementsRef = React.useRef(null);
  const mounted     = React.useRef(false);

  const getPendingOwner = () => {
    try { return JSON.parse(localStorage.getItem("shiftup_pending_owner") || "null"); }
    catch { return null; }
  };

  React.useEffect(() => {
    const p = getPendingOwner();
    if (p?.email) setUserEmail(p.email);
  }, []);

  // 1. Load Stripe.js once
  React.useEffect(() => {
    if (!PUBLISHABLE_KEY) { setError("REACT_APP_STRIPE_PUBLISHABLE_KEY not set in .env"); setStep("error"); return; }
    if (window.Stripe)    { setStripe(window.Stripe(PUBLISHABLE_KEY)); return; }
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existing && window.Stripe) { setStripe(window.Stripe(PUBLISHABLE_KEY)); return; }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/"; s.async = true;
    s.onload  = () => setStripe(window.Stripe(PUBLISHABLE_KEY));
    s.onerror = () => { setError("Failed to load Stripe."); setStep("error"); };
    document.head.appendChild(s);
  }, []);

  // 2. Create Stripe intent using public endpoint (no auth needed)
  React.useEffect(() => {
    if (!stripe) return;
    const pending = getPendingOwner();
    if (!pending?.email) {
      setError("No account info found. Please go back and fill in your details.");
      setStep("error");
      return;
    }
    api.post("/subscription/create-intent-public", {
      email:     pending.email,
      firstName: pending.firstName,
      lastName:  pending.lastName,
    })
      .then(res => {
        if (res.data.clientSecret) {
          setClientSecret(res.data.clientSecret);
          setCustomerId(res.data.customerId || "");
        } else {
          setError("Failed to initialize payment. Please try again.");
          setStep("error");
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || "Failed to initialize payment.");
        setStep("error");
      });
  }, [stripe]);

  // 3. Mount Stripe Elements
  React.useEffect(() => {
    if (!stripe || !clientSecret || mounted.current) return;
    const container = document.getElementById("stripe-payment-element");
    if (!container) return;
    mounted.current = true;
    try {
      const el = stripe.elements({
        clientSecret,
        appearance: { theme:"stripe", variables:{ colorPrimary:"#f5b800", borderRadius:"10px" } },
      });
      elementsRef.current = el;
      const pe = el.create("payment", { layout:{ type:"tabs", defaultCollapsed:false } });
      pe.mount("#stripe-payment-element");
      pe.on("ready",  () => { setStep("ready"); setError(""); });
      pe.on("change", (e) => { if (e.error) setError(e.error.message); else setError(""); });
    } catch (err) { setError("Payment form error: " + err.message); setStep("error"); }
  }, [stripe, clientSecret]);

  // 4. Confirm payment → register owner in DB
  const handlePay = async () => {
    if (!stripe || !elementsRef.current || step !== "ready") return;
    setStep("processing"); setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements:      elementsRef.current,
      confirmParams: { return_url: window.location.origin },
      redirect:      "if_required",
    });

    if (stripeError) { setError(stripeError.message); setStep("ready"); return; }

    // ✅ Payment confirmed — NOW register owner in DB
    const pending = getPendingOwner();
    try {
      await api.post("/subscription/register-and-activate", {
        firstName:  pending.firstName,
        lastName:   pending.lastName,
        email:      pending.email,
        password:   pending.password,
        customerId,
      });
      // Clear pending data
      localStorage.removeItem("shiftup_pending_owner");
      localStorage.removeItem("shiftup_token");
      localStorage.removeItem("shiftup_user");
      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Account creation failed. Please contact support.");
      setStep("ready");
    }
  };

  // ── SUCCESS ────────────────────────────────────────────────────────────────
  if (step === "success") return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, marginBottom:8 }}>Account Created!</h2>
        <p style={{ color:"#555", marginBottom:20, lineHeight:1.7 }}>
          Payment successful! Your account has been created and your 7-day free trial has started.
          {userEmail && <><br/>A confirmation has been sent to <strong>{userEmail}</strong>.</>}
        </p>
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12, padding:"14px 18px", marginBottom:24, fontSize:14, color:"#166534" }}>
          ✅ Log in using the email and password you just entered.
        </div>
        <button onClick={() => onGoToLogin?.()} style={{ width:"100%", padding:14, background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:"var(--font-body)" }}>
          Go to Login →
        </button>
      </div>
    </div>
  );

  // ── PAYMENT FORM ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:"100%", maxWidth:520 }}>

        {/* Steps */}
        <div style={{ display:"flex", alignItems:"center", gap:6, marginBottom:24, maxWidth:320, margin:"0 auto 24px" }}>
          {[
            { n:"1", label:"Your Info", done:true },
            { n:"2", label:"Payment",   active:true },
            { n:"3", label:"Done!",     active:false },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{ width:28, height:28, borderRadius:"50%", background: s.done ? "#16a34a" : s.active ? "#f5b800" : "#e5e5e5", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13, color: s.done || s.active ? "#1a1a1a" : "#aaa" }}>
                  {s.done ? "✓" : s.n}
                </div>
                <span style={{ fontSize:12, fontWeight: s.active ? 700 : 400, color: s.active ? "#1a1a1a" : "#aaa" }}>{s.label}</span>
              </div>
              {i < 2 && <div style={{ flex:1, height:1, background:"#e5e5e5" }} />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ textAlign:"center", marginBottom:20 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:18, color:"#f5b800", letterSpacing:2, marginBottom:4 }}>SHIFT-UP</div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:40, color:"#1a1a1a", margin:0 }}>Complete Payment</h1>
          <p style={{ color:"#888", marginTop:6 }}>7 days free · Then $5 CAD/month · Cancel anytime</p>
        </div>

        <div style={{ background:"#fff", borderRadius:20, padding:"32px 28px", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

          {/* Trial badge */}
          <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#166534" }}>🎁 7-Day Free Trial</div>
              <div style={{ fontSize:12, color:"#166534", opacity:.8 }}>
                No charge until {new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:32, color:"#16a34a" }}>FREE</div>
          </div>

          {/* Account info */}
          {userEmail && (
            <div style={{ background:"#f9f9f7", borderRadius:10, padding:"10px 14px", marginBottom:16, fontSize:13, color:"#888" }}>
              Creating account for: <strong style={{ color:"#1a1a1a" }}>{userEmail}</strong>
            </div>
          )}

          {/* Card form */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#555", marginBottom:10 }}>🔒 Enter Card Details</div>

            {step === "loading" && (
              <div style={{ height:100, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", borderRadius:12, border:"1px dashed #ddd" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:28, height:28, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 8px" }} />
                  <div style={{ fontSize:13, color:"#aaa" }}>Setting up secure payment…</div>
                </div>
              </div>
            )}

            {step === "error" && (
              <div style={{ padding:"14px 16px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:13 }}>
                ⚠️ {error}
                <div style={{ marginTop:8 }}>
                  <button onClick={onBack} style={{ background:"none", border:"none", color:"#dc2626", cursor:"pointer", textDecoration:"underline", fontSize:12, padding:0 }}>
                    ← Go back and try again
                  </button>
                </div>
              </div>
            )}

            <div id="stripe-payment-element" style={{
              display:    step === "error" ? "none" : "block",
              visibility: step === "loading" ? "hidden" : "visible",
              height:     step === "loading" ? 0 : "auto",
            }} />
          </div>

          {error && step === "ready" && (
            <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:12 }}>⚠️ {error}</div>
          )}

          {/* Price summary */}
          <div style={{ background:"#f9f9f7", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13, borderBottom:"1px solid #eee" }}>
              <span style={{ color:"#888" }}>Today (7-day trial)</span>
              <span style={{ fontWeight:800, color:"#16a34a" }}>$0.00</span>
            </div>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13 }}>
              <span style={{ color:"#888" }}>After trial (monthly)</span>
              <span style={{ fontWeight:800 }}>$5.00 CAD</span>
            </div>
          </div>

          <button onClick={handlePay} disabled={step !== "ready"} style={{
            width:"100%", padding:"16px 0",
            background: step !== "ready" ? "#e5e5e5" : "#f5b800",
            color:       step !== "ready" ? "#999" : "#1a1a1a",
            border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:16,
            cursor: step !== "ready" ? "not-allowed" : "pointer", marginBottom:12,
          }}>
            {step === "processing" ? "⏳ Creating your account…"
             : step === "loading"  ? "⏳ Setting up…"
             : step === "error"    ? "⚠️ Fix error above"
             : "🚀 Complete Payment — $0 Today"}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"#aaa", marginBottom:12 }}>
            🔒 256-bit SSL · PCI-DSS compliant · Powered by Stripe
          </div>

          <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#7b5e00", marginBottom:12 }}>
            <strong>🧪 Test card:</strong> 4242 4242 4242 4242 · Expiry: 12/29 · CVC: 123
          </div>

          <button onClick={onBack} style={{ width:"100%", padding:10, background:"transparent", color:"#aaa", border:"none", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)" }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}