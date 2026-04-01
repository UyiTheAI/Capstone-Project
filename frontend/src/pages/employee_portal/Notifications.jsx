import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

export default function Notifications({ onRead }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => { fetchNotifications(); }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch {
      setNotifications([
        { _id:"1", type:"APPROVED",           title:"Swap Approved",      message:"Your swap was APPROVED",          createdAt: new Date(Date.now()-86400000).toISOString(),  read:false },
        { _id:"2", type:"SCHEDULE_PUBLISHED", title:"Schedule Published", message:"New schedule published for your team", createdAt: new Date(Date.now()-172800000).toISOString(), read:false },
      ]);
    } finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read:true } : n));
      onRead?.();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read:true })));
      onRead?.();
    } catch {}
  };

  const deleteNotif = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      setNotifications((prev) => prev.filter((n) => n._id !== id));
    } catch {}
  };

  const typeIcon = {
    APPROVED:           { char:"✓",  bg:"#dcfce7", color:"#16a34a" },
    REJECTED:           { char:"✗",  bg:"#fee2e2", color:"#dc2626" },
    SCHEDULE_PUBLISHED: { char:"📅", bg:"#dbeafe", color:"#2563eb" },
    SWAP_REQUEST:       { char:"🔄", bg:"#fef9c3", color:"#a16207" },
    SHIFT_ALERT:        { char:"⚠",  bg:"#fde8e0", color:"#e05a20" },
  };

  const timeAgo = (dateStr) => {
    const diff  = Date.now() - new Date(dateStr).getTime();
    const mins  = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days  = Math.floor(diff / 86400000);
    if (mins  < 60) return `${mins}m`;
    if (hours < 24) return `${hours}h`;
    return `${days}d`;
  };

  const unreadCount = notifications.filter((n) => !n.read).length;
  const filtered    = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="su-page">
      <div className="su-title">{t("notificationsTitle")}</div>
      <div className="su-card">

        {/* Toolbar */}
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex gap-2">
            <button
              className={`su-btn su-btn-sm ${filter === "all" ? "su-btn-black" : "su-btn-outline"}`}
              onClick={() => setFilter("all")}
            >
              {t("filterAll")}
            </button>
            <button
              className={`su-btn su-btn-sm ${filter === "unread" ? "su-btn-black" : "su-btn-outline"}`}
              onClick={() => setFilter("unread")}
            >
              {t("filterUnread")} ({unreadCount})
            </button>
          </div>
          {unreadCount > 0 && (
            <button className="su-btn su-btn-sm su-btn-outline" onClick={markAllRead}>
              {t("markAllRead")}
            </button>
          )}
        </div>

        {/* Body */}
        {loading ? (
          <div className="text-center text-muted" style={{ padding:32 }}>{t("loading")}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted" style={{ padding:40 }}>
            <div style={{ fontSize:32, marginBottom:8 }}>🔔</div>
            {t("noNotifications")}
          </div>
        ) : (
          filtered.map((n) => {
            const icon = typeIcon[n.type] || typeIcon.SHIFT_ALERT;
            return (
              <div
                key={n._id}
                style={{
                  display:"flex", alignItems:"flex-start", gap:12,
                  padding:"13px 8px", borderBottom:"1px solid #f0f0f0",
                  cursor: !n.read ? "pointer" : "default",
                  background: !n.read ? "#fffdf0" : "transparent",
                  borderRadius:4,
                }}
              >
                {/* Icon */}
                <div style={{ width:36, height:36, borderRadius:"50%", background:icon.bg, color:icon.color, display:"flex", alignItems:"center", justifyContent:"center", fontSize:14, flexShrink:0 }}>
                  {icon.char}
                </div>

                {/* Content */}
                <div style={{ flex:1 }} onClick={() => !n.read && markRead(n._id)}>
                  <div className="text-sm" style={{ fontWeight: !n.read ? 700 : 400 }}>{n.title}</div>
                  <div className="text-xs text-muted mt-1">{n.message}</div>
                  {!n.read && (
                    <span style={{ display:"inline-block", marginTop:4, background:"#f5b800", color:"#1a1a1a", fontSize:9, fontWeight:800, padding:"2px 7px", borderRadius:20, letterSpacing:.5 }}>
                      {t("unread")}
                    </span>
                  )}
                </div>

                {/* Time + delete */}
                <div style={{ flexShrink:0, textAlign:"right" }}>
                  <div className="text-xs text-muted">{timeAgo(n.createdAt)}</div>
                  <button
                    onClick={() => deleteNotif(n._id)}
                    style={{ background:"none", border:"none", cursor:"pointer", color:"#ccc", fontSize:14, marginTop:4 }}
                    title={t("delete")}
                  >×</button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}