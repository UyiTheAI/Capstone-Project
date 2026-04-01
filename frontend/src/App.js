import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { LanguageProvider } from "./context/LanguageContext";
import { useLanguage } from "./context/LanguageContext";
import Home          from "./pages/homepage/Home";
import Login         from "./pages/employee_login/Login";
import Register      from "./pages/employee_login/Register";
import OAuthCallback from "./pages/employee_login/OAuthCallback";
import EmployeePortal from "./pages/employee_portal/EmployeePortal";
import ManagerPortal  from "./pages/manager_portal/ManagerPortal";

function AppRoutes() {
  const { user, loading } = useAuth();
  const { t } = useLanguage();
  const [page, setPage] = React.useState(() => {
    // If we're on /oauth/callback, render that immediately
    if (window.location.pathname === "/oauth/callback") return "oauthCallback";
    return "home";
  });

  if (loading) {
    return (
      <div style={{ display:"flex", alignItems:"center", justifyContent:"center", minHeight:"100vh", background:"#f0f0ec" }}>
        <div style={{ fontFamily:"var(--font-body)", color:"#888" }}>{t("loading")}</div>
      </div>
    );
  }

  // Handle OAuth callback page (no auth needed)
  if (page === "oauthCallback") return <OAuthCallback />;

  // Logged-in — show portal
  if (user) {
    if (user.role === "manager" || user.role === "owner") return <ManagerPortal />;
    return <EmployeePortal />;
  }

  if (page === "login")    return <Login    onRegisterClick={() => setPage("register")} onHomeClick={() => setPage("home")} />;
  if (page === "register") return <Register onLoginClick={() => setPage("login")} />;
  return <Home onGetStarted={() => setPage("login")} onLoginClick={() => setPage("login")} />;
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