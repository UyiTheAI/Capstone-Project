import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

export default function Notifications({onRead }) {
  const { t } = useLanguage();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
    } catch {
      // Demo fallback
      setNotifications([
        { _id: "1", type: "APPROVED", title: "Swap Approved", message: "Your swap was APPROVED – Manager Abel approval for Mon Oct 20", createdAt: new Date(Date.now() - 86400000).toISOString(), read: false },
        { _id: "2", type: "SCHEDULE_PUBLISHED", title: "Schedule Published", message: "SCHEDULE PUBLISHED – New schedule published – Week of Oct 20–26", createdAt: new Date(Date.now() - 172800000).toISOString(), read: false },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) => prev.map((n) => n._id === id ? { ...n, read: true } : n));
      onRead?.();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onRead?.();
    } catch {}
  };

  const typeIcon = {
    APPROVED: { char: "✓", bg: "#dcfce7", color: "#16a34a" },
    REJECTED: { char: "✗", bg: "#fee2e2", color: "#dc2626" },
    SCHEDULE_PUBLISHED: { char: "📅", bg: "#dbeafe", color: "#2563eb" },
    SWAP_REQUEST: { char: "🔄", bg: "#fef9c3", color: "#a16207" },
    SHIFT_ALERT: { char: "⚠", bg: "#fde8e0", color: "#e05a20" },
  };

  const timeAgo = (dateStr) => {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    if (mins < 60) return `${mins}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filtered = filter === "unread" ? notifications.filter((n) => !n.read) : notifications;

  return (
    <div className="su-page">
      <div className="su-title">NOTIFICATIONS</div>
      <div className="su-card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-2">
          <div className="flex gap-2">
            <button className={`su-btn su-btn-sm ${filter === "all" ? "su-btn-black" : "su-btn-outline"}`} onClick={() => setFilter("all")}>
              All
            </button>
            <button className={`su-btn su-btn-sm ${filter === "unread" ? "su-btn-black" : "su-btn-outline"}`} onClick={() => setFilter("unread")}>
              Unread ({notifications.filter((n) => !n.read).length})
            </button>
          </div>
          {notifications.some((n) => !n.read) && (
            <button className="su-btn su-btn-sm su-btn-outline" onClick={markAllRead}>
              Mark all read
            </button>
          )}
        </div>

        {loading ? (
          <div className="text-center text-muted" style={{ padding: 32 }}>Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="text-center text-muted" style={{ padding: 40 }}>
            <div style={{ fontSize: 32, marginBottom: 8 }}>🔔</div>
            No {filter === "unread" ? "unread " : ""}notifications.
          </div>
        ) : (
          filtered.map((n) => {
            const icon = typeIcon[n.type] || typeIcon.SHIFT_ALERT;
            return (
              <div
                key={n._id}
                onClick={() => !n.read && markRead(n._id)}
                style={{
                  display: "flex", alignItems: "flex-start", gap: 12, padding: "13px 0",
                  borderBottom: "1px solid #f0f0f0", cursor: !n.read ? "pointer" : "default",
                  fontWeight: !n.read ? 600 : 400, background: !n.read ? "#fffdf0" : "transparent",
                  borderRadius: 4, paddingLeft: 4,
                }}
              >
                <div style={{ width: 36, height: 36, borderRadius: "50%", background: icon.bg, color: icon.color, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 14, flexShrink: 0 }}>
                  {icon.char}
                </div>
                <div style={{ flex: 1 }}>
                  <div className="text-sm">{n.title}</div>
                  <div className="text-xs text-muted mt-2">{n.message}</div>
                  <div className="flex gap-2 mt-2">
                    {!n.read && <span className="su-badge su-badge-blue" style={{ fontSize: 9 }}>NEW</span>}
                    <span className="su-badge su-badge-gray" style={{ fontSize: 9 }}>mention</span>
                  </div>
                </div>
                <div className="text-xs text-muted" style={{ flexShrink: 0, minWidth: 60, textAlign: "right" }}>
                  {timeAgo(n.createdAt)}
                </div>
              </div>
            );
          })
        )}

        {filtered.length > 0 && (
          <div className="text-xs text-muted text-center mt-3">
            Hint: Click an unread notification to mark it as read.
          </div>
        )}
      </div>
    </div>
  );
}