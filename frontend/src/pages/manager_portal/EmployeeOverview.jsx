import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const AVAIL_KEY = { "Full-Time":"fullTimeLabel", "Part-Time":"partTimeLabel", "On-Call":"onCallLabel" };

export default function EmployeeOverview() {
  const { t } = useLanguage();
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    api.get("/users/employees")
      .then((res) => setEmployees(res.data.employees || []))
      .catch(() => setEmployees([
        { id:"1", name:"Maria Garcia",   position:"Waitstaff",     availability:"Full-Time", noShows:0, coveragePercent:95, totalSwapRequests:1, lastAttendance:"Oct 19, 2025" },
        { id:"2", name:"Kevin Chen",     position:"Dishwasher",    availability:"Full-Time", noShows:5, coveragePercent:85, totalSwapRequests:2, lastAttendance:"Oct 17, 2025" },
        { id:"3", name:"Sarah T.",       position:"Kitchen Staff", availability:"Part-Time", noShows:6, coveragePercent:50, totalSwapRequests:0, lastAttendance:"Oct 15, 2025" },
        { id:"4", name:"John M.",        position:"Bartender",     availability:"Full-Time", noShows:0, coveragePercent:95, totalSwapRequests:3, lastAttendance:"Oct 19, 2025" },
        { id:"5", name:"Terry Young",    position:"Dishwasher",    availability:"Full-Time", noShows:1, coveragePercent:90, totalSwapRequests:2, lastAttendance:"Oct 17, 2025" },
      ]))
      .finally(() => setLoading(false));
  }, []);

  const exportCSV = () => {
    const headers = [t("name"), t("positionLabel"), t("availabilityLabel2"), t("coveragePctLabel"), t("noShowsLabel"), t("swapRequestsLabel"), t("lastAttendanceLabel")];
    const rows = employees.map((e) => {
      const name = e.name || `${e.firstName||""} ${e.lastName||""}`.trim();
      const att = e.lastAttendance ? (typeof e.lastAttendance==="string" && !e.lastAttendance.includes("T") ? e.lastAttendance : new Date(e.lastAttendance).toLocaleDateString()) : t("naLabel");
      return [name, e.position, e.availability, `${e.coveragePercent||0}%`, e.noShows||0, e.totalSwapRequests||0, att];
    });
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = "employees.csv"; a.click();
  };

  const tAvail = (v) => v ? (t(AVAIL_KEY[v]) || v) : v;

  if (loading) return <div className="su-page text-center text-muted" style={{ padding:60 }}>{t("loading")}</div>;

  return (
    <div className="su-page">
      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="su-title" style={{ margin:0 }}>{t("employeeOverviewTitle2")}</div>
        <button className="su-btn su-btn-outline su-btn-sm" onClick={exportCSV}>{t("exportEmployees")}</button>
      </div>

      {employees.length === 0 ? (
        <div className="su-card text-center text-muted" style={{ padding:40 }}>{t("noEmployees")}</div>
      ) : (
        <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill, minmax(300px,1fr))", gap:16 }}>
          {employees.map((emp) => {
            const id   = emp._id || emp.id;
            const name = emp.name || `${emp.firstName||""} ${emp.lastName||""}`.trim();
            const isSel = selected === id;
            const att = emp.lastAttendance
              ? (typeof emp.lastAttendance==="string" && !emp.lastAttendance.includes("T")
                  ? emp.lastAttendance
                  : new Date(emp.lastAttendance).toLocaleDateString(undefined, { month:"short", day:"numeric", year:"numeric" }))
              : t("naLabel");

            return (
              <div key={id}
                style={{ background:"#fff", borderRadius:14, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.05)", border:`2px solid ${isSel?"#f5b800":"transparent"}`, transition:"border-color .2s, transform .2s", cursor:"pointer", transform:isSel?"translateY(-2px)":"none" }}
                onClick={() => setSelected(isSel ? null : id)}>
                <div className="text-xs font-bold text-muted mb-3" style={{ letterSpacing:1 }}>{t("employeeLabel2")}</div>
                {[
                  ["👤", `${t("employeeName")} ${name}`],
                  ["💼", `${t("roleLabel2")} ${emp.position}`],
                  ["🌿", `${t("availabilityLabel")} ${tAvail(emp.availability)}`],
                ].map(([icon, text]) => (
                  <div key={icon} className="flex gap-2 mb-2 text-sm"><span>{icon}</span><span>{text}</span></div>
                ))}

                <div style={{ borderTop:"1px solid #f5f5f5", paddingTop:12, marginTop:8 }}>
                  <div className="flex gap-2 mb-2 text-sm">
                    <span>📊</span>
                    <span>{t("shiftCoverageLabel")} <strong style={{ color: (emp.coveragePercent||0)>=80?"#16a34a":(emp.coveragePercent||0)>=60?"#f5b800":"#dc2626" }}>{emp.coveragePercent||0}%</strong></span>
                  </div>
                  <div className="flex gap-2 mb-2 text-sm">
                    <span>🚫</span>
                    <span>{t("noShowsLabel")} <span className={`su-badge ${(emp.noShows||0)>0?"su-badge-red":"su-badge-green"}`}>{emp.noShows||0}</span></span>
                  </div>
                  <div className="flex gap-2 mb-2 text-sm">
                    <span>🔄</span>
                    <span>{t("swapRequestsLabel")} {emp.totalSwapRequests||0}</span>
                  </div>
                </div>
                <div className="text-xs text-muted mt-2">{t("lastAttendanceLabel")} {att}</div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}