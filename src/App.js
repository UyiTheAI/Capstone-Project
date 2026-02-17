import React, { useState } from "react";
import Home from "./pages/homepage/Home";
import Login from "./pages/employee_login/Login";
import Schedule from "./pages/employee_portal/Schedule";
import ShiftSwap from "./pages/employee_portal/ShiftSwap";

function App() {
  const [user, setUser] = useState(null);
  const [view, setView] = useState("home");

  const handleLogin = (userData) => {
    setUser(userData);
    setView("schedule");
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

  if (view === "shiftSwap") {
    return (
      <ShiftSwap
        user={user}
        onLogout={() => {
          setUser(null);
          setView("home");
        }}
        onBackToSchedule={() => setView("schedule")}
      />
    );
  }

  return (
    <Schedule
      user={user}
      onLogout={() => {
        setUser(null);
        setView("home");
      }}
      onShiftSwap={() => setView("shiftSwap")}
    />
  );
}

export default App;
