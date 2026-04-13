import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../../context/AuthContext";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import "../../App.css";
import PortalLayout from "../../components/PortalLayout";
import ManagerDashboard  from "./ManagerDashboard";
import ManagerSchedule   from "./ManagerSchedule";
import SwapApprovals     from "./SwapApprovals";
import StaffReport       from "./StaffReport";
import EmployeeOverview  from "./EmployeeOverview";
import TipManager        from "./TipManager";
import RegisterStaff     from "./RegisterStaff";

export default function ManagerPortal() {
  const { user }         = useAuth();
  const { t }            = useLanguage();
  const [view,          setView]          = useState("dashboard");
  const [pending,       setPending]       = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [unread,        setUnread]        = useState(0);
  const isOwner = user?.role==="owner";

  const fetchPending = useCallback(async () => {
    try { const r=await api.get("/swaps?status=pending"); setPending(r.data.count||0); } catch {}
  },[]);

  const fetchNotifs = useCallback(async () => {
    try {
      const r=await api.get("/notifications");
      const ns=r.data.notifications||[];
      setNotifications(ns); setUnread(ns.filter(n=>!n.read).length);
    } catch {}
  },[]);

  useEffect(() => {
    fetchPending(); fetchNotifs();
    const id=setInterval(()=>{fetchPending();fetchNotifs();},30000);
    return ()=>clearInterval(id);
  },[fetchPending,fetchNotifs]);

  const markRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); setNotifications(p=>p.map(n=>n._id===id?{...n,read:true}:n)); setUnread(p=>Math.max(0,p-1)); } catch {}
  };
  const markAllRead = async () => {
    try { await api.put("/notifications/read-all"); setNotifications(p=>p.map(n=>({...n,read:true}))); setUnread(0); } catch {}
  };

  const navSections = [
    { title:"Overview", items:[
      { key:"dashboard",     label:t("dashboard")        },
      { key:"schedule",      label:t("schedule")          },
      { key:"employees",     label:t("employeeOverview")  },
    ]},
    { title:"Operations", items:[
      { key:"swapApprovals", label:t("swapApprovals"), badge:pending },
      { key:"staffReports",  label:t("staffReports")      },
      ...(isOwner?[{ key:"tips", label:t("tips") }]:[]),
    ]},
    { title:"Team", items:[
      { key:"register", label:isOwner?t("registerStaff"):t("registerEmployee") },
    ]},
  ];

  const topbarActions = (
    <>
      {pending>0&&view!=="swapApprovals"&&<button className="pl-qbtn danger" onClick={()=>setView("swapApprovals")}>{pending} {t("pending")}</button>}
      {view!=="schedule"&&<button className="pl-qbtn" onClick={()=>setView("schedule")}>{t("schedule")}</button>}
    </>
  );

  const views = {
    dashboard:    <ManagerDashboard  user={user} onGoToSwaps={()=>setView("swapApprovals")} />,
    schedule:     <ManagerSchedule   user={user} />,
    swapApprovals:<SwapApprovals     user={user} onUpdate={fetchPending} />,
    staffReports: <StaffReport />,
    employees:    <EmployeeOverview />,
    tips:         <TipManager />,
    register:     <RegisterStaff isOwner={isOwner} />,
  };

  return (
    <PortalLayout
      portalLabel={isOwner?t("ownerPortal")+" Portal":t("managerPortal")+" Portal"}
      navSections={navSections}
      view={view} setView={setView}
      topbarActions={topbarActions}
      notifications={notifications}
      unreadCount={unread}
      onMarkRead={markRead}
      onMarkAllRead={markAllRead}
    >
      {views[view]||null}
    </PortalLayout>
  );
}