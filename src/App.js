// src/App.jsx
import React, { useState } from "react";
import Home from "./pages/homepage/Home";
import Login from "./pages/manager_login/Login";
import Dashboard from "./pages/employee_portal/Schedule";
import Register from "./pages/register/Register";

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home"); 
  // "home" | "login" | "register" | "app"

  const handleLogin = (userData) => {
    setUser(userData);
    setView("app");
  };

  if (!user && view === "home") {
    return (
      <Home
        onGetStarted={() => setView("register")}
        onLoginClick={() => setView("login")}
      />
    );
  }

  if (!user && view === "login") {
    return (
      <Login
        onLogin={handleLogin}
        onRegisterClick={() => setView("register")}
      />
    );
  }

  if (!user && view === "register") {
    return (
      <Register
        onLoginClick={() => setView("login")}
      />
    );
  }

  return (
    <Dashboard
      user={user}
      onLogout={() => {
        setUser(null);
        setView("home");
      }}
    />
  );
}

export default App;
