import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useLanguage } from "./context/LanguageContext";

import Home            from "./pages/homepage/Home";
import Pricing         from "./pages/homepage/Pricing";
import GetStartedModal from "./pages/homepage/GetStartedModal";
import Login           from "./pages/employee_login/Login";
import OAuthCallback   from "./pages/employee_login/OAuthCallback";
import EmployeePortal  from "./pages/employee_portal/EmployeePortal";
import ManagerPortal   from "./pages/manager_portal/ManagerPortal";
import PaymentPage     from "./pages/payment/PaymentPage";
import { SubscriptionSuccess, SubscriptionCancel } from "./pages/subscription/SubscriptionRedirects";

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const getInitialPage = () => {
    const path = window.location.pathname;
    if (path === "/oauth/callback")       return "oauthCallback";
    if (path === "/pricing")              return "pricing";
    if (path === "/payment")              return "payment";
    if (path === "/subscription/success") return "subSuccess";
    if (path === "/subscription/cancel")  return "subCancel";
    if (path === "/login")                return "login";
    return "home";
  };

  const [page,           setPage]           = React.useState(getInitialPage);
  const [showGetStarted, setShowGetStarted] = React.useState(false);

  const nav = (p) => {
    setPage(p);
    window.history.pushState({}, "", p === "home" ? "/" : `/${p}`);
  };

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f0ec" }}>
        <div style={{ fontFamily:"'DM Sans', sans-serif", color:"#888", fontSize:16 }}>
          {t("loading") || "Loading…"}
        </div>
      </div>
    );
  }

  // ── Special pages ──────────────────────────────────────────────────────────
  if (page === "oauthCallback") return <OAuthCallback />;
  if (page === "subSuccess")    return <SubscriptionSuccess />;
  if (page === "subCancel")     return <SubscriptionCancel />;

  // ── Payment — only from home page, no auth needed ─────────────────────────
  if (page === "payment") {
    if (user) { nav("home"); return null; }
    return <PaymentPage onBack={() => nav("home")} onGoToLogin={() => nav("login")} />;
  }

  // ── Authenticated — go straight to portal ─────────────────────────────────
  if (user) {
    return user.role === "manager" || user.role === "owner"
      ? <ManagerPortal />
      : <EmployeePortal />;
  }

  // ── Public ─────────────────────────────────────────────────────────────────
  return (
    <>
      {showGetStarted && (
        <GetStartedModal
          onClose={() => setShowGetStarted(false)}
          onAlreadyHaveAccount={() => { setShowGetStarted(false); nav("login"); }}
          onProceedToPayment={() => { setShowGetStarted(false); nav("payment"); }}
        />
      )}
      {page === "login" && <Login onHomeClick={() => nav("home")} />}
      {page === "pricing" && <Pricing onGetStarted={() => setShowGetStarted(true)} onLoginClick={() => nav("login")} />}
      {(page === "home" || (page !== "login" && page !== "pricing")) && (
        <Home onGetStarted={() => setShowGetStarted(true)} onLoginClick={() => nav("login")} onPricingClick={() => nav("pricing")} />
      )}
    </>
  );
}

function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </LanguageProvider>
  );
}

export default App;