import React from "react";
import api from "../../api";
import { useAuth } from "../../context/AuthContext";

const PUBLISHABLE_KEY = process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY || "";

export default function PaymentPage({ onBack, onSuccess }) {
  const { user } = useAuth();
  const [stripe,       setStripe]       = React.useState(null);
  const [elements,     setElements]     = React.useState(null);
  const [clientSecret, setClientSecret] = React.useState("");
  const [step,         setStep]         = React.useState("loading");
  const [error,        setError]        = React.useState("");
  const [orgCode,      setOrgCode]      = React.useState("");

  // ── Load Stripe.js once ───────────────────────────────────────────────────
  React.useEffect(() => {
    if (!PUBLISHABLE_KEY) {
      setError("Add REACT_APP_STRIPE_PUBLISHABLE_KEY to frontend/.env");
      setStep("error");
      return;
    }
    // Already loaded — don't add script again
    if (window.Stripe) {
      setStripe(window.Stripe(PUBLISHABLE_KEY));
      return;
    }
    const script = document.createElement("script");
    script.src   = "https://js.stripe.com/v3/";
    script.async = true;
    script.onload = () => setStripe(window.Stripe(PUBLISHABLE_KEY));
    document.head.appendChild(script);
  }, []);

  // ── Create subscription intent once Stripe loads ──────────────────────────
  React.useEffect(() => {
    if (!stripe) return;
    api.post("/subscription/create-intent")
      .then(res => setClientSecret(res.data.clientSecret))
      .catch(err => {
        setError(err.response?.data?.message || "Failed to load payment form.");
        setStep("error");
      });
  }, [stripe]);

  // ── Mount Stripe Payment Element ──────────────────────────────────────────
  React.useEffect(() => {
    if (!stripe || !clientSecret) return;
    const el = stripe.elements({
      clientSecret,
      appearance: {
        theme: "stripe",
        variables: { colorPrimary:"#f5b800", borderRadius:"10px" },
      },
    });
    setElements(el);
    const pe = el.create("payment");
    pe.mount("#stripe-payment-element");
    pe.on("ready",  () => setStep("ready"));
    pe.on("change", e => { if (e.error) setError(e.error.message); else setError(""); });
  }, [stripe, clientSecret]);

  // ── Confirm payment ───────────────────────────────────────────────────────
  const handlePay = async () => {
    if (!stripe || !elements) return;
    setStep("processing"); setError("");

    const { error: stripeError } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.origin },
      redirect: "if_required",
    });

    if (stripeError) {
      setError(stripeError.message);
      setStep("ready");
      return;
    }

    try {
      const res = await api.post("/subscription/activate");
      setOrgCode(res.data.orgCode);
      setStep("success");
    } catch (err) {
      setError("Payment succeeded but activation failed. Please contact support.");
      setStep("ready");
    }
  };

  // ── Success screen ────────────────────────────────────────────────────────
  if (step === "success") return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, padding:"40px 36px", maxWidth:480, width:"100%", textAlign:"center", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>
        <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
        <h2 style={{ fontFamily:"var(--font-head)", fontSize:36, marginBottom:8 }}>Payment Successful!</h2>
        <p style={{ color:"#555", marginBottom:24, lineHeight:1.7 }}>
          Your 7-day free trial has started!<br/>
          Your org code has been emailed to <strong>{user?.email}</strong>
        </p>
        {orgCode && (
          <div style={{ background:"#f9f9f7", border:"2px solid #f5b800", borderRadius:16, padding:24, marginBottom:24 }}>
            <div style={{ fontSize:12, fontWeight:700, color:"#aaa", letterSpacing:2, marginBottom:10, textTransform:"uppercase" }}>
              🔑 Your Organisation Code
            </div>
            <div style={{ fontFamily:"monospace", fontSize:48, fontWeight:900, color:"#f5b800", letterSpacing:12 }}>
              {orgCode}
            </div>
            <div style={{ fontSize:13, color:"#888", marginTop:10 }}>
              Share this with your employees when they register
            </div>
          </div>
        )}
        <div style={{ display:"flex", gap:10 }}>
          <button
            onClick={() => { onSuccess?.(); window.location.reload(); }}
            style={{ flex:1, padding:14, background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontWeight:800, fontSize:15, cursor:"pointer", fontFamily:"var(--font-body)" }}
          >
            Go to Dashboard →
          </button>
          {orgCode && (
            <button
              onClick={() => navigator.clipboard.writeText(orgCode)}
              style={{ padding:"14px 16px", background:"#1a1a1a", color:"#fff", border:"none", borderRadius:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}
            >
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
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <div style={{ width:"100%", maxWidth:500 }}>

        {/* Header */}
        <div style={{ textAlign:"center", marginBottom:24 }}>
          <div style={{ fontFamily:"var(--font-head)", fontSize:18, color:"#f5b800", letterSpacing:2, marginBottom:6 }}>SHIFT-UP</div>
          <h1 style={{ fontFamily:"var(--font-head)", fontSize:40, color:"#1a1a1a", margin:0 }}>Start Your Free Trial</h1>
          <p style={{ color:"#888", marginTop:8 }}>7 days free · Then $5 CAD/month · Cancel anytime</p>
        </div>

        <div style={{ background:"#fff", borderRadius:20, padding:"32px 28px", boxShadow:"0 8px 40px rgba(0,0,0,.08)" }}>

          {/* Trial badge */}
          <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:12, padding:"12px 16px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontWeight:800, fontSize:14, color:"#166534" }}>🎁 7-Day Free Trial</div>
              <div style={{ fontSize:12, color:"#166534", opacity:.8 }}>
                No charge until {new Date(Date.now() + 7*24*60*60*1000).toLocaleDateString()}
              </div>
            </div>
            <div style={{ fontFamily:"var(--font-head)", fontSize:28, color:"#16a34a" }}>FREE</div>
          </div>

          {/* Features */}
          <div style={{ marginBottom:20 }}>
            {["Schedule management","Shift swaps & approvals","Staff reports","Tip manager","Google login","9 languages"].map(f => (
              <div key={f} style={{ display:"flex", gap:10, alignItems:"center", padding:"5px 0", fontSize:13, color:"#555" }}>
                <span style={{ color:"#f5b800", fontWeight:900 }}>✓</span> {f}
              </div>
            ))}
          </div>

          {/* Stripe Payment Element */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:13, fontWeight:700, color:"#555", marginBottom:8 }}>
              🔒 Secure Payment via Stripe
            </div>

            {step === "loading" && (
              <div style={{ height:80, display:"flex", alignItems:"center", justifyContent:"center", color:"#aaa", fontSize:13 }}>
                <div style={{ textAlign:"center" }}>
                  <div style={{ width:28, height:28, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 8px" }} />
                  Loading payment form…
                </div>
              </div>
            )}

            {step === "error" && (
              <div style={{ padding:"12px 16px", background:"#fee2e2", borderRadius:10, color:"#dc2626", fontSize:13 }}>
                {error}
              </div>
            )}

            <div
              id="stripe-payment-element"
              style={{ display: step === "loading" || step === "error" ? "none" : "block" }}
            />
          </div>

          {error && step === "ready" && (
            <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:12 }}>
              {error}
            </div>
          )}

          {/* Price summary */}
          <div style={{ background:"#f9f9f7", borderRadius:10, padding:"10px 14px", marginBottom:8, fontSize:13, display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#888" }}>Today (7-day trial)</span>
            <span style={{ fontWeight:800, color:"#16a34a" }}>$0.00</span>
          </div>
          <div style={{ background:"#f9f9f7", borderRadius:10, padding:"10px 14px", marginBottom:20, fontSize:13, display:"flex", justifyContent:"space-between" }}>
            <span style={{ color:"#888" }}>After trial (monthly)</span>
            <span style={{ fontWeight:800 }}>$5.00 CAD</span>
          </div>

          {/* Pay button */}
          <button
            onClick={handlePay}
            disabled={step !== "ready"}
            style={{
              width:"100%", padding:16,
              background: step === "processing" ? "#888" : step !== "ready" ? "#ccc" : "#f5b800",
              color: step !== "ready" ? "#999" : "#1a1a1a",
              border:"none", borderRadius:12,
              fontFamily:"var(--font-body)", fontWeight:800, fontSize:16,
              cursor: step !== "ready" ? "not-allowed" : "pointer",
              marginBottom:12, transition:"all .2s",
            }}
          >
            {step === "processing" ? "⏳ Processing payment…"
             : step === "loading"  ? "Loading payment form…"
             : "🚀 Start Free Trial — $0 Today"}
          </button>

          <div style={{ textAlign:"center", fontSize:12, color:"#aaa", marginBottom:12 }}>
            🔒 256-bit SSL · PCI-DSS compliant · Powered by Stripe
          </div>

          {/* Test card hint */}
          <div style={{ background:"#fff3cd", borderRadius:10, padding:"10px 14px", fontSize:12, color:"#856404", marginBottom:12 }}>
            <strong>Test card:</strong> 4242 4242 4242 4242 · Expiry: 12/29 · CVC: 123
          </div>

          <button
            onClick={onBack}
            style={{ width:"100%", padding:10, background:"transparent", color:"#aaa", border:"none", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)" }}
          >
            ← Back
          </button>
        </div>
      </div>
    </div>
  );
}