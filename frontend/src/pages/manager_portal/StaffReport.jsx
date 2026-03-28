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
      // Demo fallback data
      setReport({
        report: [
          { employee: { name: "Maria Garcia", position: "Waitstaff" }, hours: 120, cost: 1200, noShows: 0, swapRequests: 1 },
          { employee: { name: "Kevin Chen",   position: "Dishwasher"  }, hours: 80,  cost: 800,  noShows: 5, swapRequests: 2 },
          { employee: { name: "Sarah T.",     position: "Kitchen Staff" }, hours: 100, cost: 1000, noShows: 6, swapRequests: 0 },
          { employee: { name: "John M.",      position: "Bartender"    }, hours: 80,  cost: 800,  noShows: 0, swapRequests: 3 },
        ],
        totals: { hours: 380, cost: 3800 },
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su-page">
      <div className="su-title">REPORTS & ANALYTICS</div>

      {/* Date Filter */}
      <div className="su-card mb-4">
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className="su-label" style={{ marginBottom: 0 }}>DATE RANGE: FROM:</span>
          <input className="su-input" type="date" style={{ width: "auto" }} value={from} onChange={(e) => setFrom(e.target.value)} />
          <span className="su-label" style={{ marginBottom: 0 }}>TO:</span>
          <input className="su-input" type="date" style={{ width: "auto" }} value={to} onChange={(e) => setTo(e.target.value)} />
          <button className="su-btn su-btn-green su-btn-sm" onClick={generateReport} disabled={loading}>
            {loading ? <span className="spinner" /> : "GENERATE"}
          </button>
        </div>

        {report && (
          <table className="su-tbl">
            <thead>
              <tr>
                <th>Employee</th>
                <th>Position</th>
                <th>Hours</th>
                <th>Cost</th>
                <th>No-Shows</th>
                <th>Swap Requests</th>
              </tr>
            </thead>
            <tbody>
              {report.report.map((row, i) => (
                <tr key={i}>
                  <td className="text-sm font-bold">{row.employee.name}</td>
                  <td className="text-sm text-muted">{row.employee.position}</td>
                  <td className="text-sm">{row.hours} hrs</td>
                  <td className="text-sm" style={{ color: "#16a34a" }}>${row.cost.toLocaleString()}</td>
                  <td className="text-sm">
                    <span className={`su-badge ${row.noShows > 0 ? "su-badge-red" : "su-badge-green"}`}>{row.noShows}</span>
                  </td>
                  <td className="text-sm">{row.swapRequests}</td>
                </tr>
              ))}
              <tr style={{ borderTop: "2px solid #e0e0e0" }}>
                <td className="font-bold text-sm" colSpan={2}>Total</td>
                <td className="font-bold text-sm">{report.totals.hours} hrs</td>
                <td className="font-bold text-sm" style={{ color: "#16a34a" }}>${report.totals.cost.toLocaleString()}</td>
                <td></td><td></td>
              </tr>
            </tbody>
          </table>
        )}
      </div>

      {report && (
        <div className="su-g2 mb-4">
          <div style={{ background: "#f9f9f7", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "#888", marginBottom: 10 }}>
              📊 Staffing Efficiency
            </div>
            {["Average Capacity: 85%", "Peak Hours Coverage: 95%", "Swap Requests: 5 approved, 1 rejected"].map((m) => (
              <div key={m} className="text-sm mb-2" style={{ color: "#555" }}>• {m}</div>
            ))}
          </div>
          <div style={{ background: "#f9f9f7", borderRadius: 10, padding: 16 }}>
            <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".5px", color: "#888", marginBottom: 10 }}>
              📈 Reliability Metrics
            </div>
            {["No-Shows This Month: 1", "Avg Swap Requests/Employee: 1.2", "Employee Attendance: 95%"].map((m) => (
              <div key={m} className="text-sm mb-2" style={{ color: "#555" }}>• {m}</div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <button className="su-btn su-btn-green su-btn-sm su-btn-pill" onClick={() => alert("CSV export – connect to backend /api/reports/export")}>EXPORT CSV</button>
        <button className="su-btn su-btn-green su-btn-sm su-btn-pill" onClick={() => alert("PDF export – connect to backend /api/reports/export")}>EXPORT PDF</button>
      </div>
    </div>
  );
}