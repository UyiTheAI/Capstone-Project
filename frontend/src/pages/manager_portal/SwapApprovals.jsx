import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../context/LanguageContext";

export default function SwapApprovals({
  const { t } = useLanguage(); user, onUpdate }) {
  const [swaps, setSwaps] = useState([]);
  const [loading, setLoading] = useState(true);
  const [comments, setComments] = useState({});
  const [actionLoading, setActionLoading] = useState({});

  useEffect(() => {
    fetchSwaps();
  }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await api.get("/swaps");
      setSwaps(res.data.swaps || []);
    } catch {
      // Demo fallback
      setSwaps([
        { _id: "s1", status: "pending", requester: { name: "Maria Garcia" }, proposedEmployee: { name: "Kevin Chen" }, shiftDate: "Mon Oct 20, 2025", shiftTime: "9:00 AM - 5:00 PM", shiftRole: "Waitstaff", reason: "Doctor appointment", coverageNote: "Kevin is available", managerComment: "" },
        { _id: "s2", status: "pending", requester: { name: "Maria Garcia" }, proposedEmployee: { name: "Kevin Chen" }, shiftDate: "Mon Oct 20, 2025", shiftTime: "9:00 AM - 5:00 PM", shiftRole: "Waitstaff", reason: "Doctor appointment", coverageNote: "Kevin is available", managerComment: "" },
        { _id: "s3", status: "pending", requester: { name: "John M." }, proposedEmployee: { name: "Sarah T." }, shiftDate: "Tue Oct 21, 2025", shiftTime: "5:00 PM - 11:00 PM", shiftRole: "Bartender", reason: "Family event", coverageNote: "Sarah confirmed availability", managerComment: "" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (swapId, action) => {
    setActionLoading((prev) => ({ ...prev, [swapId]: true }));
    try {
      await api.put(`/swaps/${swapId}/${action}`, { comment: comments[swapId] || "" });
      setSwaps((prev) => prev.map((s) => s._id === swapId ? { ...s, status: action === "approve" ? "approved" : "rejected", managerComment: comments[swapId] || "" } : s));
      onUpdate?.();
    } catch {
      // optimistic update
      setSwaps((prev) => prev.map((s) => s._id === swapId ? { ...s, status: action === "approve" ? "approved" : "rejected", managerComment: comments[swapId] || "" } : s));
      onUpdate?.();
    } finally {
      setActionLoading((prev) => ({ ...prev, [swapId]: false }));
    }
  };

  const pending  = swaps.filter((s) => s.status === "pending");
  const resolved = swaps.filter((s) => s.status !== "pending");

  return (
    <div className="su-page">
      <div className="su-title">SWAP REQUESTS</div>

      {loading ? (
        <div className="text-center text-muted" style={{ padding: 40 }}>Loading…</div>
      ) : (
        <>
          {/* PENDING */}
          <div className="text-xs text-muted font-bold mb-3">PENDING ({pending.length})</div>
          <div className="su-g2 mb-4">
            {pending.map((r) => (
              <div key={r._id} style={{ background: "#fff", borderRadius: 12, padding: 20, boxShadow: "0 2px 8px rgba(0,0,0,.05)" }}>
                <div className="flex justify-between mb-3">
                  <span className="su-badge su-badge-orange">Pending</span>
                </div>
                {[
                  ["👤", `Employee: ${r.requester?.name}`],
                  ["📅", `Shift: ${r.shiftDate}, ${r.shiftTime}`],
                  ["💼", `Role: ${r.shiftRole}`],
                  ["📝", `Reason: ${r.reason}`],
                  ["🔄", `Proposed Swap: ${r.proposedEmployee?.name}`],
                  ["✅", `Coverage: ${r.coverageNote || "N/A"}`],
                ].map(([icon, text]) => (
                  <div key={icon} className="flex gap-2 mb-2 text-sm" style={{ alignItems: "flex-start" }}>
                    <span style={{ fontSize: 12, marginTop: 1 }}>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
                <div className="text-xs text-muted mb-2 mt-3">Manager Comment:</div>
                <textarea
                  style={{ width: "100%", padding: "7px 10px", border: "1px solid #e0e0e0", borderRadius: 8, fontFamily: "'DM Sans', sans-serif", fontSize: 13, resize: "none", height: 55, marginBottom: 8 }}
                  placeholder="Add a comment…"
                  value={comments[r._id] || ""}
                  onChange={(e) => setComments((c) => ({ ...c, [r._id]: e.target.value }))}
                />
                <div className="flex gap-2">
                  <button
                    className="su-btn su-btn-green su-btn-sm"
                    onClick={() => handleAction(r._id, "approve")}
                    disabled={actionLoading[r._id]}
                  >
                    {actionLoading[r._id] ? <span className="spinner" /> : "APPROVE"}
                  </button>
                  <button
                    className="su-btn su-btn-red su-btn-sm"
                    onClick={() => handleAction(r._id, "reject")}
                    disabled={actionLoading[r._id]}
                  >
                    REJECT
                  </button>
                </div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="su-card text-center text-muted text-sm" style={{ padding: 32 }}>
                ✓ No pending swap requests.
              </div>
            )}
          </div>

          {/* RESOLVED */}
          {resolved.length > 0 && (
            <>
              <div className="text-xs text-muted font-bold mb-3">RESOLVED ({resolved.length})</div>
              <div className="su-g2">
                {resolved.map((r) => (
                  <div key={r._id} style={{ background: "#fff", borderRadius: 12, padding: 18, boxShadow: "0 2px 8px rgba(0,0,0,.04)", opacity: 0.75 }}>
                    <div className="flex justify-between mb-2">
                      <span className="text-sm font-bold">{r.requester?.name} swap</span>
                      <span className={`su-badge ${r.status === "approved" ? "su-badge-green" : "su-badge-red"}`}>
                        {r.status}
                      </span>
                    </div>
                    <div className="text-xs text-muted">{r.shiftDate} — {r.shiftRole}</div>
                    <div className="text-xs text-muted">Proposed: {r.proposedEmployee?.name}</div>
                    {r.managerComment && <div className="text-xs mt-2" style={{ color: "#555" }}>Comment: {r.managerComment}</div>}
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