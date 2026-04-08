import React, { useState, useEffect } from "react";
import { useLanguage } from "../../context/LanguageContext";
import api from "../../api";
import "../../App.css";

const S_COLOR = { present:"#16a34a", late:"#f59e0b", "no-show":"#dc2626", absent:"#dc2626" };
const S_BG    = { present:"#dcfce7", late:"#fff8e1", "no-show":"#fee2e2", absent:"#fee2e2" };

export default function EmployeeOverview() {
  const { t } = useLanguage();  const [tab,          setTab]          = useState("mark");
  const [summaries,    setSummaries]    = useState([]);
  const [shifts,       setShifts]       = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [loading,      setLoading]      = useState(true);
  const [marking,      setMarking]      = useState(null);
  const [success,      setSuccess]      = useState("");
  const [selected,     setSelected]     = useState(null);

  useEffect(() => { fetchAll(); }, []);
  useEffect(() => { fetchShifts(selectedDate); }, [selectedDate]);

  const fetchAll = async () => {
    setLoading(true);
    try { const res = await api.get("/attendance/summary"); setSummaries(res.data.summaries||[]); }
    catch (err) { console.error(err.message); }
    finally { setLoading(false); }
  };

  const fetchShifts = async (date) => {
    try { const res = await api.get(`/shifts/week?start=${date}&end=${date}`); setShifts(res.data.shifts||[]); }
    catch { setShifts([]); }
  };

  const markAttendance = async (shift, status) => {
    setMarking(shift._id); setSuccess("");
    try {
      await api.post("/attendance", {
        employeeId: shift.employee?._id||shift.employee,
        shiftId:    shift._id,
        date:       selectedDate,
        status,
        clockIn:    status!=="no-show" ? shift.startTime : null,
        clockOut:   status!=="no-show" ? shift.endTime   : null,
      });
      const name = shift.employee?.name||`${shift.employee?.firstName||""} ${shift.employee?.lastName||""}`.trim();
      setSuccess(`✅ ${t("attendanceMarked")}: ${name} — ${status}`);
      setTimeout(()=>setSuccess(""), 3000);
      fetchShifts(selectedDate); fetchAll();
    } catch (err) { alert(err.response?.data?.message||t("error")); }
    finally { setMarking(null); }
  };

  const exportCSV = () => {
    const h = ["Employee","Position",t("present"),t("late"),"No-Shows","Coverage%","Hours","Swaps","Last Attendance"];
    const r = summaries.map(e=>[`"${e.name}"`,`"${e.position||""}"`,e.present,e.late,e.noShows,`${e.coveragePercent}%`,`${e.totalHours}h`,e.totalSwapRequests,e.lastAttendance?new Date(e.lastAttendance).toLocaleDateString():"—"]);
    const csv  = [h,...r].map(row=>row.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href=url; a.download="employee_overview.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  // ── Mark Attendance Tab ─────────────────────────────────────────────────
  const MarkTab = () => (
    <div>
      <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",marginBottom:20,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",alignItems:"center",gap:16,flexWrap:"wrap"}}>
          <div>
            <label style={{fontSize:11,fontWeight:700,color:"#888",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{t("selectDate")}</label>
            <input type="date" value={selectedDate} onChange={e=>setSelectedDate(e.target.value)}
              style={{padding:"10px 14px",border:"1.5px solid #e5e5e5",borderRadius:10,fontFamily:"var(--font-body)",fontSize:14,outline:"none"}}/>
          </div>
          <div style={{display:"flex",gap:8,alignSelf:"flex-end"}}>
            {[{l:t("today"),d:0},{l:t("yesterday"),d:1}].map(({l,d})=>{
              const dt=new Date(); dt.setDate(dt.getDate()-d);
              const str=dt.toISOString().split("T")[0];
              return (
                <button key={l} onClick={()=>setSelectedDate(str)}
                  style={{padding:"10px 16px",background:selectedDate===str?"#f5b800":"#f0f0ec",color:selectedDate===str?"#1a1a1a":"#555",border:"none",borderRadius:10,fontFamily:"var(--font-body)",fontWeight:700,fontSize:13,cursor:"pointer"}}>
                  {l}
                </button>
              );
            })}
          </div>
          {success && <div style={{padding:"10px 16px",background:"#dcfce7",borderRadius:10,color:"#16a34a",fontWeight:700,fontSize:13}}>{success}</div>}
        </div>
      </div>

      {shifts.length===0
        ? <div style={{background:"#fff",borderRadius:16,padding:56,textAlign:"center",color:"#aaa",border:"2px dashed #e5e5e5"}}>
            <div style={{fontSize:40,marginBottom:12}}>📅</div>
            <div style={{fontWeight:700,fontSize:16,marginBottom:6}}>{t("noShiftsForDate")}</div>
            <div style={{fontSize:13}}>{t("schedule")}</div>
          </div>
        : <div style={{display:"flex",flexDirection:"column",gap:12}}>
            {shifts.map(s=>{
              const name=s.employee?.name||`${s.employee?.firstName||""} ${s.employee?.lastName||""}`.trim()||t("noData");
              const ini=name.split(" ").map(n=>n[0]||"").join("").toUpperCase().slice(0,2);
              const isLoad=marking===s._id;
              return (
                <div key={s._id} style={{background:"#fff",borderRadius:16,padding:"18px 22px",boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:"1px solid #f0f0f0"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:12}}>
                    <div style={{display:"flex",alignItems:"center",gap:14}}>
                      <div style={{width:44,height:44,borderRadius:"50%",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:16,flexShrink:0}}>{ini}</div>
                      <div>
                        <div style={{fontWeight:800,fontSize:15}}>{name}</div>
                        <div style={{fontSize:13,color:"#888",marginTop:2}}>
                          {s.startTime} – {s.endTime}
                          {s.role&&<span style={{marginLeft:8,background:"#f0f0ec",padding:"2px 10px",borderRadius:20,fontSize:11,fontWeight:600}}>{s.role}</span>}
                        </div>
                      </div>
                    </div>
                    <div style={{display:"flex",gap:8}}>
                      {["present","late","no-show"].map(status=>(
                        <button key={status} onClick={()=>markAttendance(s,status)} disabled={isLoad}
                          style={{padding:"10px 16px",border:`2px solid ${S_COLOR[status]}`,background:"transparent",color:S_COLOR[status],borderRadius:10,cursor:"pointer",fontFamily:"var(--font-body)",fontSize:12,fontWeight:700,opacity:isLoad?.6:1}}
                          onMouseOver={e=>{e.currentTarget.style.background=S_BG[status];}}
                          onMouseOut={e=>{e.currentTarget.style.background="transparent";}}>
                          {isLoad?"…":status==="present"?`✅ ${t("present")}`:status==="late"?`⏰ ${t("late")}`:`❌ ${t("noShowLabel")}`}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
      }

      {/* Compact history below */}
      {summaries.length>0 && (
        <div style={{marginTop:28}}>
          <div style={{fontFamily:"var(--font-head)",fontSize:20,marginBottom:14}}>{t("attendanceHistory")}</div>
          <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))",gap:14}}>
            {summaries.map(emp=>{
              const ini=`${emp.firstName?.[0]||""}${emp.lastName?.[0]||""}`.toUpperCase();
              const cc=emp.coveragePercent>=80?"#16a34a":emp.coveragePercent>=60?"#f59e0b":"#dc2626";
              return (
                <div key={emp._id} style={{background:"#fff",borderRadius:14,padding:"16px 18px",border:"1px solid #f0f0f0",boxShadow:"0 2px 10px rgba(0,0,0,.05)"}}>
                  <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:12}}>
                    <div style={{width:36,height:36,borderRadius:"50%",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:13}}>{ini}</div>
                    <div style={{flex:1}}><div style={{fontWeight:700,fontSize:14}}>{emp.name}</div><div style={{fontSize:11,color:"#aaa"}}>{emp.position}</div></div>
                    <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:18,color:cc}}>{emp.coveragePercent}%</div><div style={{fontSize:10,color:"#aaa"}}>{t("coveragePercent")}</div></div>
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:6}}>
                    {[{l:t("present"),v:emp.present,c:"#16a34a"},{l:t("late"),v:emp.late,c:"#f59e0b"},{l:t("noShowLabel"),v:emp.noShows,c:emp.noShows>0?"#dc2626":"#888"}].map(s=>(
                      <div key={s.l} style={{textAlign:"center",background:"#f9f9f7",borderRadius:8,padding:"8px 4px"}}>
                        <div style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</div>
                        <div style={{fontSize:9,color:"#aaa",textTransform:"uppercase"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                  {emp.lastAttendance&&<div style={{fontSize:11,color:"#aaa",marginTop:8}}>{t("lastSeen")}: {new Date(emp.lastAttendance).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}</div>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );

  // ── Overview Tab ────────────────────────────────────────────────────────
  const OverviewTab = () => (
    <div>
      {loading
        ? <div style={{textAlign:"center",padding:60,color:"#aaa"}}>{t("loading")}</div>
        : summaries.length===0
          ? <div style={{textAlign:"center",padding:60,background:"#fff",borderRadius:16,border:"2px dashed #e5e5e5",color:"#aaa"}}><div style={{fontSize:40,marginBottom:10}}>👥</div><div style={{fontWeight:700}}>{t("noData")}</div></div>
          : <>
              {/* Stats */}
              <div style={{display:"flex",gap:10,marginBottom:20,flexWrap:"wrap"}}>
                {[
                  {l:t("staffList"),         v:summaries.length,                                                                                 c:"#f5b800"},
                  {l:t("coveragePercent"),   v:`${summaries.length>0?Math.round(summaries.reduce((a,e)=>a+e.coveragePercent,0)/summaries.length):0}%`,c:"#22c55e"},
                  {l:t("noShowLabel"),       v:summaries.reduce((a,e)=>a+e.noShows,0),                                                          c:"#dc2626"},
                  {l:t("totalHours"),        v:`${summaries.reduce((a,e)=>a+e.totalHours,0)}h`,                                                 c:"#38bdf8"},
                ].map(s=>(
                  <div key={s.l} style={{background:"#1a1a1a",borderRadius:12,padding:"12px 18px",flex:1,minWidth:110}}>
                    <div style={{color:s.c,fontWeight:800,fontSize:20}}>{s.v}</div>
                    <div style={{color:"#666",fontSize:10,marginTop:2,textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div>
                  </div>
                ))}
              </div>

              {/* Cards */}
              <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:16}}>
                {summaries.map(emp=>{
                  const ini=`${emp.firstName?.[0]||""}${emp.lastName?.[0]||""}`.toUpperCase();
                  const cc=emp.coveragePercent>=80?"#16a34a":emp.coveragePercent>=60?"#f59e0b":"#dc2626";
                  const isSel=selected===emp._id;
                  const last=emp.lastAttendance?new Date(emp.lastAttendance).toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"}):`${t("noData")}`;
                  return (
                    <div key={emp._id} onClick={()=>setSelected(isSel?null:emp._id)}
                      style={{background:"#fff",borderRadius:16,padding:"18px 20px",boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`2px solid ${isSel?"#f5b800":"#f0f0f0"}`,cursor:"pointer",transition:"border-color .2s"}}>
                      <div style={{display:"flex",alignItems:"center",gap:12,marginBottom:14}}>
                        <div style={{width:44,height:44,borderRadius:"50%",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:900,fontSize:16,flexShrink:0}}>{ini}</div>
                        <div style={{flex:1}}><div style={{fontWeight:800,fontSize:15}}>{emp.name}</div><div style={{fontSize:12,color:"#aaa"}}>{emp.position} · {emp.availability}</div></div>
                        <div style={{textAlign:"right"}}><div style={{fontWeight:900,fontSize:20,color:cc}}>{emp.coveragePercent}%</div><div style={{fontSize:10,color:"#aaa"}}>{t("coveragePercent")}</div></div>
                      </div>
                      <div style={{height:6,background:"#f0f0f0",borderRadius:3,overflow:"hidden",marginBottom:12}}>
                        <div style={{height:"100%",width:`${emp.coveragePercent}%`,background:cc,borderRadius:3}}/>
                      </div>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:8,marginBottom:12}}>
                        {[{l:t("present"),v:emp.present,c:"#16a34a"},{l:t("late"),v:emp.late,c:"#f59e0b"},{l:t("noShowLabel"),v:emp.noShows,c:emp.noShows>0?"#dc2626":"#888"}].map(s=>(
                          <div key={s.l} style={{textAlign:"center",background:"#f9f9f7",borderRadius:8,padding:"8px 4px"}}>
                            <div style={{fontWeight:800,fontSize:18,color:s.c}}>{s.v}</div>
                            <div style={{fontSize:9,color:"#aaa",textTransform:"uppercase"}}>{s.l}</div>
                          </div>
                        ))}
                      </div>
                      <div style={{fontSize:12,color:"#888",lineHeight:1.8}}>
                        <div>📅 {t("totalAttendanceDays")}: <strong style={{color:"#1a1a1a"}}>{emp.totalShifts}</strong></div>
                        <div>⏱ {t("totalHours")}: <strong style={{color:"#1a1a1a"}}>{emp.totalHours}h</strong></div>
                        <div>🔄 {t("shiftSwap")}: <strong style={{color:"#1a1a1a"}}>{emp.totalSwapRequests}</strong></div>
                        <div>🕐 {t("lastSeen")}: <strong style={{color:"#1a1a1a"}}>{last}</strong></div>
                      </div>
                      {isSel&&emp.recentRecords?.length>0&&(
                        <div style={{marginTop:14,paddingTop:14,borderTop:"1px solid #f0f0f0"}}>
                          <div style={{fontSize:11,fontWeight:700,color:"#aaa",textTransform:"uppercase",marginBottom:8}}>{t("attendanceHistory")}</div>
                          {emp.recentRecords.map((r,i)=>(
                            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:6}}>
                              <span style={{fontSize:12,color:"#555"}}>{new Date(r.date).toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"})}</span>
                              <div style={{display:"flex",alignItems:"center",gap:6}}>
                                {r.clockIn&&<span style={{fontSize:11,color:"#aaa"}}>{r.clockIn}–{r.clockOut}</span>}
                                <span style={{padding:"2px 8px",borderRadius:20,fontSize:10,fontWeight:700,background:S_BG[r.status]||"#f0f0f0",color:S_COLOR[r.status]||"#888"}}>{r.status}</span>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
      }
    </div>
  );

  return (
    <div className="su-page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <div className="su-title" style={{marginBottom:4}}>{t("employeeOverview")}</div>
          <div style={{fontSize:14,color:"#888"}}>{t("markAttendance")} · {t("teamOverview")}</div>
        </div>
        <div style={{display:"flex",gap:10}}>
          <button onClick={fetchAll} style={{padding:"9px 16px",background:"#f0f0ec",border:"none",borderRadius:8,fontFamily:"var(--font-body)",fontWeight:600,fontSize:13,color:"#555",cursor:"pointer"}}>🔄 {t("filter")}</button>
          {tab==="overview"&&summaries.length>0&&<button onClick={exportCSV} style={{padding:"9px 16px",background:"#1a1a1a",color:"#f5b800",border:"none",borderRadius:8,fontFamily:"var(--font-body)",fontWeight:700,fontSize:13,cursor:"pointer"}}>📥 {t("exportCSV")}</button>}
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:4,background:"#f0f0ec",borderRadius:12,padding:4,marginBottom:24,width:"fit-content"}}>
        {[{key:"mark",label:`✅ ${t("markAttendance")}`},{key:"overview",label:`📊 ${t("teamOverview")}`}].map(tb=>(
          <button key={tb.key} onClick={()=>setTab(tb.key)} style={{padding:"10px 22px",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"var(--font-body)",fontSize:13,fontWeight:tab===tb.key?800:600,background:tab===tb.key?"#fff":"transparent",color:tab===tb.key?"#1a1a1a":"#888",boxShadow:tab===tb.key?"0 2px 8px rgba(0,0,0,.08)":"none"}}>
            {tb.label}
          </button>
        ))}
      </div>

      {tab==="mark" ? <MarkTab/> : <OverviewTab/>}
    </div>
  );
}