import React, { useEffect, useState } from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider, useLanguage } from "./context/LanguageContext";
import api from "./api";

import Home            from "./pages/homepage/Home";
import GetStartedModal from "./pages/homepage/GetStartedModal";
import Login           from "./pages/employee_login/Login";
import Register        from "./pages/employee_login/Register";
import PaymentPage     from "./pages/payment/PaymentPage";
import EmployeePortal  from "./pages/employee_portal/EmployeePortal";
import ManagerPortal      from "./pages/manager_portal/ManagerPortal";
import ResubscribePage   from "./pages/payment/ResubscribePage";

/* ── Subscription gate — shown ONLY to owners with inactive sub ── */
function SubscriptionGate({ onResubscribe, onLogout }) {
  return (
    <div style={{ minHeight:"100vh", background:"#f4f4f0", display:"flex", alignItems:"center", justifyContent:"center", padding:24, fontFamily:"var(--font-body)" }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:480, overflow:"hidden", boxShadow:"0 8px 40px rgba(0,0,0,.1)" }}>
        <div style={{ background:"#1a1a1a", padding:"24px 32px" }}>
          <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#f5b800", letterSpacing:2, marginBottom:4 }}>SHIFT-UP</div>
          <div style={{ fontSize:13, color:"#666" }}>Subscription Required</div>
        </div>
        <div style={{ padding:"32px" }}>
          <div style={{ background:"#fff8e1", border:"1.5px solid #ffe082", borderRadius:14, padding:"18px 20px", marginBottom:24, display:"flex", gap:14, alignItems:"flex-start" }}>
            <div style={{ width:40, height:40, borderRadius:10, background:"#fef3c7", display:"flex", alignItems:"center", justifyContent:"center", flexShrink:0, fontWeight:800, color:"#f59e0b", fontSize:18 }}>!</div>
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:"#92400e", marginBottom:4 }}>Your subscription is inactive</div>
              <div style={{ fontSize:13, color:"#a16207", lineHeight:1.7 }}>
                Your SHIFT-UP subscription has ended or been cancelled. Start a new subscription to restore access for you and your team.
              </div>
            </div>
          </div>

          <div style={{ background:"#f9f9f7", borderRadius:12, padding:"16px 18px", marginBottom:24 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>What you get with an active plan</div>
            {["Unlimited shift scheduling","Staff management","Shift swap approvals","Staff reports","Tip distribution","7 Canadian languages"].map(f=>(
              <div key={f} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:13, color:"#555" }}>
                <span style={{ color:"#16a34a", fontWeight:700 }}>✓</span>{f}
              </div>
            ))}
          </div>

          <div style={{ background:"#1a1a1a", borderRadius:12, padding:"14px 18px", marginBottom:24, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
            <div>
              <div style={{ fontSize:13, color:"#888" }}>SHIFT-UP Pro</div>
              <div style={{ fontSize:11, color:"#555", marginTop:2 }}>7-day free trial · Cancel anytime</div>
            </div>
            <div style={{ textAlign:"right" }}>
              <div style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:28, color:"#f5b800", lineHeight:1 }}>$5</div>
              <div style={{ fontSize:11, color:"#555" }}>CAD/month</div>
            </div>
          </div>

          <button onClick={onResubscribe}
            style={{ width:"100%", padding:"14px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:12, transition:"opacity .15s" }}
            onMouseOver={e=>e.currentTarget.style.opacity=".9"}
            onMouseOut={e=>e.currentTarget.style.opacity="1"}>
            Start New Subscription →
          </button>
          <button onClick={onLogout}
            style={{ width:"100%", padding:"11px", background:"transparent", color:"#aaa", border:"none", fontFamily:"var(--font-body)", fontSize:13, cursor:"pointer" }}>
            Sign out
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── App routes ───────────────────────────────────────────────── */
function AppRoutes() {
  const { user, loading, logout } = useAuth();
  const { t }                     = useLanguage();
  const [page,           setPage]           = useState("home");
  const [showGetStarted, setShowGetStarted] = useState(false);
  const [subChecking,    setSubChecking]    = useState(false);
  const [subInactive,    setSubInactive]    = useState(false);

  useEffect(() => {
    if (!user) { setSubInactive(false); return; }

    // Only owners need a subscription check
    // Managers & employees belong to an owner's org — they are always allowed
    if (user.role !== "owner") {
      setSubInactive(false);
      return;
    }

    // Owner: first check their local subscriptionStatus from DB
    // If it's "active" we can skip the Stripe API call entirely
    if (user.subscriptionStatus === "active") {
      setSubInactive(false);
      return;
    }

    // If status is "free" or "cancelled", verify with Stripe
    setSubChecking(true);
    api.get("/subscription/status")
      .then(res => {
        const isActive = res.data.active === true || res.data.trial === true;
        setSubInactive(!isActive);
      })
      .catch(() => {
        // On error, give benefit of the doubt — allow access
        setSubInactive(false);
      })
      .finally(() => setSubChecking(false));
  }, [user]);

  if (loading || subChecking) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f4f4f0", flexDirection:"column", gap:16 }}>
      <div style={{ width:36, height:36, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:"#aaa", fontSize:13, fontFamily:"'DM Sans',sans-serif" }}>{t("loading")}</span>
    </div>
  );

  // Owner with inactive subscription
  if (user && user.role === "owner" && subInactive) {
    if (page === "resubscribe") {
      return (
        <ResubscribePage
          onSuccess={() => { setSubInactive(false); setPage("home"); }}
          onBack={() => setPage("home")}
        />
      );
    }
    return (
      <SubscriptionGate
        onResubscribe={() => setPage("resubscribe")}
        onLogout={logout}
      />
    );
  }

  // All authenticated users (owner active, manager, employee) → portal
  if (user) {
    return (user.role === "manager" || user.role === "owner")
      ? <ManagerPortal />
      : <EmployeePortal />;
  }

  // Payment page
  if (page === "payment") {
    return (
      <PaymentPage
        onBack={() => setPage("home")}
        onGoToLogin={() => setPage("login")}
      />
    );
  }

  if (page === "login")    return <Login    onRegisterClick={() => setPage("register")} onHomeClick={() => setPage("home")} />;
  if (page === "register") return <Register onLoginClick={() => setPage("login")} />;

  return (
    <>
      <Home
        onGetStarted={() => setShowGetStarted(true)}
        onLoginClick={() => setPage("login")}
      />
      {showGetStarted && (
        <GetStartedModal
          onClose={() => setShowGetStarted(false)}
          onAlreadyHaveAccount={() => { setShowGetStarted(false); setPage("login"); }}
          onProceedToPayment={() => { setShowGetStarted(false); setPage("payment"); }}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  );
}