import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

export default function SwapApprovals({ user, onUpdate }) {
  const { t } = useLanguage();
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => { fetchSwaps(); }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await api.get("/swaps");
      setSwaps(res.data.swaps || []);
    } catch {
      setSwaps([]);
    } finally { setLoading(false); }
  };

  const handleAction = async (swapId, action) => {
    setActionLoading((prev) => ({ ...prev, [swapId]:true }));
    try {
      await api.put(`/swaps/${swapId}/${action}`, { comment:comments[swapId]||"" });
      setSwaps((prev) => prev.map((s) => s._id === swapId ? { ...s, status:action==="approve"?"approved":"rejected", managerComment:comments[swapId]||"" } : s));
      onUpdate?.();
    } catch {
      setSwaps((prev) => prev.map((s) => s._id === swapId ? { ...s, status:action==="approve"?"approved":"rejected", managerComment:comments[swapId]||"" } : s));
      onUpdate?.();
    } finally { setActionLoading((prev) => ({ ...prev, [swapId]:false })); }
  };

  const tStatus = (s) => ({ pending:t("pending"), approved:t("approved"), rejected:t("rejected") }[s] || s);

  const pending  = swaps.filter((s) => s.status === "pending");
  const resolved = swaps.filter((s) => s.status !== "pending");

  return (
    <div className="su-page">
      <div className="su-title">{t("swapRequestsTitle")}</div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding:40 }}>{t("loading")}</div>
      ) : (
        <>
          <div className="text-xs text-muted font-bold mb-3">{t("pendingCount")} ({pending.length})</div>
          <div className="su-g2 mb-4">
            {pending.map((r) => (
              <div key={r._id} style={{ background:"#fff", borderRadius:12, padding:20, boxShadow:"0 2px 8px rgba(0,0,0,.05)" }}>
                <div className="flex justify-between mb-3">
                  <span className="su-badge su-badge-orange">{t("pending")}</span>
                </div>
                {[
                  ["👤", `${t("employeeLabel")} ${r.requester?.name}`],
                  ["📅", `${t("shiftLabel2")} ${r.shiftDate}, ${r.shiftTime}`],
                  ["💼", `${t("roleLabel")} ${r.shiftRole}`],
                  ["📝", `${t("reasonLabel")} ${r.reason}`],
                  ["🔄", `${t("proposedSwapLabel")} ${r.proposedEmployee?.name}`],
                  ["✅", `${t("coverageLabel2")} ${r.coverageNote || t("naLabel")}`],
                ].map(([icon, text]) => (
                  <div key={icon} className="flex gap-2 mb-2 text-sm" style={{ alignItems:"flex-start" }}>
                    <span style={{ fontSize:12, marginTop:1 }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
                <div className="text-xs text-muted mb-2 mt-3">{t("managerCommentLabel")}</div>
                <textarea
                  style={{ width:"100%", padding:"7px 10px", border:"1px solid #e0e0e0", borderRadius:8, fontFamily:"var(--font-body)", fontSize:13, resize:"none", height:55, marginBottom:8 }}
                  placeholder={t("addCommentPlaceholder")}
                  value={comments[r._id]||""}
                  onChange={(e) => setComments((c) => ({ ...c, [r._id]:e.target.value }))}
                />
                <div className="flex gap-2">
                  <button className="su-btn su-btn-green su-btn-sm" onClick={() => handleAction(r._id,"approve")} disabled={actionLoading[r._id]}>
                    {actionLoading[r._id] ? <span className="spinner" /> : t("approveBtn")}
                  </button>
                  <button className="su-btn su-btn-red su-btn-sm" onClick={() => handleAction(r._id,"reject")} disabled={actionLoading[r._id]}>
                    {t("rejectBtn")}
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="su-card text-center text-muted text-sm" style={{ padding:32 }}>
                {t("noPendingSwapsMsg")}
              </div>
            )}
          </div>

          {resolved.length > 0 && (
            <>
              <div className="text-xs text-muted font-bold mb-3">{t("resolvedCount")} ({resolved.length})</div>
              <div className="su-g2">
                {resolved.map((r) => (
                  <div key={r._id} style={{ background:"#fff", borderRadius:12, padding:18, boxShadow:"0 2px 8px rgba(0,0,0,.04)", opacity:0.75 }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-bold">{r.requester?.name} {t("swap")}</span>
                      <span className={`su-badge ${r.status==="approved"?"su-badge-green":"su-badge-red"}`}>{tStatus(r.status)}</span>
                    </div>
                    <div className="text-xs text-muted">{r.shiftDate} — {r.shiftRole}</div>
                    <div className="text-xs text-muted">{t("proposed2")} {r.proposedEmployee?.name}</div>
                    {r.managerComment && <div className="text-xs mt-2" style={{ color:"#555" }}>{t("commentLabel")} {r.managerComment}</div>}
                  </div>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}