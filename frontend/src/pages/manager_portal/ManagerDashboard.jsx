import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

/* ── Helpers ─────────────────────────────────────────────────── */
const COLORS  = ["#4f46e5","#0891b2","#16a34a","#f59e0b","#dc2626","#8b5cf6","#0d9488","#ea580c"];
const clr     = (i) => COLORS[i % COLORS.length];
const initials= (s="") => s.split(" ").map(w=>w[0]||"").join("").toUpperCase().slice(0,2)||"?";
const fmt12   = (t) => { if(!t) return "—"; const [h,m]=t.split(":").map(Number); const ap=h>=12?"PM":"AM"; return `${h%12||12}:${String(m||0).padStart(2,"0")} ${ap}`; };
const greet   = () => { const h=new Date().getHours(); return h<12?"Good morning":h<17?"Good afternoon":"Good evening"; };
const fmtDate = (d) => new Date(d).toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"});

/* ── Sub-components ──────────────────────────────────────────── */
function Card({ title, right, children, accent="#f5b800", style={} }) {
  return (
    <div style={{ background:"#fff", borderRadius:16, overflow:"hidden", border:"1px solid #ebebeb", boxShadow:"0 1px 6px rgba(0,0,0,.04)", ...style }}>
      <div style={{ padding:"14px 20px", borderBottom:"1px solid #f5f5f5", display:"flex", alignItems:"center", justifyContent:"space-between" }}>
        <div style={{ display:"flex", alignItems:"center", gap:8 }}>
          <div style={{ width:3, height:16, borderRadius:2, background:accent }} />
          <span style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.8 }}>{title}</span>
        </div>
        {right && <div style={{ fontSize:12, color:"#ccc" }}>{right}</div>}
      </div>
      <div>{children}</div>
    </div>
  );
}

function EmptyState({ text }) {
  return (
    <div style={{ padding:"40px 20px", textAlign:"center" }}>
      <div style={{ fontSize:13, color:"#ccc", fontWeight:500 }}>{text}</div>
    </div>
  );
}

function StatCard({ label, value, sub, color, onClick, trend }) {
  return (
    <div onClick={onClick}
      style={{ background:"#fff", border:"1px solid #ebebeb", borderRadius:16, padding:"20px", cursor:onClick?"pointer":"default", boxShadow:"0 1px 6px rgba(0,0,0,.04)", transition:"all .2s", position:"relative", overflow:"hidden" }}
      onMouseOver={e=>{ if(onClick){ e.currentTarget.style.borderColor=color; e.currentTarget.style.boxShadow=`0 4px 20px ${color}20`; }}}
      onMouseOut={e=>{ e.currentTarget.style.borderColor="#ebebeb"; e.currentTarget.style.boxShadow="0 1px 6px rgba(0,0,0,.04)"; }}>
      {/* Color strip */}
      <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:color, borderRadius:"16px 16px 0 0" }} />
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:14, marginTop:4 }}>
        {onClick && <span style={{ fontSize:11, color:color, fontWeight:700, background:`${color}10`, padding:"3px 8px", borderRadius:20 }}>View →</span>}
        {trend !== undefined && <span style={{ fontSize:11, color:trend>=0?"#16a34a":"#dc2626", fontWeight:700 }}>{trend>=0?"↑":"↓"} {Math.abs(trend)}%</span>}
      </div>
      <div style={{ fontSize:32, fontWeight:900, color:"#1a1a1a", lineHeight:1, marginBottom:4 }}>{value}</div>
      <div style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:2 }}>{label}</div>
      {sub && <div style={{ fontSize:11, color:"#ccc", marginTop:2 }}>{sub}</div>}
    </div>
  );
}

