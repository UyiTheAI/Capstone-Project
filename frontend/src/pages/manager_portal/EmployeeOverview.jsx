import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import { useLanguage } from "../../context/LanguageContext";
import "../../App.css";

const todayStr     = new Date().toISOString().split("T")[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split("T")[0];

export default function StaffReport() {
  const { t } = useLanguage();
  const [from,    setFrom]    = useState(firstOfMonth);
  const [to,      setTo]      = useState(todayStr);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const generate = useCallback(async (f, t_) => {
    setLoading(true); setError(""); setReport(null);
    try { const res = await api.get(`/attendance/report?from=${f}&to=${t_}`); setReport(res.data); }
    catch (err) { setError(err.response?.data?.message || err.message || t("error")); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { generate(firstOfMonth, todayStr); }, [generate]);

  const handleGenerate = () => generate(from, to);

  const applyPreset = (label) => {
    const now = new Date(); let f, t_ = todayStr;
    if      (label==="7d")   { const d=new Date(now); d.setDate(now.getDate()-7); f=d.toISOString().split("T")[0]; }
    else if (label==="week") { const m=new Date(now); m.setDate(now.getDate()-((now.getDay()+6)%7)); f=m.toISOString().split("T")[0]; }
    else if (label==="month"){ f=firstOfMonth; }
    else if (label==="last") { const lm=new Date(now.getFullYear(),now.getMonth()-1,1); const le=new Date(now.getFullYear(),now.getMonth(),0); f=lm.toISOString().split("T")[0]; t_=le.toISOString().split("T")[0]; }
    setFrom(f); setTo(t_); generate(f, t_);
  };

  const exportCSV = () => {
    if (!report?.report?.length) return;
    const h = ["Employee","Position","Days","Hours","Cost","No-Shows","Swaps"];
    const r = report.report.map(row=>[`"${row.employee.name}"`,`"${row.employee.position||""}"`,row.shifts,row.hours,row.cost,row.noShows,row.swapRequests]);
    r.push(["TOTAL","","",report.totals.hours,report.totals.cost,report.totals.noShows,""]);
    const csv=([h,...r]).map(row=>row.join(",")).join("\n");
    const blob=new Blob([csv],{type:"text/csv"});
    const url=URL.createObjectURL(blob);
    const a=document.createElement("a"); a.href=url; a.download=`staff_report_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const inp = { padding:"10px 14px", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none" };
  const fmtDate = d => new Date(d+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"});
  const totalDays  = report?.report?.reduce((a,r)=>a+r.shifts,0)||0;
  const noShowRate = totalDays>0?`${Math.round((report.totals.noShows/totalDays)*100)}%`:"0%";

  return (
    <div className="su-page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24,flexWrap:"wrap",gap:12}}>
        <div>
          <div className="su-title" style={{marginBottom:4}}>{t("staffReportsTitle")}</div>
          <div style={{fontSize:14,color:"#888"}}>{t("staffReports")}</div>
        </div>
        {report?.report?.length>0&&<button onClick={exportCSV} style={{padding:"10px 20px",background:"#1a1a1a",color:"#f5b800",border:"none",borderRadius:10,fontFamily:"var(--font-body)",fontWeight:700,fontSize:13,cursor:"pointer"}}>📥 {t("exportCSV")}</button>}
      </div>

      {/* Filters */}
      <div style={{background:"#fff",borderRadius:16,padding:"20px 24px",marginBottom:24,boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:"1px solid #f0f0f0"}}>
        <div style={{display:"flex",gap:12,alignItems:"flex-end",flexWrap:"wrap",marginBottom:14}}>
          <div><label style={{fontSize:11,fontWeight:700,color:"#888",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{t("from")}</label><input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inp}/></div>
          <div><label style={{fontSize:11,fontWeight:700,color:"#888",display:"block",marginBottom:6,textTransform:"uppercase",letterSpacing:.5}}>{t("to")}</label><input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inp}/></div>
          <button onClick={handleGenerate} disabled={loading} style={{padding:"11px 28px",background:"#f5b800",color:"#1a1a1a",border:"none",borderRadius:10,fontFamily:"var(--font-body)",fontWeight:800,fontSize:14,cursor:"pointer",opacity:loading?.7:1}}>{loading?t("loading"):t("generateReport")}</button>
        </div>
        <div style={{display:"flex",gap:8,flexWrap:"wrap",alignItems:"center"}}>
          <span style={{fontSize:11,color:"#aaa",fontWeight:600}}>{t("filter")}:</span>
          {[{key:"7d",label:t("lastSevenDays")},{key:"week",label:t("thisWeek")},{key:"month",label:t("thisMonth")},{key:"last",label:t("lastMonth")}].map(p=>(
            <button key={p.key} onClick={()=>applyPreset(p.key)} style={{padding:"6px 14px",background:"#f0f0ec",border:"none",borderRadius:8,fontFamily:"var(--font-body)",fontSize:12,fontWeight:600,color:"#555",cursor:"pointer"}}>{p.label}</button>
          ))}
        </div>
      </div>

      {error&&<div style={{padding:"14px 18px",background:"#fee2e2",borderRadius:12,color:"#dc2626",fontSize:13,marginBottom:20}}>⚠️ {error}</div>}
      {loading&&<div style={{textAlign:"center",padding:60,color:"#aaa"}}><div style={{fontSize:32,marginBottom:10}}>📊</div>{t("loading")}</div>}

      {report&&!loading&&(
        <>
          {/* Summary cards */}
          <div style={{display:"flex",gap:12,marginBottom:24,flexWrap:"wrap"}}>
            {[
              {l:t("employeeOverview"), v:report.report.length,                         c:"#f5b800"},
              {l:t("totalHours"),       v:`${report.totals.hours}h`,                    c:"#38bdf8"},
              {l:t("estPayroll"),       v:`$${report.totals.cost.toLocaleString()} CAD`,c:"#22c55e"},
              {l:t("noShowRate"),       v:noShowRate,                                   c:"#f59e0b"},
              {l:t("noShowLabel"),      v:report.totals.noShows,                        c:report.totals.noShows>0?"#dc2626":"#888"},
            ].map(s=>(
              <div key={s.l} style={{background:"#1a1a1a",borderRadius:14,padding:"14px 18px",flex:1,minWidth:120}}>
                <div style={{color:s.c,fontWeight:900,fontSize:22}}>{s.v}</div>
                <div style={{color:"#666",fontSize:10,marginTop:3,textTransform:"uppercase",letterSpacing:.5}}>{s.l}</div>
              </div>
            ))}
          </div>

          {/* Tip note */}
          {report.report.length>0&&report.totals.hours===0&&(
            <div style={{background:"#fff8e1",border:"1px solid #ffe082",borderRadius:12,padding:"12px 18px",marginBottom:20,fontSize:13,color:"#92400e"}}>
              💡 {t("noAttendanceNote")}
            </div>
          )}

          {/* Table */}
          <div style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:"1px solid #f0f0f0",marginBottom:24}}>
            <div style={{padding:"14px 20px",borderBottom:"1px solid #f0f0f0",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div style={{fontWeight:800,fontSize:15}}>{fmtDate(from)} – {fmtDate(to)}</div>
              <div style={{fontSize:13,color:"#888"}}>{report.report.length} {t("staffList")}</div>
            </div>

            {report.report.length===0
              ? <div style={{textAlign:"center",padding:56,color:"#aaa"}}><div style={{fontSize:40,marginBottom:12}}>👥</div><div style={{fontWeight:700}}>{t("noStaffYet")}</div></div>
              : <table style={{width:"100%",borderCollapse:"collapse"}}>
                  <thead>
                    <tr style={{background:"#f9f9f7"}}>
                      {[t("firstName")+" "+t("lastName"),t("position"),t("daysWorked"),t("totalHours"),t("estCost"),t("noShowLabel"),t("shiftSwap")].map(h=>(
                        <th key={h} style={{padding:"10px 16px",textAlign:"left",fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:.5,borderBottom:"1px solid #f0f0f0"}}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {report.report.map((row,i)=>{
                      const ini=row.employee.name.split(" ").map(n=>n[0]||"").join("").toUpperCase().slice(0,2);
                      const has=row.shifts>0;
                      return (
                        <tr key={i} style={{background:i%2===0?"#fff":"#fafaf8",borderBottom:"1px solid #f0f0f0"}}>
                          <td style={{padding:"12px 16px"}}><div style={{display:"flex",alignItems:"center",gap:10}}><div style={{width:34,height:34,borderRadius:"50%",background:"#4f46e5",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontWeight:800,fontSize:12,flexShrink:0}}>{ini}</div><span style={{fontWeight:700,fontSize:14}}>{row.employee.name}</span></div></td>
                          <td style={{padding:"12px 16px",fontSize:13,color:"#888"}}>{row.employee.position||"—"}</td>
                          <td style={{padding:"12px 16px"}}>{has?<span style={{background:"#dbeafe",color:"#1d4ed8",padding:"3px 10px",borderRadius:20,fontWeight:700,fontSize:12}}>{row.shifts}</span>:<span style={{color:"#ccc",fontSize:12}}>{t("noRecords")}</span>}</td>
                          <td style={{padding:"12px 16px",fontSize:13,fontWeight:600,color:has?"#1a1a1a":"#ccc"}}>{has?`${row.hours}h`:"—"}</td>
                          <td style={{padding:"12px 16px",fontSize:13,fontWeight:700,color:has?"#16a34a":"#ccc"}}>{has?`$${row.cost.toLocaleString()}`:"—"}</td>
                          <td style={{padding:"12px 16px"}}><span style={{padding:"3px 10px",borderRadius:20,fontSize:11,fontWeight:700,background:row.noShows>0?"#fee2e2":"#f0f0f0",color:row.noShows>0?"#dc2626":"#888"}}>{row.noShows}</span></td>
                          <td style={{padding:"12px 16px",fontSize:13,color:"#555"}}>{row.swapRequests}</td>
                        </tr>
                      );
                    })}
                    <tr style={{background:"#1a1a1a"}}>
                      <td colSpan={2} style={{padding:"13px 16px",fontWeight:800,fontSize:14,color:"#f5b800"}}>{t("all").toUpperCase()}</td>
                      <td style={{padding:"13px 16px",fontSize:13,color:"#aaa"}}>{totalDays}</td>
                      <td style={{padding:"13px 16px",fontWeight:800,fontSize:14,color:"#fff"}}>{report.totals.hours}h</td>
                      <td style={{padding:"13px 16px",fontWeight:800,fontSize:14,color:"#22c55e"}}>${report.totals.cost.toLocaleString()}</td>
                      <td style={{padding:"13px 16px",fontWeight:800,fontSize:14,color:report.totals.noShows>0?"#f87171":"#fff"}}>{report.totals.noShows}</td>
                      <td style={{padding:"13px 16px",color:"#aaa"}}>—</td>
                    </tr>
                  </tbody>
                </table>
            }
          </div>

          {/* Metrics */}
          {report.report.length>0&&(
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>
              {[
                {title:"📊 "+t("staffReportsTitle"),items:[[t("daysWorked"),totalDays],[t("avgHours"),report.report.length>0?`${Math.round(report.totals.hours/report.report.length)}h`:"—"],[t("estCost")+" / emp",report.report.length>0?`$${Math.round(report.totals.cost/report.report.length)}`:"—"]]},
                {title:"📈 "+t("availability"),       items:[[t("noShowRate"),noShowRate],[t("shiftSwap"),report.report.reduce((a,r)=>a+r.swapRequests,0)],[t("estPayroll"),`$${report.totals.cost.toLocaleString()} CAD`]]},
              ].map(block=>(
                <div key={block.title} style={{background:"#fff",borderRadius:14,padding:"18px 20px",boxShadow:"0 2px 10px rgba(0,0,0,.05)",border:"1px solid #f0f0f0"}}>
                  <div style={{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:.5,marginBottom:14}}>{block.title}</div>
                  {block.items.map(([l,v])=>(
                    <div key={l} style={{display:"flex",justifyContent:"space-between",marginBottom:8,fontSize:13}}>
                      <span style={{color:"#888"}}>{l}</span><span style={{fontWeight:700,color:"#1a1a1a"}}>{v}</span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}