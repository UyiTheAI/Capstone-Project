import React, { useState } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

export default function StaffReport() {
  const { t } = useLanguage();
  const [from, setFrom] = useState("2025-09-01");
  const [to, setTo]     = useState("2025-10-31");
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/users/reports/weekly?from=${from}&to=${to}`);
      setReport(res.data);
    } catch {
      setReport({
        report: [
          { employee:{ name:"Maria Garcia", position:"Waitstaff" },  hours:120, cost:1200, noShows:0, swapRequests:1 },
          { employee:{ name:"Kevin Chen",   position:"Dishwasher" }, hours:80,  cost:800,  noShows:5, swapRequests:2 },
          { employee:{ name:"Sarah T.",     position:"Kitchen Staff" }, hours:100, cost:1000, noShows:6, swapRequests:0 },
          { employee:{ name:"John M.",      position:"Bartender" },   hours:80,  cost:800,  noShows:0, swapRequests:3 },
        ],
        totals:{ hours:380, cost:3800 },
      });
    } finally { setLoading(false); }
  };

  const exportCSV = () => {
    if (!report) return;
    const headers = [t("name"), t("positionLabel"), t("hours"), t("cost"), t("noShows"), t("swapRequests")];
    const rows = report.report.map((row) => [row.employee.name, row.employee.position, row.hours, row.cost, row.noShows, row.swapRequests]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type:"text/csv" }));
    a.download = "staff_report.csv"; a.click();
  };

  return (
    <div className="su-page">
      <div className="su-title">{t("reportsTitle")}</div>

      <div className="su-card mb-4">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className="su-label" style={{ marginBottom:0 }}>{t("dateRangeFrom")}</span>
          <input className="su-input" type="date" style={{ width:"auto" }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="su-label" style={{ marginBottom:0 }}>{t("dateRangeTo")}</span>
          <input className="su-input" type="date" style={{ width:"auto" }} value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="su-btn su-btn-green su-btn-sm" onClick={generateReport} disabled={loading}>
            {loading ? <span className="spinner" /> : t("generateBtn")}
          </button>
        </div>

        {report && (
          <table className="su-tbl">
            <thead>
              <tr>
                <th>{t("name")}</th>
                <th>{t("positionLabel")}</th>
                <th>{t("hours")}</th>
                <th>{t("cost")}</th>
                <th>{t("noShows")}</th>
                <th>{t("swapRequests")}</th>
              </tr>
            </thead>
            <tbody>
              {report.report.map((row, i) => (
                <tr key={i}>
                  <td className="text-sm font-bold">{row.employee.name}</td>
                  <td className="text-sm text-muted">{row.employee.position}</td>
                  <td className="text-sm">{row.hours} {t("hrsUnit")}</td>
                  <td className="text-sm" style={{ color:"#16a34a" }}>${row.cost.toLocaleString()}</td>
                  <td className="text-sm"><span className={`su-badge ${row.noShows>0?"su-badge-red":"su-badge-green"}`}>{row.noShows}</span></td>
                  <td className="text-sm">{row.swapRequests}</td>
                </tr>
              ))}
              <tr style={{ borderTop:"2px solid #e0e0e0" }}>
                <td className="font-bold text-sm" colSpan={2}>{t("totalLabel")}</td>
                <td className="font-bold text-sm">{report.totals.hours} {t("hrsUnit")}</td>
                <td className="font-bold text-sm" style={{ color:"#16a34a" }}>${report.totals.cost.toLocaleString()}</td>
                <td></td><td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      <div className="flex gap-3 flex-wrap">
        <button className="su-btn su-btn-green su-btn-sm" onClick={exportCSV}>{t("exportCSV")}</button>
        <button className="su-btn su-btn-green su-btn-sm" onClick={() => window.print()}>{t("exportPDF")}</button>
      </div>
    </div>
  );
}