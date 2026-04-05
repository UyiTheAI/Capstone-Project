import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

const TYPE_ICON  = { APPROVED:"✅", REJECTED:"❌", SCHEDULE_PUBLISHED:"📅", SWAP_REQUEST:"🔄", SHIFT_ALERT:"⚠️" };
const TYPE_COLOR = { APPROVED:"#16a34a", REJECTED:"#dc2626", SCHEDULE_PUBLISHED:"#2563eb", SWAP_REQUEST:"#f59e0b", SHIFT_ALERT:"#dc2626" };
const TYPE_BG    = { APPROVED:"#dcfce7", REJECTED:"#fee2e2", SCHEDULE_PUBLISHED:"#dbeafe", SWAP_REQUEST:"#fff8e1", SHIFT_ALERT:"#fee2e2" };

export default function Notifications({ onRead }) {
  const [notifications, setNotifications] = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [filter,        setFilter]        = useState("all");
  const [tipHistory,    setTipHistory]    = useState([]);
  const [loadingTips,   setLoadingTips]   = useState(false);
  const [activeTab,     setActiveTab]     = useState("notifications"); // notifications | tips

  useEffect(() => { fetchNotifications(); }, []);
  useEffect(() => { if (activeTab === "tips") fetchTipHistory(); }, [activeTab]);

  const fetchNotifications = async () => {
    setLoading(true);
    try {
      const res = await api.get("/notifications");
      setNotifications(res.data.notifications || []);
      onRead?.();
    } catch { setNotifications([]); }
    finally { setLoading(false); }
  };

  const fetchTipHistory = async () => {
    setLoadingTips(true);
    try {
      const res = await api.get("/tips/mine");
      setTipHistory(res.data.tips || []);
    } catch { setTipHistory([]); }
    finally { setLoadingTips(false); }
  };

  const markRead = async (id) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications(prev => prev.map(n => n._id===id ? {...n,read:true} : n));
      onRead?.();
    } catch {}
  };

  const markAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications(prev => prev.map(n => ({...n,read:true})));
      onRead?.();
    } catch {}
  };

  const filtered = filter === "all" ? notifications
    : filter === "unread" ? notifications.filter(n => !n.read)
    : notifications.filter(n => n.type === filter);

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="su-page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <div>
          <div className="su-title" style={{ marginBottom:4 }}>NOTIFICATIONS & TIPS</div>
          <div style={{ fontSize:14, color:"#888" }}>Stay updated on your shifts, swaps, and tip payouts</div>
        </div>
        {unreadCount > 0 && (
          <button onClick={markAllRead} style={{ padding:"8px 16px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:8, fontFamily:"var(--font-body)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            Mark All Read ({unreadCount})
          </button>
        )}
      </div>

      {/* Tabs */}
      <div style={{ display:"flex", gap:4, background:"#f0f0ec", borderRadius:12, padding:4, marginBottom:20, width:"fit-content" }}>
        {[{key:"notifications",label:`🔔 Notifications${unreadCount>0?` (${unreadCount})`:""}`,},{key:"tips",label:"💰 Tip History"}].map(t => (
          <button key={t.key} onClick={() => setActiveTab(t.key)} style={{
            padding:"9px 20px", border:"none", borderRadius:9, cursor:"pointer",
            fontFamily:"var(--font-body)", fontSize:13, fontWeight: activeTab===t.key?800:600,
            background: activeTab===t.key?"#fff":"transparent",
            color:      activeTab===t.key?"#1a1a1a":"#888",
            boxShadow:  activeTab===t.key?"0 2px 8px rgba(0,0,0,.08)":"none",
          }}>{t.label}</button>
        ))}
      </div>

      {/* ── NOTIFICATIONS ── */}
      {activeTab === "notifications" && (
        <>
          {/* Filter pills */}
          <div style={{ display:"flex", gap:6, marginBottom:16, flexWrap:"wrap" }}>
            {[{key:"all",label:"All"},{key:"unread",label:"Unread"},{key:"SWAP_REQUEST",label:"Swaps"},{key:"SCHEDULE_PUBLISHED",label:"Schedules"},{key:"APPROVED",label:"Approvals"}].map(f => (
              <button key={f.key} onClick={() => setFilter(f.key)} style={{
                padding:"5px 14px", border:"1.5px solid", borderRadius:20, cursor:"pointer",
                fontFamily:"var(--font-body)", fontSize:12, fontWeight:600,
                borderColor: filter===f.key?"#1a1a1a":"#e5e5e5",
                background:  filter===f.key?"#1a1a1a":"#fff",
                color:       filter===f.key?"#fff":"#888",
              }}>{f.label}</button>
            ))}
          </div>

          {loading ? (
            <div style={{ textAlign:"center", padding:48, color:"#aaa" }}>Loading…</div>
          ) : filtered.length === 0 ? (
            <div style={{ textAlign:"center", padding:60, color:"#aaa", background:"#fff", borderRadius:16, border:"2px dashed #e5e5e5" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>🔔</div>
              <div style={{ fontWeight:700 }}>No notifications</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              {filtered.map(n => {
                const icon  = TYPE_ICON[n.type]  || "📌";
                const color = TYPE_COLOR[n.type] || "#888";
                const bg    = TYPE_BG[n.type]    || "#f0f0f0";
                const ago   = getTimeAgo(n.createdAt);
                return (
                  <div key={n._id} onClick={() => !n.read && markRead(n._id)}
                    style={{ background:"#fff", borderRadius:14, padding:"14px 18px", display:"flex", gap:14, alignItems:"flex-start", boxShadow:"0 2px 10px rgba(0,0,0,.04)", border:`2px solid ${n.read?"#f0f0f0":"#f5b800"}`, cursor: n.read?"default":"pointer" }}>
                    <div style={{ width:40, height:40, borderRadius:"50%", background:bg, display:"flex", alignItems:"center", justifyContent:"center", fontSize:18, flexShrink:0 }}>{icon}</div>
                    <div style={{ flex:1, minWidth:0 }}>
                      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                        <div style={{ fontWeight:700, fontSize:14, color:"#1a1a1a" }}>{n.title}</div>
                        <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                          {!n.read && <span style={{ width:8, height:8, borderRadius:"50%", background:"#f5b800", display:"inline-block" }} />}
                          <span style={{ fontSize:11, color:"#aaa" }}>{ago}</span>
                        </div>
                      </div>
                      <div style={{ fontSize:13, color:"#666", marginTop:3, lineHeight:1.5 }}>{n.message}</div>
                      <div style={{ marginTop:6, display:"inline-block", padding:"2px 10px", borderRadius:20, background:bg, fontSize:10, fontWeight:700, color }}>{n.type?.replace(/_/g," ")}</div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}

      {/* ── TIP HISTORY ── */}
      {activeTab === "tips" && (
        <>
          {loadingTips ? (
            <div style={{ textAlign:"center", padding:48, color:"#aaa" }}>Loading tip history…</div>
          ) : tipHistory.length === 0 ? (
            <div style={{ textAlign:"center", padding:60, color:"#aaa", background:"#fff", borderRadius:16, border:"2px dashed #e5e5e5" }}>
              <div style={{ fontSize:40, marginBottom:10 }}>💰</div>
              <div style={{ fontWeight:700 }}>No tip payouts yet</div>
              <div style={{ fontSize:13, marginTop:4 }}>Tips distributed by your manager will appear here</div>
            </div>
          ) : (
            <>
              {/* Total earned */}
              <div style={{ background:"#1a1a1a", borderRadius:14, padding:"16px 22px", marginBottom:20, display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                <div>
                  <div style={{ color:"#888", fontSize:11, textTransform:"uppercase", letterSpacing:.5 }}>Total Tips Earned</div>
                  <div style={{ color:"#f5b800", fontWeight:900, fontSize:28, marginTop:2 }}>
                    ${tipHistory.reduce((a,t) => a + (t.myAmount||0), 0).toFixed(2)}
                  </div>
                </div>
                <div style={{ textAlign:"right" }}>
                  <div style={{ color:"#888", fontSize:11 }}>From {tipHistory.length} payouts</div>
                </div>
              </div>

              <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
                {tipHistory.map(t => {
                  const date = new Date(t.date).toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric",year:"numeric"});
                  const by   = t.recordedBy?.name || `${t.recordedBy?.firstName||""} ${t.recordedBy?.lastName||""}`.trim();
                  return (
                    <div key={t._id} style={{ background:"#fff", borderRadius:14, padding:"14px 18px", boxShadow:"0 2px 10px rgba(0,0,0,.05)", border:"1px solid #f0f0f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
                      <div>
                        <div style={{ fontWeight:700, fontSize:14 }}>{date}</div>
                        <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>
                          Distributed by {by} · {t.splitMethod} split
                        </div>
                        {t.note && <div style={{ fontSize:12, color:"#888", marginTop:2 }}>"{t.note}"</div>}
                      </div>
                      <div style={{ textAlign:"right" }}>
                        <div style={{ fontWeight:900, fontSize:22, color:"#16a34a" }}>${(t.myAmount||0).toFixed(2)}</div>
                        <div style={{ fontSize:11, color:"#aaa" }}>of ${(t.totalAmount||0).toFixed(2)} total</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

function getTimeAgo(dateStr) {
  if (!dateStr) return "";
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff/60000);
  const hrs   = Math.floor(mins/60);
  const days  = Math.floor(hrs/24);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs < 24) return `${hrs}h ago`;
  return `${days}d ago`;
}