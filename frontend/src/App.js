import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useLanguage } from "./context/LanguageContext";

import Home             from "./pages/homepage/Home";
import Pricing          from "./pages/homepage/Pricing";
import GetStartedModal  from "./pages/homepage/GetStartedModal";
import Login            from "./pages/employee_login/Login";
import ForgotPassword   from "./pages/employee_login/ForgotPassword";
import ResetPassword    from "./pages/employee_login/ResetPassword";
import OAuthCallback    from "./pages/employee_login/OAuthCallback";
import EmployeePortal   from "./pages/employee_portal/EmployeePortal";
import ManagerPortal    from "./pages/manager_portal/ManagerPortal";
import PaymentPage      from "./pages/payment/PaymentPage";
import { SubscriptionSuccess, SubscriptionCancel } from "./pages/subscription/SubscriptionRedirects";

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();

  const getInitialPage = () => {
    const path = window.location.pathname;
    if (path === "/oauth/callback")         return "oauthCallback";
    if (path === "/pricing")                return "pricing";
    if (path === "/payment")                return "payment";
    if (path === "/subscription/success")   return "subSuccess";
    if (path === "/subscription/cancel")    return "subCancel";
    if (path === "/forgot-password")        return "forgotPassword";
    if (path.startsWith("/reset-password")) return "resetPassword";
    if (path === "/login")                  return "login";
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

  // ── No-auth pages ──────────────────────────────────────────────────────────
  if (page === "oauthCallback")  return <OAuthCallback />;
  if (page === "subSuccess")     return <SubscriptionSuccess />;
  if (page === "subCancel")      return <SubscriptionCancel />;
  if (page === "forgotPassword") return <ForgotPassword onBack={() => nav("login")} />;
  if (page === "resetPassword")  return <ResetPassword />;

  // ── Payment page — only from home page flow, no auth needed ───────────────
  if (page === "payment") {
    // If already logged in, don't allow payment again
    if (user) {
      nav("home");
      return null;
    }
    return (
      <PaymentPage
        onBack={() => nav("home")}
        onGoToLogin={() => nav("login")}
      />
    );
  }

  // ── Authenticated — go straight to portal ──────────────────────────────────
  if (user) {
    // No TrialPrompt, no subscription page inside portal
    // Payment is only done from home page
    return (
      user.role === "manager" || user.role === "owner"
        ? <ManagerPortal />
        : <EmployeePortal />
    );
  }

  // ── Public (not logged in) ─────────────────────────────────────────────────
  return (
    <>
      {showGetStarted && (
        <GetStartedModal
          onClose={() => setShowGetStarted(false)}
          onAlreadyHaveAccount={() => { setShowGetStarted(false); nav("login"); }}
          onProceedToPayment={() => { setShowGetStarted(false); nav("payment"); }}
        />
      )}

      {page === "login" && (
        <Login
          onHomeClick={() => nav("home")}
          onForgotPassword={() => nav("forgotPassword")}
        />
      )}
      {page === "pricing" && (
        <Pricing
          onGetStarted={() => setShowGetStarted(true)}
          onLoginClick={() => nav("login")}
        />
      )}
      {(page === "home" || (page !== "login" && page !== "pricing")) && (
        <Home
          onGetStarted={() => setShowGetStarted(true)}
          onLoginClick={() => nav("login")}
          onPricingClick={() => nav("pricing")}
        />
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