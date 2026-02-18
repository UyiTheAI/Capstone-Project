import React from "react";
import { AuthProvider, useAuth } from "./context/AuthContext";
import Home from "./pages/homepage/Home";
import Login from "./pages/employee_login/Login";
import Register from "./pages/employee_login/Register";
import EmployeePortal from "./pages/employee_portal/EmployeePortal";
import ManagerPortal from "./pages/manager_portal/ManagerPortal";

function AppRoutes() {
  const { user, loading } = useAuth();
  const [page, setPage] = React.useState("home");

  if (loading) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#f0f0ec" }}>
        <div style={{ fontFamily: "'DM Sans', sans-serif", color: "#888" }}>Loading ShiftUp...</div>
      </div>
    );
  }

  // Logged in → show correct portal
  if (user) {
    if (user.role === "manager" || user.role === "owner") {
      return <ManagerPortal />;
    }
    return <EmployeePortal />;
  }

  // Not logged in
  if (page === "login") return <Login onRegisterClick={() => setPage("register")} onHomeClick={() => setPage("home")} />;
  if (page === "register") return <Register onLoginClick={() => setPage("login")} />;
  return <Home onGetStarted={() => setPage("login")} onLoginClick={() => setPage("login")} />;
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
