import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import "../../App.css";
import PortalLayout from "../../components/PortalLayout";
import Schedule      from "./Schedule";
import ShiftSwap     from "./ShiftSwap";
import Availability  from "./Availability";
import Notifications from "./Notifications";

export default function EmployeePortal() {
  const { user }         = useAuth();
  const { t }            = useLanguage();
  const [view,          setView]          = useState("schedule");
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);

  const fetchNotifs = useCallback(async () => {
    try {
      const r = await api.get("/notifications");
      const ns = r.data.notifications || [];
      setNotifications(ns);
      setUnread(ns.filter(n=>!n.read).length);
    } catch {}
  }, []);

  useEffect(() => {
    fetchNotifs();
    const id = setInterval(fetchNotifs, 30000);
    return () => clearInterval(id);
  }, [fetchNotifs]);

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(p=>p.map(n=>n._id===id?{...n,read:true}:n));
      setUnread(p=>Math.max(0,p-1));
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(p=>p.map(n=>({...n,read:true})));
      setUnread(0);
    } catch {}
  };

  const navSections = [
    { title: t("mySchedule").toUpperCase().slice(0,2)==="MY"?"My Work":"Work", items: [
      { key:"schedule",     label:t("mySchedule")     },
      { key:"shiftSwap",    label:t("shiftSwap")      },
      { key:"availability", label:t("myAvailability") },
    ]},
    { title:"Activity", items:[
      { key:"notifications", label:t("notifications"), badge:unread },
    ]},
  ];

  const views = {
    schedule:      <Schedule      user={user} />,
    shiftSwap:     <ShiftSwap     user={user} />,
    availability:  <Availability  user={user} />,
    notifications: <Notifications user={user} onRead={fetchNotifs} />,
  };

  return (
    <PortalLayout
      portalLabel={t("employeePortal")+" Portal"}
      navSections={navSections}
      view={view} setView={setView}
      notifications={notifications}
      unreadCount={unread}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
    >
      {views[view] || null}
    </PortalLayout>
  );
}