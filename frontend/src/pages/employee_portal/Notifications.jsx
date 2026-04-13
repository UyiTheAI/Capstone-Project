import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const TYPES = {
  APPROVED:           { icon:"✓",  bg:"#dcfce7", color:"#16a34a", label:"Approved"  },
  REJECTED:           { icon:"✗",  bg:"#fee2e2", color:"#dc2626", label:"Rejected"  },
  SCHEDULE_PUBLISHED: { icon:"📅", bg:"#dbeafe", color:"#2563eb", label:"Schedule"  },
  SWAP_REQUEST:       { icon:"🔄", bg:"#fef9c3", color:"#a16207", label:"Swap"      },
  SHIFT_ALERT:        { icon:"⚠",  bg:"#fde8e0", color:"#e05a20", label:"Alert"     },
  TIP:                { icon:"💰", bg:"#fef9c3", color:"#a16207", label:"Tip"       },
};

const ago = (d) => {
  const m=Math.floor((Date.now()-new Date(d))/60000);
  if(m<1)return "just now"; if(m<60)return `${m}m ago`;
  const h=Math.floor(m/60); if(h<24)return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

export default function Notifications({ onRead }) {
  const { t }    = useLanguage();
  const [notifs, setNotifs]  = useState([]);
  const [loading,setLoading] = useState(true);
  const [filter, setFilter]  = useState("all");

  useEffect(()=>{ fetchAll(); },[]);

  const fetchAll = async () => {
    setLoading(true);
    try { const r=await api.get("/notifications"); setNotifs(r.data.notifications||[]); }
    catch { setNotifs([]); }
    finally { setLoading(false); }
  };

  const markRead = async (id) => {
    try { await api.put(`/notifications/${id}/read`); setNotifs(p=>p.map(n=>n._id===id?{...n,read:true}:n)); onRead?.(); } catch {}
  };
  const markAllRead = async () => {
    try { await api.put("/notifications/read-all"); setNotifs(p=>p.map(n=>({...n,read:true}))); onRead?.(); } catch {}
  };

  const unread   = notifs.filter(n=>!n.read).length;
  const filtered = filter==="unread" ? notifs.filter(n=>!n.read) : notifs;

  return (
    <div className="su-page">
      <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",marginBottom:20,flexWrap:"wrap",gap:12 }}>
        <div>
          <div style={{ fontFamily:"var(--font-head)",fontSize:24,letterSpacing:1 }}>{t("notificationsTitle")}</div>
          <div style={{ fontSize:13,color:"#aaa",marginTop:3 }}>{unread>0?`${unread} unread`:"All caught up"}</div>
        </div>
        {unread>0&&<button onClick={markAllRead} className="su-btn su-btn-outline su-btn-sm">{t("markAllRead")}</button>}
      </div>

      {/* Filters */}
      <div style={{ display:"flex",gap:6,marginBottom:16 }}>
        {[["all",`All (${notifs.length})`],["unread",`Unread (${unread})`]].map(([k,l])=>(
          <button key={k} onClick={()=>setFilter(k)}
            style={{ padding:"7px 16px",borderRadius:8,border:"1.5px solid",fontFamily:"var(--font-body)",fontSize:13,fontWeight:600,cursor:"pointer",transition:"all .15s",
              borderColor:filter===k?"#1a1a1a":"#e5e5e5",background:filter===k?"#1a1a1a":"#fff",color:filter===k?"#fff":"#555" }}>
            {l}
          </button>
        ))}
      </div>

      <div style={{ background:"#fff",borderRadius:16,border:"1px solid #ebebeb",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
        {loading ? (
          <div style={{ padding:"60px 20px",textAlign:"center",color:"#aaa" }}>
            <div style={{ width:28,height:28,border:"3px solid #f5b800",borderTopColor:"transparent",borderRadius:"50%",animation:"spin .8s linear infinite",margin:"0 auto 12px" }} />
            <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
            Loading…
          </div>
        ) : filtered.length===0 ? (
          <div style={{ padding:"60px 20px",textAlign:"center" }}>
            <div style={{ fontSize:40,marginBottom:12 }}>🔔</div>
            <div style={{ fontWeight:700,fontSize:15,color:"#1a1a1a",marginBottom:6 }}>{filter==="unread"?"No unread notifications":t("noNotifications")}</div>
            <div style={{ fontSize:13,color:"#aaa" }}>You're all caught up!</div>
          </div>
        ) : (
          filtered.map((n,i)=>{
            const cfg=TYPES[n.type]||TYPES.SHIFT_ALERT;
            return(
              <div key={n._id} onClick={()=>!n.read&&markRead(n._id)}
                style={{ display:"flex",gap:14,alignItems:"flex-start",padding:"16px 20px",borderBottom:i<filtered.length-1?"1px solid #f5f5f5":"none",background:!n.read?"#fffdf5":"#fff",cursor:!n.read?"pointer":"default",transition:"background .12s" }}>
                <div style={{ width:42,height:42,borderRadius:12,background:cfg.bg,color:cfg.color,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0 }}>{cfg.icon}</div>
                <div style={{ flex:1,minWidth:0 }}>
                  <div style={{ display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:12 }}>
                    <div>
                      <div style={{ fontWeight:700,fontSize:14,color:"#1a1a1a" }}>{n.title}</div>
                      <div style={{ fontSize:13,color:"#666",lineHeight:1.5,marginTop:3 }}>{n.message}</div>
                    </div>
                    <div style={{ flexShrink:0,textAlign:"right" }}>
                      <div style={{ fontSize:11,color:"#aaa",whiteSpace:"nowrap" }}>{ago(n.createdAt)}</div>
                      <span style={{ display:"inline-block",marginTop:4,padding:"2px 8px",borderRadius:20,background:cfg.bg,color:cfg.color,fontSize:10,fontWeight:700 }}>{cfg.label}</span>
                    </div>
                  </div>
                </div>
                {!n.read&&<div style={{ width:8,height:8,background:"#f5b800",borderRadius:"50%",flexShrink:0,marginTop:6 }} />}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}