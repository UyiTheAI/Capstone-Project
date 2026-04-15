import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useLanguage } from "../context/LanguageContext";
import LanguageSwitcher from "./LanguageSwitcher";
import ProfileCard from "./ProfileCard";

const CSS = `
*{box-sizing:border-box;}
.pl{display:flex;min-height:100vh;background:#f4f4f0;font-family:var(--font-body);}
.pl-side{width:220px;min-height:100vh;background:#111;position:fixed;top:0;left:0;bottom:0;display:flex;flex-direction:column;z-index:300;}
.pl-brand{padding:20px 18px 16px;border-bottom:1px solid rgba(255,255,255,.06);display:flex;align-items:center;gap:10px;flex-shrink:0;}
.pl-logo{width:36px;height:36px;background:#f5b800;border-radius:9px;display:flex;align-items:center;justify-content:center;font-family:'Bebas Neue',sans-serif;font-size:17px;color:#1a1a1a;font-weight:900;flex-shrink:0;}
.pl-appname{font-family:'Bebas Neue',sans-serif;font-size:20px;color:#fff;letter-spacing:2px;}
.pl-appsub{font-size:10px;color:#555;letter-spacing:.5px;text-transform:uppercase;margin-top:1px;}
.pl-nav{flex:1;padding:12px 10px;overflow-y:auto;}
.pl-nav-sec{font-size:10px;color:#444;text-transform:uppercase;letter-spacing:1px;padding:10px 10px 6px;font-weight:700;}
.pl-nav-btn{width:100%;display:flex;align-items:center;gap:10px;padding:10px 12px;border:none;border-radius:10px;background:transparent;color:#888;font-family:var(--font-body);font-size:13px;font-weight:500;cursor:pointer;text-align:left;transition:all .15s;margin-bottom:2px;position:relative;}
.pl-nav-btn:hover{background:rgba(255,255,255,.06);color:#ccc;}
.pl-nav-btn.active{background:rgba(245,184,0,.12);color:#f5b800;font-weight:700;}
.pl-nav-btn.active::before{content:'';position:absolute;left:0;top:4px;bottom:4px;width:3px;background:#f5b800;border-radius:0 3px 3px 0;}
.pl-badge{margin-left:auto;background:#dc2626;color:#fff;font-size:10px;font-weight:800;padding:1px 7px;border-radius:20px;min-width:20px;text-align:center;}
.pl-foot{padding:14px 10px;border-top:1px solid rgba(255,255,255,.06);flex-shrink:0;}
.pl-user{display:flex;align-items:center;gap:10px;padding:10px 12px;background:rgba(255,255,255,.04);border-radius:10px;cursor:pointer;border:none;width:100%;text-align:left;transition:background .15s;}
.pl-user:hover{background:rgba(255,255,255,.08);}
.pl-ava{width:34px;height:34px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-weight:800;font-size:13px;flex-shrink:0;}
.pl-uname{font-size:13px;font-weight:700;color:#fff;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
.pl-urole{font-size:10px;color:#555;text-transform:capitalize;margin-top:1px;display:flex;align-items:center;gap:4px;}
.pl-main{margin-left:220px;min-height:100vh;display:flex;flex-direction:column;width:calc(100% - 220px);}
.pl-topbar{background:#fff;border-bottom:1px solid #ebebeb;padding:0 28px;display:flex;align-items:center;justify-content:space-between;height:56px;position:sticky;top:0;z-index:100;gap:12px;box-sizing:border-box;width:100%;}
.pl-topbar-r{display:flex;align-items:center;gap:10px;flex-shrink:0;}
.pl-ptitle{font-size:15px;font-weight:800;color:#1a1a1a;}
.pl-psub{font-size:12px;color:#aaa;margin-top:1px;}
.pl-qbtn{display:inline-flex;align-items:center;gap:6px;padding:7px 14px;border:1.5px solid #e5e5e5;border-radius:8px;background:#fff;font-family:var(--font-body);font-size:12px;font-weight:600;color:#555;cursor:pointer;transition:all .15s;white-space:nowrap;}
.pl-qbtn:hover{border-color:#1a1a1a;color:#1a1a1a;}
.pl-qbtn.danger{background:#dc2626;border-color:#dc2626;color:#fff;font-weight:700;}
.pl-qbtn.danger:hover{background:#b91c1c;}
.pl-content{flex:1;}
.pl-content .su-page{max-width:1100px;margin:0 auto;}
.notif-pop{position:fixed;top:64px;right:20px;width:380px;max-height:520px;background:#fff;border-radius:16px;box-shadow:0 20px 60px rgba(0,0,0,.18);border:1px solid #ebebeb;z-index:500;overflow:hidden;display:flex;flex-direction:column;animation:nIn .2s ease;}
@keyframes nIn{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}
.notif-head{padding:14px 18px;border-bottom:1px solid #f0f0f0;display:flex;align-items:center;justify-content:space-between;flex-shrink:0;}
.notif-list{overflow-y:auto;flex:1;}
.notif-row{display:flex;gap:12px;align-items:flex-start;padding:14px 18px;border-bottom:1px solid #f9f9f7;cursor:pointer;transition:background .12s;}
.notif-row:hover{background:#fafafa;}
.notif-row.unread{background:#fffdf5;}
.notif-row:last-child{border-bottom:none;}
.notif-ico{width:36px;height:36px;border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;}
.notif-dot{width:7px;height:7px;background:#f5b800;border-radius:50%;flex-shrink:0;margin-top:6px;}
@media(max-width:900px){.pl-side{transform:translateX(-220px);}.pl-main{margin-left:0;width:100%;}.pl-topbar{padding:0 16px;}.notif-pop{width:calc(100vw - 32px);right:16px;}}
`;

