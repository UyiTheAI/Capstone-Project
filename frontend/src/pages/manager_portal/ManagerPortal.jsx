import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import api from "../../api";
import "../../App.css";

import ManagerDashboard  from "./ManagerDashboard";
import ManagerSchedule   from "./ManagerSchedule";
import SwapApprovals     from "./SwapApprovals";
import StaffReport       from "./StaffReport";
import EmployeeOverview  from "./EmployeeOverview";
import TipManager        from "./TipManager";

function Header({ view, setView, unreadCount, user, onLogout }) {
  const isOwner = user?.role === "owner";

  const nav = [
    { key: "managerDash",      label: "Dashboard"         },
    { key: "managerSchedule",  label: "Schedule"          },
    { key: "swapApprovals",    label: "My Approvals", badge: unreadCount > 0 },
    { key: "staffReport",      label: "Staff Reports"     },
    { key: "employeeOverview", label: "Employee Overview" },
    ...(isOwner ? [{ key: "tipManager", label: "💰 Tips" }] : []),
  ];

  return (
    <header className="su-header">
      <div className="su-brand">
        <div className="su-logobox">UP</div>
        SHIFT-UP
      </div>
      <div className="su-nav">
        {nav.map(({ key, label, badge }) => (
          <button
            key={key}
            className={`su-navbtn ${view === key ? "active" : ""}`}
            onClick={() => setView(key)}
          >
            {badge ? (
              <span className="su-badge-wrap">
                {label}
                <span className="su-badge-dot" />
              </span>
            ) : (
              label
            )}
          </button>
        ))}
        <button className="su-navbtn logout" onClick={onLogout}>Log Out</button>
      </div>
    </header>
  );
}

export default function ManagerPortal() {
  const { user, logout } = useAuth();
  const [view, setView]  = useState("managerDash");
  const [pendingSwapsCount, setPendingSwapsCount] = useState(0);

  const fetchPendingCount = async () => {
    try {
      const res = await api.get("/swaps?status=pending");
      setPendingSwapsCount(res.data.count || 0);
    } catch {}
  };

  useEffect(() => {
    fetchPendingCount();
    const interval = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(interval);
  }, []);

  const renderView = () => {
    switch (view) {
      case "managerDash":      return <ManagerDashboard user={user} onGoToSwaps={() => setView("swapApprovals")} />;
      case "managerSchedule":  return <ManagerSchedule user={user} />;
      case "swapApprovals":    return <SwapApprovals user={user} onUpdate={fetchPendingCount} />;
      case "staffReport":      return <StaffReport />;
      case "employeeOverview": return <EmployeeOverview />;
      case "tipManager":       return <TipManager />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "#f0f0ec" }}>
      <Header
        view={view}
        setView={setView}
        unreadCount={pendingSwapsCount}
        user={user}
        onLogout={logout}
      />
      {renderView()}
    </div>
  );
}