/* ── Main Component ──────────────────────────────────────────── */
export default function ManagerDashboard({ user, onGoToSwaps }) {
  const { t }     = useLanguage();
  const [data,    setData]    = useState(null);
  const [loading, setLoading] = useState(true);
  const [tab,     setTab]     = useState("today"); // "today" | "week"

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    try { const r=await api.get("/dashboard"); setData(r.data); }
    catch { setData({ todayShifts:[], pendingSwaps:[], weeklyHours:[], alerts:[], stats:{} }); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchDashboard(); }, [fetchDashboard]);

  if (loading) return (
    <div style={{ display:"flex", alignItems:"center", justifyContent:"center", height:"70vh", flexDirection:"column", gap:16 }}>
      <div style={{ width:36, height:36, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite" }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <span style={{ color:"#aaa", fontSize:13 }}>Loading dashboard…</span>
    </div>
  );

  const fname    = user?.firstName || user?.name?.split(" ")[0] || "there";
  const totalHrs = data?.weeklyHours?.reduce((a,w)=>a+(w.hours||0),0)||0;
  const totalCost= data?.weeklyHours?.reduce((a,w)=>a+(w.cost||0),0)||0;
  const maxHrs   = Math.max(...(data?.weeklyHours||[]).map(w=>w.hours||0),1);
  const pendCnt  = data?.pendingSwaps?.length||0;
  const todayCnt = data?.todayShifts?.length||0;
  const empCnt   = data?.stats?.employeeCount||data?.weeklyHours?.length||0;
  const alertCnt = data?.alerts?.length||0;

  const today = new Date().toLocaleDateString("en-CA",{weekday:"long",month:"long",day:"numeric",year:"numeric"});

  return (
    <div className="su-page">

      {/* ── Welcome banner ── */}
      <div style={{ background:"linear-gradient(135deg,#1a1a1a 0%,#2d2d2d 100%)", borderRadius:18, padding:"24px 28px", marginBottom:24, display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
        <div>
          <div style={{ fontSize:20, fontWeight:800, color:"#fff", marginBottom:4 }}>
            {greet()}, {fname}
          </div>
          <div style={{ fontSize:13, color:"#666" }}>{today}</div>
        </div>
        <div style={{ display:"flex", gap:10 }}>
          {pendCnt > 0 && (
            <button onClick={onGoToSwaps}
              style={{ display:"flex", alignItems:"center", gap:8, padding:"10px 18px", background:"#dc2626", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:700, fontSize:13, color:"#fff", cursor:"pointer" }}>
              {pendCnt} Pending Swap{pendCnt!==1?"s":""}
            </button>
          )}
          <button onClick={fetchDashboard}
            style={{ padding:"10px 16px", background:"rgba(255,255,255,.08)", border:"1px solid rgba(255,255,255,.12)", borderRadius:10, fontFamily:"var(--font-body)", fontSize:13, fontWeight:600, color:"#888", cursor:"pointer", transition:"all .2s" }}
            onMouseOver={e=>{e.currentTarget.style.color="#fff";e.currentTarget.style.borderColor="rgba(255,255,255,.25)";}}
            onMouseOut={e=>{e.currentTarget.style.color="#888";e.currentTarget.style.borderColor="rgba(255,255,255,.12)";}}>
            ↺ Refresh
          </button>
        </div>
      </div>

      {/* ── Stat cards ── */}
      <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 }}>
        <StatCard label="Team Members"    value={empCnt}      sub="active employees"          color="#4f46e5" />
        <StatCard label="Today's Shifts"  value={todayCnt}    sub={new Date().toLocaleDateString("en-CA",{weekday:"short",month:"short",day:"numeric"})} color="#0891b2" />
        <StatCard label="Weekly Hours"    value={`${totalHrs}h`} sub={`$${totalCost.toLocaleString()} est.`} color="#16a34a" />
        <StatCard label="Pending Swaps"   value={pendCnt}     sub={pendCnt>0?"needs review":"all clear"}    color={pendCnt>0?"#dc2626":"#16a34a"} onClick={pendCnt>0?onGoToSwaps:null} />
      </div>

      {/* ── Main grid — 3 col ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:20, marginBottom:20 }}>

        {/* Today's coverage — 2 cols wide */}
        <div style={{ gridColumn:"span 2" }}>
          <Card title={t("todayCoverage")} right={`${todayCnt} shift${todayCnt!==1?"s":""}`} accent="#0891b2">
            {todayCnt===0 ? (
              <EmptyState text="No shifts scheduled today" />
            ) : (
              <div style={{ maxHeight:320, overflowY:"auto" }}>
                {(data?.todayShifts||[]).map((s,i)=>{
                  const name=s.employee?.name||`${s.employee?.firstName||""} ${s.employee?.lastName||""}`.trim()||"Unknown";
                  return(
                    <div key={s._id||i} style={{ display:"flex", alignItems:"center", gap:14, padding:"13px 20px", borderBottom:"1px solid #f9f9f7", transition:"background .12s" }}
                      onMouseOver={e=>e.currentTarget.style.background="#fafafa"}
                      onMouseOut={e=>e.currentTarget.style.background="#fff"}>
                      <div style={{ width:38,height:38,borderRadius:"50%",background:clr(i),color:"#fff",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:13,flexShrink:0 }}>{initials(name)}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:14,color:"#1a1a1a",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</div>
                        <div style={{ fontSize:12,color:"#aaa",marginTop:2 }}>{s.role||s.area||s.position||"Staff"}</div>
                      </div>
                      <div style={{ textAlign:"right",flexShrink:0 }}>
                        <div style={{ fontSize:12,fontWeight:700,color:"#555" }}>{fmt12(s.startTime)} – {fmt12(s.endTime)}</div>
                        <span style={{ display:"inline-block",marginTop:4,padding:"2px 10px",borderRadius:20,background:"#f0fdf4",color:"#16a34a",fontSize:11,fontWeight:700 }}>On shift</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* Pending swaps */}
        <Card title="Pending Swaps" right={pendCnt>0?<span style={{ background:"#fee2e2",color:"#dc2626",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:800 }}>{pendCnt}</span>:null} accent="#dc2626">
          {pendCnt===0 ? (
            <EmptyState text="No pending swaps" />
          ) : (
            <>
              <div style={{ maxHeight:220, overflowY:"auto" }}>
                {(data?.pendingSwaps||[]).map((r,i)=>{
                  const name=r.requester?.name||`${r.requester?.firstName||""} ${r.requester?.lastName||""}`.trim()||"Unknown";
                  return(
                    <div key={r._id||i} style={{ display:"flex",alignItems:"center",gap:12,padding:"11px 20px",borderBottom:"1px solid #f9f9f7" }}>
                      <div style={{ width:32,height:32,borderRadius:"50%",background:"#fff8e1",color:"#f59e0b",display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:12,flexShrink:0 }}>{name?.[0]||"?"}</div>
                      <div style={{ flex:1,minWidth:0 }}>
                        <div style={{ fontWeight:700,fontSize:13,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap" }}>{name}</div>
                        <div style={{ fontSize:11,color:"#aaa",marginTop:1 }}>{r.shiftDate||"Shift swap"}</div>
                      </div>
                      <span style={{ padding:"3px 10px",borderRadius:20,background:"#fff8e1",color:"#f59e0b",fontSize:11,fontWeight:700,flexShrink:0 }}>Pending</span>
                    </div>
                  );
                })}
              </div>
              <div style={{ padding:"12px 20px",borderTop:"1px solid #f5f5f5" }}>
                <button onClick={onGoToSwaps}
                  style={{ width:"100%",padding:"10px",background:"#1a1a1a",color:"#f5b800",border:"none",borderRadius:10,fontFamily:"var(--font-body)",fontWeight:800,fontSize:13,cursor:"pointer",transition:"opacity .15s" }}
                  onMouseOver={e=>e.currentTarget.style.opacity=".85"}
                  onMouseOut={e=>e.currentTarget.style.opacity="1"}>
                  Review All →
                </button>
              </div>
            </>
          )}
        </Card>
      </div>

      {/* ── Bottom grid ── */}
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 }}>

        {/* Weekly hours */}
        <Card title={t("weeklyHours")} right={<span style={{ color:"#16a34a",fontWeight:700 }}>${totalCost.toLocaleString()} est.</span>} accent="#16a34a">
          {(data?.weeklyHours||[]).length===0 ? (
            <EmptyState text="No hours this week" />
          ) : (
            (data?.weeklyHours||[]).map((w,i)=>{
              const name=w.name||`${w.firstName||""} ${w.lastName||""}`.trim();
              const pct=Math.round(((w.hours||0)/maxHrs)*100);
              const bar=clr(i);
              return(
                <div key={i} style={{ padding:"14px 20px",borderBottom:"1px solid #f9f9f7" }}>
                  <div style={{ display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:8 }}>
                    <div style={{ display:"flex",alignItems:"center",gap:9 }}>
                      <div style={{ width:28,height:28,borderRadius:"50%",background:`${bar}15`,color:bar,display:"flex",alignItems:"center",justifyContent:"center",fontWeight:800,fontSize:11 }}>{initials(name)}</div>
                      <span style={{ fontSize:13,fontWeight:600,color:"#1a1a1a" }}>{name}</span>
                    </div>
                    <div style={{ display:"flex",gap:12,alignItems:"center" }}>
                      <span style={{ fontSize:13,color:"#555",fontWeight:600 }}>{w.hours||0}h</span>
                      <span style={{ fontSize:12,color:"#16a34a",fontWeight:700,minWidth:40,textAlign:"right" }}>${w.cost||0}</span>
                    </div>
                  </div>
                  <div style={{ height:5,background:"#f0f0f0",borderRadius:3,overflow:"hidden" }}>
                    <div style={{ height:"100%",width:`${pct}%`,background:bar,borderRadius:3,transition:"width .5s ease" }} />
                  </div>
                </div>
              );
            })
          )}
          {totalHrs > 0 && (
            <div style={{ padding:"12px 20px",borderTop:"1px solid #f5f5f5",display:"flex",justifyContent:"space-between",fontSize:13 }}>
              <span style={{ color:"#aaa" }}>Total</span>
              <span style={{ fontWeight:800,color:"#1a1a1a" }}>{totalHrs}h · ${totalCost.toLocaleString()}</span>
            </div>
          )}
        </Card>

        {/* Alerts + quick actions */}
        <div style={{ display:"flex",flexDirection:"column",gap:20 }}>

          {/* Alerts */}
          <Card title={t("shiftAlerts")} right={alertCnt>0?<span style={{ background:"#fff8e1",color:"#f59e0b",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:800 }}>{alertCnt}</span>:null} accent="#f59e0b" style={{ flex:1 }}>
            {alertCnt===0 ? (
              <EmptyState text="No active alerts" />
            ) : (
              (data?.alerts||[]).map((a,i)=>(
                <div key={i} style={{ display:"flex",gap:12,alignItems:"flex-start",padding:"12px 20px",borderBottom:"1px solid #f9f9f7" }}>
                  <div style={{ width:24,height:24,borderRadius:"50%",background:"#fff8e1",display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0 }}>
                    <span style={{ fontSize:11,color:"#f59e0b",fontWeight:800 }}>!</span>
                  </div>
                  <span style={{ fontSize:13,color:"#555",lineHeight:1.5 }}>{a.text}</span>
                </div>
              ))
            )}
          </Card>

          {/* Quick actions */}
          <div style={{ background:"#1a1a1a",borderRadius:16,padding:"20px",border:"1px solid #2a2a2a" }}>
            <div style={{ fontSize:12,fontWeight:700,color:"#666",textTransform:"uppercase",letterSpacing:.8,marginBottom:14 }}>Quick Actions</div>
            <div style={{ display:"grid",gridTemplateColumns:"1fr 1fr",gap:10 }}>
              {[
                { label:"Schedule",   view:"managerSchedule" },
                { label:"Reports",    view:"staffReport"     },
                { label:"Employees",  view:"employeeOverview"},
                { label:"Register",   view:"registerStaff"   },
              ].map(a=>(
                <button key={a.view}
                  style={{ display:"flex",flexDirection:"column",alignItems:"center",gap:6,padding:"14px 10px",background:"rgba(255,255,255,.04)",border:"1px solid rgba(255,255,255,.08)",borderRadius:12,cursor:"pointer",fontFamily:"var(--font-body)",fontSize:12,fontWeight:600,color:"#888",transition:"all .2s" }}
                  onMouseOver={e=>{e.currentTarget.style.background="rgba(245,184,0,.1)";e.currentTarget.style.borderColor="rgba(245,184,0,.2)";e.currentTarget.style.color="#f5b800";}}
                  onMouseOut={e=>{e.currentTarget.style.background="rgba(255,255,255,.04)";e.currentTarget.style.borderColor="rgba(255,255,255,.08)";e.currentTarget.style.color="#888";}}>
                  {a.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}