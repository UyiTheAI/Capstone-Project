import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../context/LanguageContext";

export default function ManagerDashboard({
  const { t } = useLanguage(); user, onGoToSwaps }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
    } catch {
      // Demo data fallback
      setData({
        todayShifts: [
          { _id: "1", area: "Front",     employee: { name: "Maria Garcia" } },
          { _id: "2", area: "Kitchen",   employee: { name: "Kevin Chen"   } },
          { _id: "3", area: "Bar",       employee: { name: "Sarah T."     } },
          { _id: "4", area: "Waitstaff", employee: { name: "John M."      } },
        ],
        pendingSwaps: [
          { _id: "s1", requester: { name: "Maria Garcia" }, shiftDate: "Mon Oct 20" },
          { _id: "s2", requester: { name: "Kevin Chen"   }, shiftDate: "Mon Oct 20" },
          { _id: "s3", requester: { name: "James Smith"  }, shiftDate: "Tue Oct 21" },
        ],
        weeklyHours: [
          { name: "Maria",  hours: 40, cost: 400 },
          { name: "Jason",  hours: 24, cost: 240 },
          { name: "Kevin",  hours: 30, cost: 300 },
          { name: "Sarah",  hours: 18, cost: 180 },
        ],
        alerts: [
          { text: "No Employee assigned to 12:00 PM -5:00 PM shift on Tuesday 12 2025" },
          { text: "Maria Gersia unavailable for 9:00 AM - 1:00 PM shift." },
          { text: "No-show detected: 1 past week" },
        ],
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="su-page text-center text-muted" style={{ padding: 60 }}>Loading dashboard…</div>;

  return (
    <div className="su-page">
      {/* Welcome Banner */}
      <div style={{ background: "#fff", padding: "14px 20px", borderRadius: 12, marginBottom: 20 }}>
        <div className="font-bold" style={{ fontSize: 17, textTransform: "uppercase" }}>
          Welcome {user?.name || `${user?.firstName} ${user?.lastName}`}
        </div>
      </div>

      <div className="su-g2">
        {/* LEFT COLUMN */}
        <div>
          {/* Today's Coverage */}
          <div className="su-card-dark mb-3">
            <div className="su-card-title">Today's Coverage</div>
            <table className="su-tbl light">
              <tbody>
                {(data?.todayShifts || []).map((s, i) => (
                  <tr key={s._id}>
                    <td className="su-tbl-idx">{String(i + 1).padStart(2, "0")}</td>
                    <td>{s.area}</td>
                    <td style={{ color: "#aaa" }}>{s.employee?.name}</td>
                  </tr>
                ))}
                {(data?.todayShifts || []).length === 0 && (
                  <tr><td colSpan={3} style={{ color: "#666", paddingTop: 10 }}>No shifts today.</td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Total Hours This Week */}
          <div className="su-card-dark">
            <div className="su-card-title">Total Hours This Week</div>
            <table className="su-tbl light">
              <tbody>
                {(data?.weeklyHours || []).map((w, i) => (
                  <tr key={i}>
                    <td className="su-tbl-idx">{String(i + 1).padStart(2, "0")}</td>
                    <td>{w.name}</td>
                    <td style={{ color: "#aaa" }}>{w.hours} Hours</td>
                    <td style={{ color: "#f5b800" }}>${w.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* RIGHT COLUMN */}
        <div>
          {/* Pending Approvals */}
          <div className="su-card mb-3">
            <div className="su-card-title">Pending Approvals:</div>
            <table className="su-tbl">
              <thead><tr><th>Name</th><th>Status</th></tr></thead>
              <tbody>
                {(data?.pendingSwaps || []).slice(0, 5).map((r) => (
                  <tr key={r._id}>
                    <td className="text-sm">{r.requester?.name} swap</td>
                    <td><span className="su-badge su-badge-orange">On going</span></td>
                  </tr>
                ))}
                {(data?.pendingSwaps || []).length === 0 && (
                  <tr><td colSpan={2} className="text-sm text-muted" style={{ paddingTop: 8 }}>No pending swaps.</td></tr>
                )}
              </tbody>
            </table>
            {(data?.pendingSwaps?.length || 0) > 0 && (
              <button className="su-btn su-btn-green su-btn-sm su-btn-pill mt-3" onClick={onGoToSwaps}>
                Review Now
              </button>
            )}
          </div>

          {/* Shift Alerts */}
          <div className="su-card">
            <div className="su-card-title">⚠ Shift Alerts</div>
            {(data?.alerts || []).map((a, i) => (
              <div key={i} className="flex gap-2 mb-3">
                <div style={{ width: 22, height: 22, background: "#1a1a1a", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 10, flexShrink: 0, marginTop: 1 }}>
                  !
                </div>
                <div className="text-sm" style={{ color: "#555" }}>{a.text}</div>
              </div>
            ))}
            {(data?.alerts || []).length === 0 && (
              <p className="text-sm text-muted">No active alerts.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}