const NTYPE = {
  APPROVED:           { ch:"✓",  bg:"#dcfce7", cl:"#16a34a" },
  REJECTED:           { ch:"✗",  bg:"#fee2e2", cl:"#dc2626" },
  SCHEDULE_PUBLISHED: { ch:"📅", bg:"#dbeafe", cl:"#2563eb" },
  SWAP_REQUEST:       { ch:"🔄", bg:"#fef9c3", cl:"#a16207" },
  SHIFT_ALERT:        { ch:"⚠",  bg:"#fde8e0", cl:"#e05a20" },
  TIP:                { ch:"💰", bg:"#fef9c3", cl:"#a16207" },
};

const ago = (d) => {
  const m=Math.floor((Date.now()-new Date(d))/60000);
  if(m<1)return "just now"; if(m<60)return `${m}m ago`;
  const h=Math.floor(m/60); if(h<24)return `${h}h ago`;
  return `${Math.floor(h/24)}d ago`;
};

export default function PortalLayout({ portalLabel, navSections, view, setView, topbarActions, notifications=[], unreadCount=0, onMarkRead, onMarkAllRead, children }) {
  const { user, logout } = useAuth();
  const { t }            = useLanguage();
  const [showNotif, setShowNotif] = useState(false);
  const [showProfile, setShowProfile] = useState(false);

  const initials  = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase() || "U";
  const uname     = `${user?.firstName||""} ${user?.lastName||""}`.trim();
  const rc        = user?.role==="owner"?"#f5b800":user?.role==="manager"?"#0891b2":"#16a34a";
  const rt        = user?.role==="owner"?"#1a1a1a":"#fff";
  const allItems  = navSections.flatMap(s=>s.items);
  const current   = allItems.find(n=>n.key===view);

  return (
    <>
      <style>{CSS}</style>
      <div className="pl">

        {/* SIDEBAR */}
        <aside className="pl-side">
          <div className="pl-brand">
            <div className="pl-logo">SU</div>
            <div><div className="pl-appname">SHIFT-UP</div><div className="pl-appsub">{portalLabel}</div></div>
          </div>

          <nav className="pl-nav">
            {navSections.map(sec => (
              <div key={sec.title}>
                <div className="pl-nav-sec">{sec.title}</div>
                {sec.items.map(item => (
                  <button key={item.key} className={`pl-nav-btn${view===item.key?" active":""}`} onClick={()=>setView(item.key)}>
                    <span style={{ flex:1 }}>{item.label}</span>
                    {item.badge>0 && <span className="pl-badge">{item.badge}</span>}
                  </button>
                ))}
              </div>
            ))}
          </nav>

          <div className="pl-foot">
            <button className="pl-user" onClick={()=>setShowProfile(true)}>
              <div className="pl-ava" style={{ background:rc,color:rt,overflow:"hidden" }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover",borderRadius:"50%" }} />
                  : initials}
              </div>
              <div style={{ minWidth:0,flex:1 }}>
                <div className="pl-uname">{uname}</div>
                <div className="pl-urole">
                  <span style={{ width:6,height:6,borderRadius:"50%",background:rc,display:"inline-block" }} />
                  {user?.role}
                </div>
              </div>
              <span style={{ color:"#444",fontSize:12,flexShrink:0 }}>⚙</span>
            </button>
            <button onClick={logout}
              style={{ width:"100%",marginTop:8,padding:"9px",background:"transparent",border:"1px solid rgba(255,255,255,.08)",borderRadius:10,color:"#555",fontFamily:"var(--font-body)",fontSize:12,cursor:"pointer" }}
              onMouseOver={e=>{e.currentTarget.style.color="#888";e.currentTarget.style.background="rgba(255,255,255,.05)";}}
              onMouseOut={e=>{e.currentTarget.style.color="#555";e.currentTarget.style.background="transparent";}}>
              {t("signOut")}
            </button>
          </div>
        </aside>

        {/* MAIN */}
        <div className="pl-main">
          <header className="pl-topbar">
            <div>
              <div className="pl-ptitle">{current?.label||portalLabel}</div>
              <div className="pl-psub">{new Date().toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric",year:"numeric"})}</div>
            </div>
            <div className="pl-topbar-r">
              {topbarActions}
              <LanguageSwitcher />

              {/* Bell */}
              <div style={{ position:"relative" }}>
                <button onClick={()=>setShowNotif(o=>!o)}
                  style={{ width:36,height:36,borderRadius:10,background:showNotif?"#f0f0f0":"#f0f0ec",border:"1.5px solid #e5e5e5",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer",fontSize:16,position:"relative" }}>
                  🔔
                  {unreadCount>0&&<span style={{ position:"absolute",top:-4,right:-4,background:"#dc2626",color:"#fff",borderRadius:20,fontSize:9,fontWeight:800,padding:"1px 5px",border:"2px solid #fff",minWidth:16,textAlign:"center" }}>{unreadCount>9?"9+":unreadCount}</span>}
                </button>

                {showNotif && (
                  <>
                    <div onClick={()=>setShowNotif(false)} style={{ position:"fixed",inset:0,zIndex:499 }} />
                    <div className="notif-pop">
                      <div className="notif-head">
                        <div>
                          <div style={{ fontWeight:800,fontSize:14 }}>{t("notificationsTitle")}</div>
                          {unreadCount>0&&<div style={{ fontSize:11,color:"#aaa",marginTop:2 }}>{unreadCount} {t("unread")}</div>}
                        </div>
                        <div style={{ display:"flex",gap:8 }}>
                          {unreadCount>0&&<button onClick={onMarkAllRead} style={{ fontSize:11,color:"#f5b800",fontWeight:700,background:"#fff8e1",border:"none",cursor:"pointer",fontFamily:"var(--font-body)",padding:"4px 8px",borderRadius:6 }}>{t("markAllRead")}</button>}
                          <button onClick={()=>setShowNotif(false)} style={{ width:28,height:28,borderRadius:8,background:"#f0f0ec",border:"none",cursor:"pointer",fontSize:14,color:"#888",display:"flex",alignItems:"center",justifyContent:"center" }}>✕</button>
                        </div>
                      </div>
                      <div className="notif-list">
                        {notifications.length===0?(
                          <div style={{ padding:"40px 20px",textAlign:"center",color:"#ccc" }}><div style={{ fontSize:32,marginBottom:8 }}>🔔</div><div style={{ fontSize:13 }}>{t("noNotifsYet")}</div></div>
                        ):(
                          notifications.slice(0,20).map(n=>{
                            const ic=NTYPE[n.type]||NTYPE.SHIFT_ALERT;
                            return(
                              <div key={n._id} className={`notif-row${!n.read?" unread":""}`} onClick={()=>{if(!n.read)onMarkRead?.(n._id);}}>
                                <div className="notif-ico" style={{ background:ic.bg,color:ic.cl }}>{ic.ch}</div>
                                <div style={{ flex:1,minWidth:0 }}>
                                  <div style={{ fontSize:13,fontWeight:700,color:"#1a1a1a" }}>{n.title}</div>
                                  <div style={{ fontSize:12,color:"#888",lineHeight:1.5,marginTop:2 }}>{n.message}</div>
                                  <div style={{ fontSize:11,color:"#ccc",marginTop:4 }}>{ago(n.createdAt)}</div>
                                </div>
                                {!n.read&&<div className="notif-dot"/>}
                              </div>
                            );
                          })
                        )}
                      </div>
                      {notifications.length>0&&(
                        <div style={{ padding:"10px 18px",borderTop:"1px solid #f0f0f0",textAlign:"center" }}>
                          <button onClick={()=>{setView?.("notifications");setShowNotif(false);}} style={{ fontSize:12,color:"#888",background:"none",border:"none",cursor:"pointer",fontFamily:"var(--font-body)" }}>{t("viewAllNotifs")}</button>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Avatar */}
              <button onClick={()=>setShowProfile(true)}
                style={{ width:36,height:36,borderRadius:"50%",background:rc,border:"2px solid #e5e5e5",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,color:rt,cursor:"pointer",flexShrink:0,overflow:"hidden",padding:0 }}>
                {user?.avatar
                  ? <img src={user.avatar} alt="" style={{ width:"100%",height:"100%",objectFit:"cover" }} />
                  : initials}
              </button>
            </div>
          </header>

          <div className="pl-content">{children}</div>
        </div>
      </div>

      {showProfile && <ProfileCard onClose={() => setShowProfile(false)} />}
    </>
  );
}