import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import "../../App.css";

const todayStr     = new Date().toISOString().split("T")[0];
const firstOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  .toISOString().split("T")[0];

export default function StaffReport() {
  const [from,    setFrom]    = useState(firstOfMonth);
  const [to,      setTo]      = useState(todayStr);
  const [report,  setReport]  = useState(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const generate = useCallback(async (f, t) => {
    setLoading(true); setError(""); setReport(null);
    try {
      const res = await api.get(`/attendance/report?from=${f}&to=${t}`);
      setReport(res.data);
    } catch (err) {
      const msg = err.response?.data?.message || err.message || "Failed to load report.";
      setError(msg);
    } finally { setLoading(false); }
  }, []);

  // Auto-load on mount with current month
  useEffect(() => { generate(firstOfMonth, todayStr); }, [generate]);

  const handleGenerate = () => generate(from, to);

  const applyPreset = (label) => {
    const now = new Date();
    let f, t = todayStr;
    switch (label) {
      case "Last 7 Days": {
        const d = new Date(now); d.setDate(now.getDate()-7);
        f = d.toISOString().split("T")[0]; break;
      }
      case "This Week": {
        const m = new Date(now); m.setDate(now.getDate()-((now.getDay()+6)%7));
        f = m.toISOString().split("T")[0]; break;
      }
      case "This Month":
        f = firstOfMonth; break;
      case "Last Month": {
        const lm = new Date(now.getFullYear(), now.getMonth()-1, 1);
        const le = new Date(now.getFullYear(), now.getMonth(), 0);
        f = lm.toISOString().split("T")[0];
        t = le.toISOString().split("T")[0]; break;
      }
      default: f = firstOfMonth;
    }
    setFrom(f); setTo(t);
    generate(f, t);
  };

  const exportCSV = () => {
    if (!report?.report?.length) return;
    const headers = ["Employee","Position","Attendance Days","Hours","Est. Cost (CAD)","No-Shows","Swaps"];
    const rows = report.report.map(r => [
      `"${r.employee.name}"`, `"${r.employee.position||""}"`,
      r.shifts, r.hours, r.cost, r.noShows, r.swapRequests,
    ]);
    rows.push(["TOTAL","","", report.totals.hours, report.totals.cost, report.totals.noShows, ""]);
    const csv  = [headers,...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a");
    a.href=url; a.download=`staff_report_${from}_${to}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const fmtDate = (d) => new Date(d+"T12:00:00").toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"});

  const inputStyle = {
    padding:"10px 14px", border:"1.5px solid #e5e5e5",
    borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none",
  };

  // Calculated totals
  const totalShifts = report?.report?.reduce((a,r)=>a+r.shifts,0) || 0;
  const noShowRate  = totalShifts>0
    ? `${Math.round((report.totals.noShows/totalShifts)*100)}%` : "0%";

  return (
    <div className="su-page">

      {/* Header */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 }}>
        <div>
          <div className="su-title" style={{ marginBottom:4 }}>STAFF REPORTS</div>
          <div style={{ fontSize:14, color:"#888" }}>
            Attendance history and payroll summary for your team
          </div>
        </div>
        {report?.report?.length > 0 && (
          <button onClick={exportCSV} style={{ padding:"10px 20px", background:"#1a1a1a", color:"#f5b800", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
            📥 Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <div style={{ background:"#fff", borderRadius:16, padding:"20px 24px", marginBottom:24, boxShadow:"0 2px 12px rgba(0,0,0,.06)", border:"1px solid #f0f0f0" }}>
        <div style={{ display:"flex", gap:12, alignItems:"flex-end", flexWrap:"wrap", marginBottom:14 }}>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#888", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>From</label>
            <input type="date" value={from} onChange={e=>setFrom(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={{ fontSize:11, fontWeight:700, color:"#888", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>To</label>
            <input type="date" value={to} onChange={e=>setTo(e.target.value)} style={inputStyle} />
          </div>
          <button onClick={handleGenerate} disabled={loading}
            style={{ padding:"11px 28px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:"pointer", opacity:loading?.7:1 }}>
            {loading ? "Loading…" : "Generate"}
          </button>
        </div>

        {/* Presets */}
        <div style={{ display:"flex", gap:8, flexWrap:"wrap", alignItems:"center" }}>
          <span style={{ fontSize:11, color:"#aaa", fontWeight:600 }}>Quick:</span>
          {["Last 7 Days","This Week","This Month","Last Month"].map(p => (
            <button key={p} onClick={()=>applyPreset(p)}
              style={{ padding:"6px 14px", background:"#f0f0ec", border:"none", borderRadius:8, fontFamily:"var(--font-body)", fontSize:12, fontWeight:600, color:"#555", cursor:"pointer" }}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Error */}
      {error && (
        <div style={{ padding:"14px 18px", background:"#fee2e2", borderRadius:12, color:"#dc2626", fontSize:13, marginBottom:20, lineHeight:1.6 }}>
          <div style={{ fontWeight:700, marginBottom:4 }}>⚠️ Could not load report</div>
          <div>{error}</div>
          <div style={{ marginTop:8, fontSize:12, opacity:.8 }}>
            Make sure <code>backend/utils/getMyEmployees.js</code> exists and attendance route is in <code>server.js</code>.
          </div>
        </div>
      )}

      {/* Loading */}
      {loading && (
        <div style={{ textAlign:"center", padding:60, color:"#aaa" }}>
          <div style={{ width:36, height:36, border:"3px solid #f5b800", borderTopColor:"transparent", borderRadius:"50%", animation:"spin .8s linear infinite", margin:"0 auto 16px" }} />
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
          Generating report…
        </div>
      )}

      {/* Report output */}
      {report && !loading && (
        <>
          {/* Summary cards */}
          <div style={{ display:"flex", gap:12, marginBottom:24, flexWrap:"wrap" }}>
            {[
              { label:"Employees",    value: report.report.length,                          color:"#f5b800" },
              { label:"Total Hours",  value: `${report.totals.hours}h`,                     color:"#38bdf8" },
              { label:"Est. Payroll", value: `$${report.totals.cost.toLocaleString()} CAD`, color:"#22c55e" },
              { label:"No-Shows",     value: report.totals.noShows,                         color: report.totals.noShows>0?"#dc2626":"#888" },
              { label:"No-Show Rate", value: noShowRate,                                    color:"#f59e0b" },
            ].map(s => (
              <div key={s.label} style={{ background:"#1a1a1a", borderRadius:14, padding:"14px 18px", flex:1, minWidth:120 }}>
                <div style={{ color:s.color, fontWeight:900, fontSize:22 }}>{s.value}</div>
                <div style={{ color:"#666", fontSize:10, marginTop:3, textTransform:"uppercase", letterSpacing:.5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Info note when no attendance recorded */}
          {report.report.length > 0 && report.totals.hours === 0 && (
            <div style={{ background:"#fff8e1", border:"1px solid #ffe082", borderRadius:12, padding:"12px 18px", marginBottom:20, fontSize:13, color:"#92400e" }}>
              💡 No attendance has been marked for this period. Go to <strong>Employee Overview</strong> to mark attendance for today's shifts.
            </div>
          )}

          {/* Table */}
          <div style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.06)", border:"1px solid #f0f0f0", marginBottom:24 }}>
            <div style={{ padding:"14px 20px", borderBottom:"1px solid #f0f0f0", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
              <div style={{ fontWeight:800, fontSize:15 }}>
                {fmtDate(from)} – {fmtDate(to)}
              </div>
              <div style={{ fontSize:13, color:"#888" }}>
                {report.report.length} employee{report.report.length!==1?"s":""}
              </div>
            </div>

            {report.report.length === 0 ? (
              <div style={{ textAlign:"center", padding:56, color:"#aaa" }}>
                <div style={{ fontSize:40, marginBottom:12 }}>👥</div>
                <div style={{ fontWeight:700, marginBottom:4 }}>No employees registered yet</div>
                <div style={{ fontSize:13 }}>Add employees from the <strong>Register Staff</strong> tab first.</div>
              </div>
            ) : (
              <table style={{ width:"100%", borderCollapse:"collapse" }}>
                <thead>
                  <tr style={{ background:"#f9f9f7" }}>
                    {["Employee","Position","Days Worked","Hours","Est. Cost","No-Shows","Swaps"].map(h=>(
                      <th key={h} style={{ padding:"10px 16px", textAlign:"left", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, borderBottom:"1px solid #f0f0f0" }}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {report.report.map((row, i) => {
                    const ini = row.employee.name.split(" ").map(n=>n[0]||"").join("").toUpperCase().slice(0,2);
                    const hasRecords = row.shifts > 0;
                    return (
                      <tr key={i} style={{ background:i%2===0?"#fff":"#fafaf8", borderBottom:"1px solid #f0f0f0" }}>
                        <td style={{ padding:"12px 16px" }}>
                          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                            <div style={{ width:34, height:34, borderRadius:"50%", background:"#4f46e5", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:12, flexShrink:0 }}>
                              {ini}
                            </div>
                            <span style={{ fontWeight:700, fontSize:14 }}>{row.employee.name}</span>
                          </div>
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:"#888" }}>
                          {row.employee.position || "—"}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          {hasRecords
                            ? <span style={{ background:"#dbeafe", color:"#1d4ed8", padding:"3px 10px", borderRadius:20, fontWeight:700, fontSize:12 }}>{row.shifts} days</span>
                            : <span style={{ color:"#ccc", fontSize:12 }}>No records</span>}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:600, color:hasRecords?"#1a1a1a":"#ccc" }}>
                          {hasRecords ? `${row.hours}h` : "—"}
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, fontWeight:700, color:hasRecords?"#16a34a":"#ccc" }}>
                          {hasRecords ? `$${row.cost.toLocaleString()}` : "—"}
                        </td>
                        <td style={{ padding:"12px 16px" }}>
                          <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:row.noShows>0?"#fee2e2":"#f0f0f0", color:row.noShows>0?"#dc2626":"#888" }}>
                            {row.noShows}
                          </span>
                        </td>
                        <td style={{ padding:"12px 16px", fontSize:13, color:"#555" }}>
                          {row.swapRequests}
                        </td>
                      </tr>
                    );
                  })}

                  {/* Totals row */}
                  <tr style={{ background:"#1a1a1a" }}>
                    <td colSpan={2} style={{ padding:"13px 16px", fontWeight:800, fontSize:14, color:"#f5b800" }}>
                      TOTAL
                    </td>
                    <td style={{ padding:"13px 16px", fontSize:13, color:"#aaa" }}>
                      {totalShifts} days
                    </td>
                    <td style={{ padding:"13px 16px", fontWeight:800, fontSize:14, color:"#fff" }}>
                      {report.totals.hours}h
                    </td>
                    <td style={{ padding:"13px 16px", fontWeight:800, fontSize:14, color:"#22c55e" }}>
                      ${report.totals.cost.toLocaleString()}
                    </td>
                    <td style={{ padding:"13px 16px", fontWeight:800, fontSize:14, color:report.totals.noShows>0?"#f87171":"#fff" }}>
                      {report.totals.noShows}
                    </td>
                    <td style={{ padding:"13px 16px", color:"#aaa" }}>—</td>
                  </tr>
                </tbody>
              </table>
            )}
          </div>

          {/* Metrics */}
          {report.report.length > 0 && (
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:16 }}>
              <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 10px rgba(0,0,0,.05)", border:"1px solid #f0f0f0" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>📊 Efficiency</div>
                {[
                  ["Total Attendance Days", totalShifts],
                  ["Avg Hours / Employee",  report.report.length>0?`${Math.round(report.totals.hours/report.report.length)}h`:"—"],
                  ["Avg Cost / Employee",   report.report.length>0?`$${Math.round(report.totals.cost/report.report.length)}`:"—"],
                ].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}>
                    <span style={{ color:"#888" }}>{l}</span>
                    <span style={{ fontWeight:700, color:"#1a1a1a" }}>{v}</span>
                  </div>
                ))}
              </div>
              <div style={{ background:"#fff", borderRadius:14, padding:"18px 20px", boxShadow:"0 2px 10px rgba(0,0,0,.05)", border:"1px solid #f0f0f0" }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:14 }}>📈 Reliability</div>
                {[
                  ["No-Show Rate",           noShowRate],
                  ["Total Swap Requests",    report.report.reduce((a,r)=>a+r.swapRequests,0)],
                  ["Est. Total Payroll",     `$${report.totals.cost.toLocaleString()} CAD`],
                ].map(([l,v])=>(
                  <div key={l} style={{ display:"flex", justifyContent:"space-between", marginBottom:8, fontSize:13 }}>
                    <span style={{ color:"#888" }}>{l}</span>
                    <span style={{ fontWeight:700, color:"#1a1a1a" }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}