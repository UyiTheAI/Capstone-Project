import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import "../../App.css";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ProfileCard from "../../components/ProfileCard";

import ManagerDashboard  from "./ManagerDashboard";
import ManagerSchedule   from "./ManagerSchedule";
import SwapApprovals     from "./SwapApprovals";
import StaffReport       from "./StaffReport";
import EmployeeOverview  from "./EmployeeOverview";
import TipManager        from "./TipManager";
import RegisterStaff     from "./RegisterStaff";

export default function ManagerPortal() {
  const { user, logout } = useAuth();
  const { t }            = useLanguage();
  const isOwner          = user?.role === "owner";

  const [view,         setView]         = useState("managerDash");
  const [pendingCount, setPendingCount] = useState(0);
  const [showProfile,  setShowProfile]  = useState(false);

  const initials = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase();

  const fetchPendingCount = async () => {
    try { const res = await api.get("/swaps?status=pending"); setPendingCount(res.data.count || 0); } catch {}
  };

  useEffect(() => {
    fetchPendingCount();
    const i = setInterval(fetchPendingCount, 30000);
    return () => clearInterval(i);
  }, []);

  // Navigation items
  const navItems = [
    { key:"managerDash",      label: t("dashboard")        || "Dashboard"                        },
    { key:"managerSchedule",  label: t("schedule")         || "Schedule"                         },
    { key:"swapApprovals",    label: t("swapApprovals")    || "Swap Approvals", badge: pendingCount > 0 },
    { key:"staffReport",      label: t("staffReports")     || "Staff Reports"                    },
    { key:"employeeOverview", label: t("employeeOverview") || "Overview"                         },
    ...(isOwner ? [{ key:"tipManager", label: t("tips") || "Tips" }] : []),
    { key:"registerStaff",    label: isOwner ? "Register Staff" : "Register Employee" },
  ];

  const renderView = () => {
    switch (view) {
      case "managerDash":      return <ManagerDashboard user={user} onGoToSwaps={() => setView("swapApprovals")} />;
      case "managerSchedule":  return <ManagerSchedule user={user} />;
      case "swapApprovals":    return <SwapApprovals user={user} onUpdate={fetchPendingCount} />;
      case "staffReport":      return <StaffReport />;
      case "employeeOverview": return <EmployeeOverview />;
      case "tipManager":       return <TipManager />;
      case "registerStaff":    return <RegisterStaff />;
      default:                 return null;
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec" }}>

      {/* ── Header ── */}
      <header className="su-header">
        <div className="su-brand">
          <div className="su-logobox">UP</div>
          {t("appName")}
        </div>

        <div className="su-nav">
          {navItems.map(({ key, label, badge }) => (
            <button
              key={key}
              onClick={() => setView(key)}
              className={`su-navbtn ${view===key ? "active" : ""}`}
            >
              {badge
                ? <span className="su-badge-wrap">{label}<span className="su-badge-dot" /></span>
                : label
              }
            </button>
          ))}

          <LanguageSwitcher light />

          {/* Profile avatar button */}
          <button
            onClick={() => setShowProfile(true)}
            title="My Profile"
            style={{ width:36, height:36, borderRadius:"50%", background: user?.avatar ? "transparent":"#f5b800", border:"2px solid rgba(255,255,255,.3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:0, marginLeft:4, flexShrink:0 }}
          >
            {user?.avatar
              ? <img src={user.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
              : <span style={{ fontWeight:900, fontSize:13, color:"#1a1a1a" }}>{initials}</span>
            }
          </button>

          <button className="su-navbtn logout" onClick={logout}>
            {t("logout") || "Logout"}
          </button>
        </div>
      </header>

      {/* ── View ── */}
      {renderView()}

      {/* ── Profile modal ── */}
      {showProfile && <ProfileCard onClose={() => setShowProfile(false)} />}
    </div>
  );
}