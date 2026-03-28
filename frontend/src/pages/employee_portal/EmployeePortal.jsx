import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import "../../App.css";
import LanguageSwitcher from "../../components/LanguageSwitcher";

import Schedule      from "./Schedule";
import ShiftSwap     from "./ShiftSwap";
import Availability  from "./Availability";
import Notifications from "./Notifications";

function Header({ view, setView, unreadCount, onLogout }) {
  const { t } = useLanguage();
  const nav = [
    { key: "schedule",      label: t("mySchedule")     },
    { key: "shiftSwap",     label: t("shiftSwap")      },
    { key: "availability",  label: t("myAvailability") },
    { key: "notifications", label: t("notifications"), badge: unreadCount > 0 },
  ];
  return (
    <header className="su-header">
      <div className="su-brand">
        <div className="su-logobox">UP</div>
        {t("appName")}
      </div>
      <div className="su-nav">
        {nav.map(({ key, label, badge }) => (
          <button key={key} className={`su-navbtn ${view === key ? "active" : ""}`} onClick={() => setView(key)}>
            {badge ? (
              <span className="su-badge-wrap">{label}<span className="su-badge-dot" /></span>
            ) : label}
          </button>
        ))}
        <LanguageSwitcher light />
        <button className="su-navbtn logout" onClick={onLogout}>{t("logout")}</button>
      </div>
    </header>
  );
}

export default function EmployeePortal() {
  const { user, logout } = useAuth();
  const [view, setView]  = useState("schedule");
  const [unread, setUnread] = useState(0);

  const fetchUnread = async () => {
    try {
      const res = await api.get("/notifications");
      setUnread(res.data.unreadCount || 0);
    } catch {}
  };

  useEffect(() => {
    fetchUnread();
    const i = setInterval(fetchUnread, 30000);
    return () => clearInterval(i);
  }, []);

  const renderView = () => {
    switch (view) {
      case "schedule":      return <Schedule user={user} />;
      case "shiftSwap":     return <ShiftSwap user={user} />;
      case "availability":  return <Availability user={user} />;
      case "notifications": return <Notifications user={user} onRead={fetchUnread} />;
      default: return null;
    }
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f0ec" }}>
      <Header view={view} setView={setView} unreadCount={unread} onLogout={logout} />
      {renderView()}
    </div>
  );
}