import React, { useState, useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import "../../App.css";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import ProfileCard from "../../components/ProfileCard";

import Schedule      from "./Schedule";
import ShiftSwap     from "./ShiftSwap";
import Availability  from "./Availability";
import Notifications from "./Notifications";

function Header({ view, setView, unreadCount, user, onProfile, onLogout }) {
  const { t } = useLanguage();
  const nav = [
    { key:"schedule",      label: t("mySchedule")     || "My Schedule"  },
    { key:"shiftSwap",     label: t("shiftSwap")      || "Shift Swap"   },
    { key:"availability",  label: t("myAvailability") || "Availability" },
    { key:"notifications", label: t("notifications")  || "Notifications", badge: unreadCount > 0 },
  ];
  const initials = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase();

  return (
    <header className="su-header">
      <div className="su-brand">
        <div className="su-logobox">UP</div>
        {t("appName")}
      </div>
      <div className="su-nav">
        {nav.map(({ key, label, badge }) => (
          <button key={key} className={`su-navbtn ${view===key?"active":""}`} onClick={() => setView(key)}>
            {badge ? <span className="su-badge-wrap">{label}<span className="su-badge-dot" /></span> : label}
          </button>
        ))}
        <LanguageSwitcher light />
        <button
          onClick={onProfile}
          title="My Profile"
          style={{ width:36, height:36, borderRadius:"50%", background: user?.avatar ? "transparent":"#f5b800", border:"2px solid rgba(255,255,255,.3)", cursor:"pointer", display:"flex", alignItems:"center", justifyContent:"center", overflow:"hidden", padding:0, marginLeft:4 }}
        >
          {user?.avatar
            ? <img src={user.avatar} alt="" style={{ width:"100%", height:"100%", objectFit:"cover" }} />
            : <span style={{ fontWeight:900, fontSize:13, color:"#1a1a1a" }}>{initials}</span>
          }
        </button>
        <button className="su-navbtn logout" onClick={onLogout}>{t("logout")||"Logout"}</button>
      </div>
    </header>
  );
}

export default function EmployeePortal() {
  const { user, logout } = useAuth();
  const [view,        setView]        = useState("schedule");
  const [unread,      setUnread]      = useState(0);
  const [showProfile, setShowProfile] = useState(false);

  const fetchUnread = async () => {
    try { const res = await api.get("/notifications"); setUnread(res.data.unreadCount || 0); } catch {}
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
      <Header view={view} setView={setView} unreadCount={unread} user={user} onProfile={() => setShowProfile(true)} onLogout={logout} />
      {renderView()}
      {showProfile && <ProfileCard onClose={() => setShowProfile(false)} />}
    </div>
  );
}