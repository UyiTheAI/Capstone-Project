import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../context/LanguageContext";

export default function EmployeeOverview() {
  const [employees, setEmployees] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get("/users/employees");
      setEmployees(res.data.employees || []);
    } catch {
      // Demo fallback
      setEmployees([
        { id: "1", name: "Maria Garcia", position: "Waitstaff",     availability: "Full-Time", noShows: 0, coveragePercent: 95, totalSwapRequests: 1, lastAttendance: "Oct 19, 2025" },
        { id: "2", name: "Kevin Chen",   position: "Dishwasher",    availability: "Full-Time", noShows: 5, coveragePercent: 85, totalSwapRequests: 2, lastAttendance: "Oct 17, 2025" },
        { id: "3", name: "Sarah T.",     position: "Kitchen Staff", availability: "Part-Time", noShows: 6, coveragePercent: 50, totalSwapRequests: 0, lastAttendance: "Oct 15, 2025" },
        { id: "4", name: "John M.",      position: "Bartender",     availability: "Full-Time", noShows: 0, coveragePercent: 95, totalSwapRequests: 3, lastAttendance: "Oct 19, 2025" },
        { id: "5", name: "Terry Young",  position: "Dishwasher",    availability: "Full-Time", noShows: 1, coveragePercent: 90, totalSwapRequests: 2, lastAttendance: "Oct 17, 2025" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const exportCSV = () => {
    const headers = ["Name", "Position", "Availability", "Coverage%", "No-Shows", "Swap Requests", "Last Attendance"];
    const rows = employees.map((e) => [
      e.name || `${e.firstName} ${e.lastName}`,
      e.position, e.availability,
      e.coveragePercent, e.noShows,
      e.totalSwapRequests,
      e.lastAttendance || (e.lastAttendance ? new Date(e.lastAttendance).toLocaleDateString() : "N/A"),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "employees.csv"; a.click();
  };

  return (
    <div className="su-page">
      <div className="su-title">EMPLOYEE OVERVIEW</div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding: 40 }}>Loading employees…</div>
      ) : (
        <div className="su-g3 mb-4">
          {employees.map((emp) => {
            const name = emp.name || `${emp.firstName} ${emp.lastName}`;
            const isSel = selected === (emp.id || emp._id);
            const lastAtt = emp.lastAttendance
              ? typeof emp.lastAttendance === "string"
                ? emp.lastAttendance
                : new Date(emp.lastAttendance).toLocaleDateString("en", { month: "short", day: "numeric", year: "numeric" })
              : "N/A";

            return (
              <div
                key={emp.id || emp._id}
                onClick={() => setSelected(isSel ? null : (emp.id || emp._id))}
                style={{
                  background: "#fff", borderRadius: 14, padding: 18,
                  boxShadow: "0 2px 8px rgba(0,0,0,.05)",
                  border: `2px solid ${isSel ? "#3b82f6" : "transparent"}`,
                  transition: "border-color .2s, transform .2s",
                  cursor: "pointer",
                  transform: isSel ? "translateY(-2px)" : "none",
                }}
              >
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: ".8px", color: "#888", marginBottom: 10 }}>
                  👤 EMPLOYEE
                </div>
                {[
                  ["👤", `Employee: ${name}`],
                  ["💼", `Role: ${emp.position}`],
                  ["🌿", `Availability: ${emp.availability}`],
                ].map(([icon, text]) => (
                  <div key={icon} className="flex gap-2 mb-2 text-sm" style={{ alignItems: "center" }}>
                    <span style={{ width: 18, textAlign: "center" }}>{icon}</span><span>{text}</span>
                  </div>
                ))}

                <div style={{ margin: "10px 0 8px", borderTop: "1px solid #f0f0f0", paddingTop: 8 }}>
                  <div className="flex gap-2 mb-2 text-sm items-center">
                    <span style={{ width: 18, textAlign: "center" }}>📊</span>
                    <span>Shift Coverage: </span>
                    <span style={{ fontWeight: 700, color: emp.coveragePercent >= 80 ? "#16a34a" : emp.coveragePercent >= 60 ? "#d97706" : "#dc2626" }}>
                      {emp.coveragePercent}%
                    </span>
                  </div>
                  <div className="flex gap-2 mb-2 text-sm items-center">
                    <span style={{ width: 18, textAlign: "center" }}>🚫</span>
                    <span>No-Shows: </span>
                    <span className={`su-badge ${emp.noShows > 2 ? "su-badge-red" : "su-badge-gray"}`} style={{ fontSize: 10 }}>{emp.noShows}</span>
                  </div>
                  <div className="flex gap-2 text-sm items-center">
                    <span style={{ width: 18, textAlign: "center" }}>🔄</span>
                    <span>Swap Requests: {emp.totalSwapRequests}</span>
                  </div>
                </div>

                <div className="text-xs text-muted mt-2">Last Attendance: {lastAtt}</div>
              </div>
            );
          })}
        </div>
      )}

      <div className="flex gap-2">
        <button className="su-btn su-btn-green su-btn-sm su-btn-pill" onClick={exportCSV}>EXPORT CSV</button>
        <button className="su-btn su-btn-green su-btn-sm su-btn-pill" onClick={() => alert("PDF export – connect to backend")}>EXPORT PDF</button>
      </div>
    </div>
  );
}