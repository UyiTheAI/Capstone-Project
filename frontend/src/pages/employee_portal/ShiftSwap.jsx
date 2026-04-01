import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const LOCALE_MAP = { en:"en", es:"es", fr:"fr", pt:"pt", hi:"hi", ja:"ja", zh:"zh-Hans", mr:"mr", ko:"ko" };

export default function ShiftSwap({ user }) {
  const { t, lang } = useLanguage();
  const locale = LOCALE_MAP[lang] || "en";
  const [employees, setEmployees] = useState([]);
  const [myShifts, setMyShifts] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [form, setForm] = useState({ shiftId: "", proposedEmployeeId: "", reason: "", coverageNote: "" });
  const [loading, setLoading] = useState(false);
  const [fetchingShifts, setFetchingShifts] = useState(true);
  const [fetchingEmps, setFetchingEmps] = useState(true);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  useEffect(() => { fetchEmployees(); fetchMyShifts(); fetchMyRequests(); }, []);

  const fetchEmployees = async () => {
    setFetchingEmps(true);
    try {
      const res = await api.get("/users/employees");
      const list = res.data.employees || [];
      const currentId = String(user?.id || user?._id || "");
      setEmployees(list.filter((e) => String(e._id || e.id || "") !== currentId));
    } catch { setEmployees([]); } finally { setFetchingEmps(false); }
  };

  const fetchMyShifts = async () => {
    setFetchingShifts(true);
    try {
      const res = await api.get("/shifts");
      const shifts = res.data.shifts || [];
      setMyShifts(shifts.filter((s) => s.status === "scheduled" || !s.status));
    } catch { setMyShifts([]); } finally { setFetchingShifts(false); }
  };

  const fetchMyRequests = async () => {
    try { const res = await api.get("/swaps"); setMyRequests(res.data.swaps || []); }
    catch { setMyRequests([]); }
  };

  const handleSubmit = async () => {
    setErr(""); setMsg("");
    if (!form.proposedEmployeeId || !form.reason) { setErr(t("pleaseSelectReplacement")); return; }
    setLoading(true);
    try {
      const shift = myShifts.find((s) => s._id === form.shiftId);
      const dateStr = shift ? new Date(shift.date).toLocaleDateString(locale, { weekday:"short", month:"short", day:"numeric", year:"numeric" }) : "";
      await api.post("/swaps", {
        proposedEmployeeId: form.proposedEmployeeId,
        shiftId: form.shiftId || undefined,
        shiftDate: dateStr,
        shiftTime: shift?.timeLabel || `${shift?.startTime||""}–${shift?.endTime||""}`,
        shiftRole: shift?.role || "",
        reason: form.reason,
        coverageNote: form.coverageNote,
      });
      setMsg(t("swapSubmitted"));
      setForm({ shiftId:"", proposedEmployeeId:"", reason:"", coverageNote:"" });
      fetchMyRequests();
    } catch (e) { setErr(e.response?.data?.message || t("failedSubmitSwap")); }
    finally { setLoading(false); }
  };

  const getStatusBadge = (status) => {
    const map = { pending:"su-badge-orange", approved:"su-badge-green", rejected:"su-badge-red" };
    return `su-badge ${map[status] || "su-badge-gray"}`;
  };

  const tStatus = (s) => {
    const map = { pending: t("pending"), approved: t("approved"), rejected: t("rejected") };
    return map[s] || s;
  };

  const currentId = String(user?.id || user?._id || "");
  const mySubmitted = myRequests.filter((r) => String(r.requester?.id || r.requester?._id || "") === currentId);

  return (
    <div className="su-page">
      <div className="su-title">{t("shiftSwapTitle")}</div>
      <div className="su-g2" style={{ gap:22, alignItems:"start" }}>

        {/* FORM */}
        <div>
          <div className="su-card mb-3">
            <div className="su-card-title">{t("submitSwapTitle")}</div>
            {err && <div className="su-alert-err">{err}</div>}
            {msg && <div className="su-alert-ok">{msg}</div>}

            <div className="su-form-row">
              <label className="su-label">{t("selectShiftLabel")}</label>
              {fetchingShifts ? (
                <div className="text-sm text-muted" style={{ padding:"8px 0" }}>{t("loadingShifts2")}</div>
              ) : myShifts.length === 0 ? (
                <div style={{ padding:"10px 14px", background:"#fff8e1", borderRadius:8, fontSize:13, color:"#888", border:"1px dashed #f5b800" }}>
                  ⚠ {t("noShiftsMsg")}
                </div>
              ) : (
                <select className="su-input" value={form.shiftId} onChange={(e) => setForm({ ...form, shiftId:e.target.value })}>
                  <option value="">{t("chooseShift")}</option>
                  {myShifts.map((s) => {
                    const dateLabel = new Date(s.date).toLocaleDateString(locale, { weekday:"short", month:"short", day:"numeric" });
                    const timeLabel = s.timeLabel || `${s.startTime}–${s.endTime}`;
                    return <option key={s._id} value={s._id}>{dateLabel} — {timeLabel} ({s.role})</option>;
                  })}
                </select>
              )}
            </div>

            <div className="su-form-row">
              <label className="su-label">{t("proposeReplacementLabel")}</label>
              {fetchingEmps ? (
                <div className="text-sm text-muted" style={{ padding:"8px 0" }}>{t("loadingCoworkers2")}</div>
              ) : employees.length === 0 ? (
                <div style={{ padding:"10px 14px", background:"#fff8e1", borderRadius:8, fontSize:13, color:"#888", border:"1px dashed #f5b800" }}>
                  ⚠ {t("noCoworkersMsg")}
                </div>
              ) : (
                <select className="su-input" value={form.proposedEmployeeId} onChange={(e) => setForm({ ...form, proposedEmployeeId:e.target.value })}>
                  <option value="">{t("selectCoworker")}</option>
                  {employees.map((e) => {
                    const id = e._id || e.id;
                    const name = e.name || `${e.firstName} ${e.lastName}`;
                    return <option key={id} value={id}>{name} — {e.position}</option>;
                  })}
                </select>
              )}
            </div>

            <div className="su-form-row">
              <label className="su-label">{t("reasonForSwapLabel")}</label>
              <textarea className="su-input" placeholder={t("reasonPlaceholder")} value={form.reason}
                onChange={(e) => setForm({ ...form, reason:e.target.value })} />
            </div>

            <div className="su-form-row">
              <label className="su-label">{t("coverageNoteLabel2")}</label>
              <input className="su-input" type="text" placeholder={t("coveragePlaceholder")} value={form.coverageNote}
                onChange={(e) => setForm({ ...form, coverageNote:e.target.value })} />
            </div>

            <button className="su-btn su-btn-black su-btn-pill" onClick={handleSubmit} disabled={loading}>
              {loading ? <span className="spinner" /> : t("submitRequest")}
            </button>
          </div>
        </div>

        {/* MY REQUESTS */}
        <div className="su-card">
          <div className="su-card-title">{t("mySwapRequestsTitle")} ({mySubmitted.length})</div>
          {mySubmitted.length === 0 ? (
            <p className="text-sm text-muted text-center" style={{ padding:20 }}>{t("noSwapRequestsYet")}</p>
          ) : (
            mySubmitted.map((r) => (
              <div key={r._id} style={{ borderBottom:"1px solid #f0f0f0", paddingBottom:12, marginBottom:12 }}>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-bold">{r.shiftDate || t("naLabel")}</span>
                  <span className={getStatusBadge(r.status)}>{tStatus(r.status)}</span>
                </div>
                <div className="text-xs text-muted">
                  {t("proposed2")} {r.proposedEmployee?.name || `${r.proposedEmployee?.firstName} ${r.proposedEmployee?.lastName}`}
                </div>
                <div className="text-xs text-muted">{t("reason2")} {r.reason}</div>
                {r.managerComment && (
                  <div className="text-xs mt-2" style={{ color:"#555" }}>{t("managerComment2")} {r.managerComment}</div>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}