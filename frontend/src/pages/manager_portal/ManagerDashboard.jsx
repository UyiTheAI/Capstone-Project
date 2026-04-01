import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

export default function ManagerDashboard({ user, onGoToSwaps }) {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchDashboard(); }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const res = await api.get("/dashboard");
      setData(res.data);
    } catch {
      setData({ todayShifts:[], pendingSwaps:[], weeklyHours:[], alerts:[] });
    } finally { setLoading(false); }
  };

  if (loading) return <div className="su-page text-center text-muted" style={{ padding:60 }}>{t("loadingDashboard")}</div>;

  const managerName = user?.name || `${user?.firstName||""} ${user?.lastName||""}`.trim();

  return (
    <div className="su-page">
      <div style={{ background:"#fff", padding:"14px 20px", borderRadius:12, marginBottom:20 }}>
        <div className="font-bold" style={{ fontSize:17, textTransform:"uppercase" }}>
          {t("welcomeManager")} {managerName}
        </div>
      </div>

      <div className="su-g2">
        <div>
          <div className="su-card-dark mb-3">
            <div className="su-card-title">{t("todaysCoverage")}</div>
            <table className="su-tbl light">
              <tbody>
                {(data?.todayShifts || []).map((s, i) => (
                  <tr key={s._id}>
                    <td className="su-tbl-idx">{String(i+1).padStart(2,"0")}</td>
                    <td>{s.area}</td>
                    <td style={{ color:"#aaa" }}>{s.employee?.name}</td>
                  </tr>
                ))}
                {(data?.todayShifts || []).length === 0 && (
                  <tr><td colSpan={3} style={{ color:"#666", paddingTop:10 }}>{t("noShiftsToday")}</td></tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="su-card-dark">
            <div className="su-card-title">{t("totalHoursWeek")}</div>
            <table className="su-tbl light">
              <tbody>
                {(data?.weeklyHours || []).map((w, i) => (
                  <tr key={i}>
                    <td className="su-tbl-idx">{String(i+1).padStart(2,"0")}</td>
                    <td>{w.name}</td>
                    <td style={{ color:"#aaa" }}>{w.hours} {t("hrsLabel")}</td>
                    <td style={{ color:"#f5b800" }}>${w.cost}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div>
          <div className="su-card mb-3">
            <div className="su-card-title">{t("pendingApprovals2")}</div>
            <table className="su-tbl">
              <thead><tr><th>{t("nameLabel")}</th><th>{t("statusLabel")}</th></tr></thead>
              <tbody>
                {(data?.pendingSwaps || []).slice(0,5).map((r) => (
                  <tr key={r._id}>
                    <td className="text-sm">{r.requester?.name} {t("swap")}</td>
                    <td><span className="su-badge su-badge-orange">{t("onGoing")}</span></td>
                  </tr>
                ))}
                {(data?.pendingSwaps || []).length === 0 && (
                  <tr><td colSpan={2} className="text-sm text-muted" style={{ paddingTop:8 }}>{t("noPendingSwaps")}</td></tr>
                )}
              </tbody>
            </table>
            {(data?.pendingSwaps?.length || 0) > 0 && (
              <button className="su-btn su-btn-green su-btn-sm su-btn-pill mt-3" onClick={onGoToSwaps}>
                {t("reviewNow2")}
              </button>
            )}
          </div>

          <div className="su-card">
            <div className="su-card-title">{t("shiftAlerts2")}</div>
            {(data?.alerts || []).map((a, i) => (
              <div key={i} className="flex gap-2 mb-3">
                <div style={{ width:22, height:22, background:"#1a1a1a", borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontSize:10, flexShrink:0, marginTop:1 }}>!</div>
                <div className="text-sm" style={{ color:"#555" }}>{a.text}</div>
              </div>
            ))}
            {(data?.alerts || []).length === 0 && (
              <p className="text-sm text-muted">{t("noActiveAlerts")}</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}