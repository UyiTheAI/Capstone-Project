import React from "react";
import api from "../../api";

const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";

/**
 * PaymentPage — uses SetupIntent (not PaymentIntent) to collect card details.
 * This works correctly with 7-day trials because no payment is due upfront.
 * Flow: SetupIntent → confirm card → register owner → create subscription with trial
 */
export default function PaymentPage({ onBack, onGoToLogin }) {
  const [stripe,        setStripe]        = React.useState(null);
  const [clientSecret,  setClientSecret]  = React.useState("");
  const [customerId,    setCustomerId]    = React.useState("");
  const [step,          setStep]          = React.useState("loading"); // loading | ready | processing | success | error
  const [error,         setError]         = React.useState("");
  const [userEmail,     setUserEmail]     = React.useState("");
  const elementsRef  = React.useRef(null);
  const mounted      = React.useRef(false);

  const getPending = () => {
    try { return JSON.parse(localStorage.getItem("shiftup_pending_owner") || "null"); }
    catch { return null; }
  };

  React.useEffect(() => {
    const p = getPending();
    if (p?.email) setUserEmail(p.email);
    else {
      // No pending data — send back
      setError("No account info found. Please go back and fill in your details.");
      setStep("error");
    }
  }, []);

  // ── 1. Load Stripe.js ────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!PUBLISHABLE_KEY) {
      setError("Stripe not configured. Add REACT_APP_STRIPE_PUBLISHABLE_KEY to .env");
      setStep("error");
      return;
    }
    if (window.Stripe) { setStripe(window.Stripe(PUBLISHABLE_KEY)); return; }
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existing) {
      const wait = setInterval(() => {
        if (window.Stripe) { clearInterval(wait); setStripe(window.Stripe(PUBLISHABLE_KEY)); }
      }, 100);
      return;
    }
    const s = document.createElement("script");
    s.src = "https://js.stripe.com/v3/";
    s.async = true;
    s.onload  = () => setStripe(window.Stripe(PUBLISHABLE_KEY));
    s.onerror = () => { setError("Failed to load Stripe.js. Check your internet connection."); setStep("error"); };
    document.head.appendChild(s);
  }, []);

  // ── 2. Create SetupIntent ────────────────────────────────────────────────
  React.useEffect(() => {
    if (!stripe) return;
    const pending = getPending();
    if (!pending?.email) return;

    api.post("/subscription/setup-intent", {
      email:     pending.email,
      firstName: pending.firstName,
      lastName:  pending.lastName,
    })
      .then(res => {
        if (res.data.clientSecret) {
          setClientSecret(res.data.clientSecret);
          setCustomerId(res.data.customerId || "");
        } else {
          setError("Failed to initialize payment form. Please try again.");
          setStep("error");
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || "Failed to initialize payment. Please try again.");
        setStep("error");
      });
  }, [stripe]);

  // ── 3. Mount Stripe Payment Element ─────────────────────────────────────
  React.useEffect(() => {
    if (!stripe || !clientSecret || mounted.current) return;
    const container = document.getElementById("stripe-payment-element");
    if (!container) return;
    mounted.current = true;

    try {
      const el = stripe.elements({
        clientSecret,
        appearance: {
          theme: "stripe",
          variables: {
            colorPrimary:    "#f5b800",
            colorBackground: "#ffffff",
            colorText:       "#1a1a1a",
            colorDanger:     "#dc2626",
            fontFamily:      "'DM Sans', sans-serif",
            borderRadius:    "10px",
          },
        },
      });
      elementsRef.current = el;

      const pe = el.create("payment", {
        layout: { type: "tabs", defaultCollapsed: false },
      });

      pe.mount("#stripe-payment-element");
      pe.on("ready",    ()  => { setStep("ready"); setError(""); });
      pe.on("change",   (e) => { if (e.error) setError(e.error.message); else setError(""); });
      pe.on("loaderror",(e) => { setError(e.error?.message || "Card form failed to load."); setStep("error"); });
    } catch (err) {
      setError("Payment form error: " + err.message);
      setStep("error");
    }
  }, [stripe, clientSecret]);

  // ── 4. Confirm card + register owner ─────────────────────────────────────
  const handlePay = async () => {
    if (!stripe || !elementsRef.current || step !== "ready") return;
    setStep("processing"); setError("");

    const pending = getPending();
    if (!pending) {
      setError("Session expired. Please go back and try again.");
      setStep("error");
      return;
    }

    try {
      // Confirm SetupIntent (saves card without charging)
      const { error: setupError, setupIntent } = await stripe.confirmSetup({
        elements:      elementsRef.current,
        confirmParams: { return_url: window.location.origin },
        redirect:      "if_required",
      });

      if (setupError) {
        setError(setupError.message);
        setStep("ready");
        return;
      }

      // Get the payment method that was just saved
      const paymentMethodId = setupIntent?.payment_method;

      // Register owner in DB + create subscription with trial
      await api.post("/subscription/register-and-activate", {
        firstName:       pending.firstName,
        lastName:        pending.lastName,
        email:           pending.email,
        password:        pending.password,
        customerId,
        paymentMethodId,
      });

      // Clear pending data
      localStorage.removeItem("shiftup_pending_owner");
      localStorage.removeItem("shiftup_token");
      localStorage.removeItem("shiftup_user");

      setStep("success");
    } catch (err) {
      setError(err.response?.data?.message || "Something went wrong. Please try again.");
      setStep("ready");
    }
  };

  // ── SUCCESS ───────────────────────────────────────────────────────────────
  if (step === "success") return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, marginBottom:8 }}>You're All Set!</h2>
        <p style={{ color:"#555", marginBottom:20, lineHeight:1.7 }}>
          Your account has been created and your 7-day free trial has started!
          {userEmail && <><br/>A confirmation email has been sent to <strong>{userEmail}</strong>.</>}
        </p>
        <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12, padding:"16px 20px", marginBottom:24, fontSize:14, color:"#166534", textAlign:"left" }}>
          <div style={{ fontWeight:700, marginBottom:8 }}>✅ What happens next:</div>
          <div style={{ lineHeight:2, fontSize:13 }}>
            1. Log in with your email and password<br/>
            2. Go to <strong>Register Staff</strong> tab to add your team<br/>
            3. Start scheduling shifts!<br/>
            4. Your card will be charged $5 CAD after 7 days
          </div>
        </div>
        <button onClick={() => onGoToLogin?.()} style={{ width:"100%", padding:14, background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontWeight:800, fontSize:16, cursor:"pointer", fontFamily:"var(--font-body)" }}>
          Go to Login →
        </button>
      </div>
    </div>
  );

  // ── PAYMENT FORM ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:"100%", maxWidth:540 }}>

        {/* Step indicator */}
        <div style={{ display:"flex", alignItems:"center", gap:6, maxWidth:320, margin:"0 auto 28px" }}>
          {[
            { n:"1", label:"Your Info",  done:true  },
            { n:"2", label:"Payment",    active:true },
            { n:"3", label:"Done!",      active:false },
          ].map((s, i) => (
            <React.Fragment key={s.n}>
              <div style={{ display:"flex", alignItems:"center", gap:6 }}>
                <div style={{
                  width:28, height:28, borderRadius:"50%", display:"flex",
                  alignItems:"center", justifyContent:"center", fontWeight:800, fontSize:13,
                  background: s.done ? "#16a34a" : s.active ? "#f5b800" : "#e5e5e5",
                  color:      s.done || s.active ? "#1a1a1a" : "#aaa",
                }}>
                  {s.done ? "✓" : s.n}
                </div>
                <span style={{ fontSize:12, fontWeight: s.active ? 700 : 400, color: s.active ? "#1a1a1a" : "#aaa" }}>
                  {s.label}
                </span>
              </div>
              {i < 2 && <div style={{ flex:1, height:1, background:"#e0e0e0" }} />}
            </React.Fragment>
          ))}
        </div>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:16, color:"#f5b800", letterSpacing:3, marginBottom:6 }}>SHIFT-UP</div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:42, color:"#1a1a1a", margin:0 }}>Complete Setup</h1>
          <p style={{ color:"#888", marginTop:8 }}>7 days free · Then $5 CAD/month · Cancel anytime</p>
        </div>

        <div style={{ background:"#fff", borderRadius:20, padding:"32px 28px", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

          {/* Trial badge */}
          <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:"14px 18px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#166534" }}>🎁 7-Day Free Trial</div>
              <div style={{ fontSize:12, color:"#166534", opacity:.8 }}>
                Card saved now · First charge {new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:32, color:"#16a34a", fontWeight:900 }}>FREE</div>
          </div>

          {/* Account being created */}
          {userEmail && (
            <div style={{ background:"#f9f9f7", borderRadius:10, padding:"10px 16px", marginBottom:16, fontSize:13, display:"flex", alignItems:"center", gap:8 }}>
              <span style={{ color:"#aaa" }}>Account:</span>
              <strong style={{ color:"#1a1a1a" }}>{userEmail}</strong>
            </div>
          )}

          {/* Stripe card form area */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#555", marginBottom:10 }}>
              🔒 Enter Card Details
            </div>

            {/* Loading spinner */}
            {(step === "loading") && (
              <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", borderRadius:12, border:"1px dashed #e0e0e0" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:32, height:32, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 10px" }} />
                  <div style={{ fontSize:13, color:"#aaa" }}>Loading secure payment form…</div>
                </div>
              </div>
            )}

            {/* Error state */}
            {step === "error" && (
              <div style={{ padding:"14px 16px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:13, lineHeight:1.6 }}>
                ⚠️ {error}
                <div style={{ marginTop:10 }}>
                  <button onClick={onBack} style={{ background:"none", border:"1px solid #dc2626", color:"#dc2626", cursor:"pointer", fontSize:12, padding:"6px 12px", borderRadius:6, fontFamily:"var(--font-body)" }}>
                    ← Go back
                  </button>
                </div>
              </div>
            )}

            {/* Stripe mounts here — keep in DOM always */}
            <div
              id="stripe-payment-element"
              style={{
                display:    step === "error" ? "none" : "block",
                visibility: step === "loading" ? "hidden" : "visible",
                height:     step === "loading" ? 0 : "auto",
                overflow:   step === "loading" ? "hidden" : "visible",
              }}
            />
          </div>

          {/* Card error */}
          {error && step === "ready" && (
            <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:12 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Price breakdown */}
          <div style={{ background:"#f9f9f7", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13, borderBottom:"1px solid #eee" }}>
              <span style={{ color:"#888" }}>Today (7-day trial)</span>
              <span style={{ fontWeight:800, color:"#16a34a" }}>$0.00 CAD</span>
            </div>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13 }}>
              <span style={{ color:"#888" }}>After trial ends</span>
              <span style={{ fontWeight:800, color:"#1a1a1a" }}>$5.00 CAD/month</span>
            </div>
          </div>

          {/* CTA button */}
          <button
            onClick={handlePay}
            disabled={step !== "ready"}
            style={{
              width:"100%", padding:"16px 0",
              background:  step === "processing" ? "#ccc" : step !== "ready" ? "#e5e5e5" : "#f5b800",
              color:       step !== "ready" ? "#aaa" : "#1a1a1a",
              border:"none", borderRadius:12,
              fontFamily:"var(--font-body)", fontWeight:800, fontSize:16,
              cursor: step !== "ready" ? "not-allowed" : "pointer",
              marginBottom:12, transition:"all .2s",
            }}
          >
            {step === "processing" ? "⏳ Creating your account…"
             : step === "loading"  ? "⏳ Loading…"
             : step === "error"    ? "⚠️ Please fix the error above"
             : "🚀 Start Free Trial — Save Card · $0 Today"}
          </button>

          {/* Trust badges */}
          <div style={{ textAlign:"center", fontSize:12, color:"#aaa", marginBottom:14 }}>
            🔒 256-bit SSL · PCI-DSS compliant · Powered by Stripe
          </div>

          {/* Test card hint */}
          <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#7b5e00", marginBottom:14 }}>
            <strong>🧪 Test card:</strong> 4242 4242 4242 4242 &nbsp;·&nbsp; Expiry: 12/29 &nbsp;·&nbsp; CVC: 123 &nbsp;·&nbsp; ZIP: 12345
          </div>

          <button onClick={onBack} style={{ width:"100%", padding:10, background:"transparent", color:"#aaa", border:"none", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)" }}>
            ← Back to home
          </button>
        </div>
      </div>
    </div>
  );
}