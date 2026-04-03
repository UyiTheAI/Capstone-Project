import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useLanguage } from "./context/LanguageContext";

import Home               from "./pages/homepage/Home";
import Pricing            from "./pages/homepage/Pricing";
import GetStartedModal    from "./pages/homepage/GetStartedModal";
import Login              from "./pages/employee_login/Login";
import Register           from "./pages/employee_login/Register";
import ForgotPassword     from "./pages/employee_login/ForgotPassword";
import ResetPassword      from "./pages/employee_login/ResetPassword";
import OAuthCallback      from "./pages/employee_login/OAuthCallback";
import EmployeePortal     from "./pages/employee_portal/EmployeePortal";
import ManagerPortal      from "./pages/manager_portal/ManagerPortal";
import SubscriptionPage   from "./pages/subscription/SubscriptionPage";
import { SubscriptionSuccess, SubscriptionCancel } from "./pages/subscription/SubscriptionRedirects";
import TrialPrompt        from "./components/TrialPrompt";

function AppRoutes() {
  const { user, loading, showTrial, dismissTrial } = useAuth();
  const { t } = useLanguage();

  const getInitialPage = () => {
    const path = window.location.pathname;
    if (path === "/oauth/callback")         return "oauthCallback";
    if (path === "/pricing")                return "pricing";
    if (path === "/subscription")           return "subscription";
    if (path === "/subscription/success")   return "subSuccess";
    if (path === "/subscription/cancel")    return "subCancel";
    if (path === "/forgot-password")        return "forgotPassword";
    if (path.startsWith("/reset-password")) return "resetPassword";
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
        <div style={{ fontFamily:"'DM Sans', sans-serif", color:"#888" }}>{t("loading")}</div>
      </div>
    );
  }

  // ── Special pages (no auth needed) ────────────────────────────────────────
  if (page === "oauthCallback")  return <OAuthCallback />;
  if (page === "subSuccess")     return <SubscriptionSuccess />;
  if (page === "subCancel")      return <SubscriptionCancel />;
  if (page === "forgotPassword") return <ForgotPassword onBack={() => nav("login")} />;
  if (page === "resetPassword")  return <ResetPassword />;

  // ── Authenticated ──────────────────────────────────────────────────────────
  if (user) {
    return (
      <>
        {showTrial && <TrialPrompt onClose={dismissTrial} />}
        {page === "subscription" && <SubscriptionPage />}
        {page === "pricing"      && <Pricing onGetStarted={() => setShowGetStarted(true)} onLoginClick={() => nav("login")} />}
        {page !== "subscription" && page !== "pricing" && (
          user.role === "manager" || user.role === "owner"
            ? <ManagerPortal onSubscription={() => nav("subscription")} />
            : <EmployeePortal />
        )}
      </>
    );
  }

  // ── Public ─────────────────────────────────────────────────────────────────
  return (
    <>
      {/* Get Started modal — register as owner + start trial */}
      {showGetStarted && (
        <GetStartedModal
          onClose={() => setShowGetStarted(false)}
          onAlreadyHaveAccount={() => { setShowGetStarted(false); nav("login"); }}
        />
      )}

      {page === "login"    && <Login    onRegisterClick={() => nav("register")} onHomeClick={() => nav("home")} onForgotPassword={() => nav("forgotPassword")} />}
      {page === "register" && <Register onLoginClick={() => nav("login")} onHomeClick={() => nav("home")} />}
      {page === "pricing"  && <Pricing  onGetStarted={() => setShowGetStarted(true)} onLoginClick={() => nav("login")} />}
      {page === "home"     && (
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