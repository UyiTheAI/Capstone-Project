// src/App.jsx
import React, { useState } from "react";
import Home from "./pages/homepage/Home";
import Login from "./pages/manager_login/Login";
import Dashboard from "./pages/employee_portal/Dashboard";

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home"); // "home" | "login" | "app"

  const handleLogin = (userData) => {
    setUser(userData);
    setView("app");
  };

  if (!user && view === "home") {
    return (
      <Home
        onGetStarted={() => setView("login")}
        onLoginClick={() => setView("login")}
      />
    );
  }

  if (!user && view === "login") {
    return <Login onLogin={handleLogin} />;
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
