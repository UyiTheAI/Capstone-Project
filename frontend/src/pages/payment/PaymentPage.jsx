import React from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";

export default function PaymentPage({ onBack, onSuccess }) {
  const { user } = useAuth();
  const [stripe,        setStripe]        = React.useState(null);
  const [cardMounted,   setCardMounted]   = React.useState(false);
  const [clientSecret,  setClientSecret]  = React.useState("");
  const [step,          setStep]          = React.useState("loading");
  const [error,         setError]         = React.useState("");
  const [orgCode,       setOrgCode]       = React.useState("");
  const elementsRef = React.useRef(null);

  // ── 1. Load Stripe.js ─────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!PUBLISHABLE_KEY) {
      setError("REACT_APP_STRIPE_PUBLISHABLE_KEY not set in frontend/.env");
      setStep("error");
      return;
    }
    if (window.Stripe) {
      setStripe(window.Stripe(PUBLISHABLE_KEY));
      return;
    }
    // Remove any existing stripe script to avoid duplicates
    const existing = document.querySelector('script[src="https://js.stripe.com/v3/"]');
    if (existing) { setStripe(window.Stripe(PUBLISHABLE_KEY)); return; }

    const script    = document.createElement("script");
    script.src      = "https://js.stripe.com/v3/";
    script.async    = true;
    script.onload   = () => setStripe(window.Stripe(PUBLISHABLE_KEY));
    script.onerror  = () => { setError("Failed to load Stripe.js"); setStep("error"); };
    document.head.appendChild(script);
  }, []);

  // ── 2. Create payment intent once stripe is ready ─────────────────────────
  React.useEffect(() => {
    if (!stripe) return;
    setStep("loading");
    api.post("/subscription/create-intent")
      .then(res => {
        if (res.data.clientSecret) {
          setClientSecret(res.data.clientSecret);
        } else {
          setError("No client secret returned from server.");
          setStep("error");
        }
      })
      .catch(err => {
        setError(err.response?.data?.message || "Failed to initialize payment. Check STRIPE_PRICE_ID in backend .env");
        setStep("error");
      });
  }, [stripe]);

  // ── 3. Mount Stripe card element once clientSecret is ready ───────────────
  React.useEffect(() => {
    if (!stripe || !clientSecret || cardMounted) return;

    const container = document.getElementById("stripe-payment-element");
    if (!container) return;

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
            fontFamily:      "DM Sans, sans-serif",
            borderRadius:    "10px",
            spacingUnit:     "4px",
          },
        },
      });
      elementsRef.current = el;

      const paymentEl = el.create("payment", {
        layout: { type: "tabs", defaultCollapsed: false },
      });

      paymentEl.mount("#stripe-payment-element");
      setCardMounted(true);

      paymentEl.on("ready",  ()  => { setStep("ready"); setError(""); });
      paymentEl.on("change", (e) => { if (e.error) setError(e.error.message); else setError(""); });
      paymentEl.on("loaderror", (e) => { setError(e.error?.message || "Card form failed to load"); setStep("error"); });
    } catch (err) {
      setError("Failed to mount payment form: " + err.message);
      setStep("error");
    }
  }, [stripe, clientSecret, cardMounted]);

  // ── 4. Confirm payment ────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!stripe || !elementsRef.current || step !== "ready") return;
    setStep("processing"); setError("");

    try {
      const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
        elements:        elementsRef.current,
        confirmParams:   { return_url: window.location.origin },
        redirect:        "if_required",
      });

      if (stripeError) {
        setError(stripeError.message);
        setStep("ready");
        return;
      }

      // Payment confirmed — activate subscription
      const res = await api.post("/subscription/activate");
      setOrgCode(res.data.orgCode);
      setStep("success");

    } catch (err) {
      setError(err.response?.data?.message || "Payment failed. Please try again.");
      setStep("ready");
    }
  };

  // ── Success ───────────────────────────────────────────────────────────────
  if (step === "success") return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, marginBottom:8 }}>Payment Successful!</h2>
        <p style={{ color:"#555", marginBottom:24, lineHeight:1.7 }}>
          Your 7-day free trial has started!<br/>
          Org code emailed to <strong>{user?.email}</strong>
        </p>
        {orgCode && (
          <div style={{ background:"#f9f9f7", border:"2px solid #f5b800", borderRadius:16, padding:24, marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#aaa", letterSpacing:2, marginBottom:10, textTransform:"uppercase" }}>
              🔑 Your Organisation Code
            </div>
            <div style={{ fontFamily:"monospace", fontSize:52, fontWeight:900, color:"#f5b800", letterSpacing:14 }}>
              {orgCode}
            </div>
            <div style={{ fontSize:13, color:"#888", marginTop:10 }}>
              Share with your employees when they register
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button onClick={() => { onSuccess?.(); window.location.reload(); }}
            style={{ flex:1, padding:14, background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"var(--font-body)" }}>
            Go to Dashboard →
          </button>
          {orgCode && (
            <button onClick={() => navigator.clipboard.writeText(orgCode)}
              style={{ padding:"14px 18px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>
              📋 Copy
            </button>
          )}
        </div>
      </div>
    </div>
  );

  // ── Payment form ──────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        #stripe-payment-element iframe { border-radius: 10px !important; }
      `}</style>
      <div style={{ width:"100%", maxWidth:520 }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:18, color:"#f5b800", letterSpacing:2, marginBottom:4 }}>SHIFT-UP</div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:42, color:"#1a1a1a", margin:0 }}>Start Free Trial</h1>
          <p style={{ color:"#888", marginTop:8, fontSize:15 }}>7 days free · Then $5 CAD/month · Cancel anytime</p>
        </div>

        <div style={{ background:"#fff", borderRadius:20, padding:"32px 28px", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

          {/* Trial badge */}
          <div style={{ background:"#f0fdf4", border:"1.5px solid #86efac", borderRadius:12, padding:"14px 18px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#166534" }}>🎁 7-Day Free Trial</div>
              <div style={{ fontSize:12, color:"#166534", opacity:.8, marginTop:2 }}>
                No charge until {new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:32, color:"#16a34a", fontWeight:900 }}>FREE</div>
          </div>

          {/* Stripe Payment Element container */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#555", marginBottom:10, display:"flex", alignItems:"center", gap:6 }}>
              🔒 Enter Card Details
            </div>

            {/* Loading spinner */}
            {(step === "loading") && (
              <div style={{ height:120, display:"flex", alignItems:"center", justifyContent:"center", background:"#f9f9f7", borderRadius:12, border:"1px dashed #ddd" }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:32, height:32, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 10px" }} />
                  <div style={{ fontSize:13, color:"#aaa" }}>Loading secure payment form…</div>
                </div>
              </div>
            )}

            {/* Error */}
            {step === "error" && (
              <div style={{ padding:"14px 16px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:13 }}>
                ⚠️ {error}
              </div>
            )}

            {/* Stripe mounts here — always rendered so Stripe can mount into it */}
            <div
              id="stripe-payment-element"
              style={{
                display:    step === "error" ? "none" : "block",
                minHeight:  step === "loading" ? 0 : "auto",
                visibility: step === "loading" ? "hidden" : "visible",
                height:     step === "loading" ? 0 : "auto",
              }}
            />
          </div>

          {/* Card error */}
          {error && step === "ready" && (
            <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>
              ⚠️ {error}
            </div>
          )}

          {/* Price summary */}
          <div style={{ background:"#f9f9f7", borderRadius:10, overflow:"hidden", marginBottom:20 }}>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13, borderBottom:"1px solid #eee" }}>
              <span style={{ color:"#888" }}>Today (7-day trial)</span>
              <span style={{ fontWeight:800, color:"#16a34a" }}>$0.00</span>
            </div>
            <div style={{ padding:"10px 16px", display:"flex", justifyContent:"space-between", fontSize:13 }}>
              <span style={{ color:"#888" }}>After trial (monthly)</span>
              <span style={{ fontWeight:800, color:"#1a1a1a" }}>$5.00 CAD</span>
            </div>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={step !== "ready"}
            style={{
              width:"100%", padding:"16px 0",
              background: step === "processing" ? "#aaa" : step !== "ready" ? "#e5e5e5" : "#f5b800",
              color:       step !== "ready" ? "#999" : "#1a1a1a",
              border:"none", borderRadius:12,
              fontFamily:"var(--font-body)", fontWeight:800, fontSize:16,
              cursor:      step !== "ready" ? "not-allowed" : "pointer",
              marginBottom:12, transition:"all .2s",
            }}
          >
            {step === "processing" ? "⏳ Processing payment…"
             : step === "loading"  ? "⏳ Loading…"
             : step === "error"    ? "⚠️ Payment unavailable"
             : "🚀 Start Free Trial — $0 Today"}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"#aaa", marginBottom:14 }}>
            🔒 256-bit SSL · PCI-DSS compliant · Powered by Stripe
          </div>

          {/* Test card */}
          <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#7b5e00", marginBottom:12 }}>
            <strong>🧪 Test card:</strong> 4242 4242 4242 4242 &nbsp;·&nbsp; Expiry: 12/29 &nbsp;·&nbsp; CVC: 123
          </div>

          <button onClick={onBack}
            style={{ width:"100%", padding:10, background:"transparent", color:"#aaa", border:"none", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)" }}>
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}