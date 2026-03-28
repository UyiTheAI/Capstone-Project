import React, { useState, useEffect, useCallback } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../context/LanguageContext";

/* ─── constants ─────────────────────────────────────────── */
const ROLE_COLORS = {
  Waitstaff:       { bg:"#4f46e5", light:"#ede9fe" },
  Dishwasher:      { bg:"#0891b2", light:"#e0f2fe" },
  "Kitchen Staff": { bg:"#16a34a", light:"#dcfce7" },
  Bartender:       { bg:"#dc2626", light:"#fee2e2" },
  Manager:         { bg:"#7c3aed", light:"#f3e8ff" },
  Server:          { bg:"#ea580c", light:"#ffedd5" },
  Cook:            { bg:"#ca8a04", light:"#fef9c3" },
  Host:            { bg:"#0d9488", light:"#ccfbf1" },
};
const ROLES    = Object.keys(ROLE_COLORS);
const rc       = (r) => ROLE_COLORS[r] || { bg:"#6b7280", light:"#f3f4f6" };
const DAY_NAMES = ["MON","TUE","WED","THU","FRI","SAT","SUN"];
const AREAS    = ["Front","Bar","Kitchen","Patio","Drive-Thru","Back","Counter"];
const PRESET_TIMES = [
  { label:"Morning   6A–2P",  start:"06:00", end:"14:00" },
  { label:"Day       9A–5P",  start:"09:00", end:"17:00" },
  { label:"Swing    11A–7P",  start:"11:00", end:"19:00" },
  { label:"Afternoon 12P–8P", start:"12:00", end:"20:00" },
  { label:"Evening   5P–11P", start:"17:00", end:"23:00" },
  { label:"Night     7P–3A",  start:"19:00", end:"03:00" },
  { label:"Custom",           start:"",      end:""       },
];

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "PM" : "AM";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2,"0")}${ap}` : `${h12}${ap}`;
}

function calcMins(s, e) {
  if (!s || !e) return 0;
  const [sh,sm] = s.split(":").map(Number);
  let   [eh,em] = e.split(":").map(Number);
  if (eh < sh) eh += 24;
  return Math.max(0, (eh*60+em)-(sh*60+sm));
}
function fmtHrs(mins) {
  if (!mins) return "0h";
  return `${Math.floor(mins/60)}h${mins%60?` ${mins%60}m`:""}`;
}

/* ─── ShiftModal ─────────────────────────────────────────── */
function ShiftModal({ emp, date, shift, onSave, onDelete, onClose }) {
  const { t } = useLanguage();
  const isEdit = !!shift;
  const [preset,  setPreset]  = useState(isEdit ? "Custom" : "Day       9A–5P");
  const [start,   setStart]   = useState(isEdit ? shift.startTime : "09:00");
  const [end,     setEnd]     = useState(isEdit ? shift.endTime   : "17:00");
  const [role,    setRole]    = useState(isEdit ? shift.role      : "Waitstaff");
  const [area,    setArea]    = useState(isEdit ? (shift.area||"") : "");
  const [saving,  setSaving]  = useState(false);

  const applyPreset = (label) => {
    setPreset(label);
    const p = PRESET_TIMES.find(x => x.label === label);
    if (p && p.start) { setStart(p.start); setEnd(p.end); }
  };

  const handleSave = async () => {
    if (!start || !end || !role) return;
    setSaving(true);
    await onSave({ startTime:start, endTime:end, role, area, date, employeeId: emp._id || emp.id });
    setSaving(false);
  };

  const duration = calcMins(start, end);

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.45)", zIndex:1000,
      display:"flex", alignItems:"center", justifyContent:"center" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div style={{ background:"#fff", borderRadius:20, width:420, maxWidth:"95vw",
        boxShadow:"0 20px 60px rgba(0,0,0,.25)", overflow:"hidden" }}>

        {/* Modal Header */}
        <div style={{ background:"#1a1a1a", padding:"18px 24px", display:"flex", justifyContent:"space-between", alignItems:"center" }}>
          <div>
            <div style={{ color:"#f5b800", fontSize:11, fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>
              {isEdit ? {t("editShift")} : {t("addShift")}}
            </div>
            <div style={{ color:"#fff", fontWeight:800, fontSize:15, marginTop:2 }}>
              {emp.name || `${emp.firstName} ${emp.lastName}`}
            </div>
            <div style={{ color:"#888", fontSize:12 }}>
              {new Date(date).toLocaleDateString("en",{weekday:"long",month:"long",day:"numeric"})}
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.1)", border:"none",
            color:"#fff", width:32, height:32, borderRadius:"50%", cursor:"pointer", fontSize:18 }}>×</button>
        </div>

        <div style={{ padding:"20px 24px" }}>

          {/* Preset quick select */}
          <div style={{ marginBottom:16 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase",
              letterSpacing:1, marginBottom:8 }}>Quick Select</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {PRESET_TIMES.filter(p=>p.label!=="Custom").map(p => (
                <button key={p.label} onClick={() => applyPreset(p.label)}
                  style={{ padding:"5px 11px", border:"1.5px solid", borderRadius:20, cursor:"pointer",
                    fontSize:11, fontWeight:600,
                    borderColor: preset===p.label ? "#1a1a1a":"#e0e0e0",
                    background:  preset===p.label ? "#1a1a1a":"#fff",
                    color:       preset===p.label ? "#fff":"#666" }}>
                  {p.label.split("  ")[0].trim()}
                </button>
              ))}
            </div>
          </div>

          {/* Time row */}
          <div style={{ display:"flex", gap:12, marginBottom:16 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase",
                letterSpacing:1, marginBottom:6 }}>Start Time</div>
              <input type="time" value={start} onChange={e=>{setStart(e.target.value); setPreset("Custom");}}
                style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e0e0e0",
                  borderRadius:10, fontSize:14, fontWeight:600, boxSizing:"border-box" }} />
            </div>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase",
                letterSpacing:1, marginBottom:6 }}>End Time</div>
              <input type="time" value={end} onChange={e=>{setEnd(e.target.value); setPreset("Custom");}}
                style={{ width:"100%", padding:"9px 12px", border:"1.5px solid #e0e0e0",
                  borderRadius:10, fontSize:14, fontWeight:600, boxSizing:"border-box" }} />
            </div>
          </div>

          {/* Duration pill */}
          {duration > 0 && (
            <div style={{ textAlign:"center", marginBottom:14 }}>
              <span style={{ background:"#f0f9ff", color:"#0891b2", fontSize:12, fontWeight:700,
                padding:"4px 14px", borderRadius:20 }}>
                ⏱ {fmtHrs(duration)} shift
              </span>
            </div>
          )}

          {/* Role */}
          <div style={{ marginBottom:14 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase",
              letterSpacing:1, marginBottom:8 }}>Role</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {ROLES.map(r => {
                const c = rc(r);
                return (
                  <button key={r} onClick={()=>setRole(r)}
                    style={{ padding:"6px 14px", border:"1.5px solid", borderRadius:20, cursor:"pointer",
                      fontSize:12, fontWeight:600,
                      borderColor: role===r ? c.bg:"#e0e0e0",
                      background:  role===r ? c.bg:"#fff",
                      color:       role===r ? "#fff":"#666" }}>
                    {r}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Area */}
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:"#aaa", textTransform:"uppercase",
              letterSpacing:1, marginBottom:8 }}>Area (optional)</div>
            <div style={{ display:"flex", flexWrap:"wrap", gap:6 }}>
              {AREAS.map(a => (
                <button key={a} onClick={()=>setArea(area===a?"":a)}
                  style={{ padding:"5px 12px", border:"1.5px solid", borderRadius:20, cursor:"pointer",
                    fontSize:11, fontWeight:600,
                    borderColor: area===a ? "#1a1a1a":"#e0e0e0",
                    background:  area===a ? "#1a1a1a":"#fff",
                    color:       area===a ? "#fff":"#666" }}>
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div style={{ display:"flex", gap:10 }}>
            {isEdit && (
              <button onClick={() => onDelete(shift._id)}
                style={{ padding:"10px 18px", border:"1.5px solid #fee2e2",
                  background:"#fff", color:"#dc2626", borderRadius:10, cursor:"pointer",
                  fontWeight:700, fontSize:13 }}>
                🗑 Delete
              </button>
            )}
            <button onClick={onClose}
              style={{ flex:1, padding:"10px 0", border:"1.5px solid #e0e0e0",
                background:"#fff", color:"#666", borderRadius:10, cursor:"pointer",
                fontWeight:700, fontSize:13 }}>
              Cancel
            </button>
            <button onClick={handleSave} disabled={saving || !start || !end || !role}
              style={{ flex:2, padding:"10px 0", border:"none",
                background: "#1a1a1a", color:"#f5b800", borderRadius:10, cursor:"pointer",
                fontWeight:800, fontSize:13, opacity: (!start||!end||!role)?.5:1 }}>
              {saving ? {t("loading")} : isEdit ? {t("updateShift")} : {t("addShift")}}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main Component ─────────────────────────────────────── */
export default function ManagerSchedule({ user }) {
  const { t } = useLanguage();
  const [employees,  setEmployees]  = useState([]);
  const [shifts,     setShifts]     = useState([]);
  const [weekOffset, setWeekOffset] = useState(0);
  const [modal,      setModal]      = useState(null); // { emp, date, shift? }
  const [toast,      setToast]      = useState("");
  const [publishing, setPublishing] = useState(false);
  const [loading,    setLoading]    = useState(true);
  const [filter,     setFilter]     = useState("");  // role filter

  /* ── week helpers ── */
  const getWeek = (off) => {
    const base = new Date();
    const mon  = new Date(base);
    mon.setDate(base.getDate() - ((base.getDay()+6)%7) + off*7);
    return Array.from({length:7},(_,i)=>{ const d=new Date(mon); d.setDate(mon.getDate()+i); return d; });
  };
  const days     = getWeek(weekOffset);
  const isoDate  = (d) => d.toISOString().split("T")[0];
  const today    = isoDate(new Date());
  const weekLabel = `${days[0].toLocaleDateString("en",{month:"short",day:"numeric"})} – ${days[6].toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}`;

  /* ── load ── */
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [empRes, shiftRes] = await Promise.all([
        api.get("/users/employees"),
        api.get(`/shifts/week?start=${isoDate(days[0])}&end=${isoDate(days[6])}`),
      ]);
      setEmployees(empRes.data.employees || []);
      setShifts(shiftRes.data.shifts || []);
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [weekOffset]);

  useEffect(() => { loadData(); }, [weekOffset]);

  /* ── shift lookups ── */
  const shiftsFor = (empId, dateKey) =>
    shifts.filter(s => {
      const sd  = typeof s.date==="string" ? s.date.split("T")[0] : new Date(s.date).toISOString().split("T")[0];
      const sid = s.employee?._id || s.employee?.id || s.employee;
      return String(sid)===String(empId) && sd===dateKey;
    });

  const shiftsOnDay = (dateKey) =>
    shifts.filter(s => {
      const sd = typeof s.date==="string" ? s.date.split("T")[0] : new Date(s.date).toISOString().split("T")[0];
      return sd===dateKey;
    });

  /* ── weekly stats ── */
  const empWeekMins = (empId) =>
    shifts.filter(s => String(s.employee?._id||s.employee?.id||s.employee)===String(empId))
      .reduce((acc,s) => acc + calcMins(s.startTime, s.endTime), 0);

  const totalWeekMins = shifts.reduce((acc,s) => acc + calcMins(s.startTime, s.endTime), 0);
  const draftCount    = shifts.filter(s => s.isDraft).length;
  const publishedCount= shifts.filter(s => !s.isDraft).length;

  /* ── actions ── */
  const showToast = (msg, ms=3000) => { setToast(msg); setTimeout(()=>setToast(""),ms); };

  const handleSaveShift = async ({ startTime, endTime, role, area, date, employeeId }) => {
    try {
      await api.post("/shifts", {
        employeeId, date, startTime, endTime,
        timeLabel: `${fmt12(startTime)}–${fmt12(endTime)}`,
        role, area: area||"", isDraft: true,
      });
      showToast(t("shiftAdded"));
      setModal(null);
      loadData();
    } catch(e) {
      showToast("Failed to save shift");
    }
  };

  const handleDeleteShift = async (shiftId) => {
    try {
      await api.delete(`/shifts/${shiftId}`);
      showToast(t("shiftRemoved"));
      setModal(null);
      loadData();
    } catch {
      showToast("Failed to delete");
    }
  };

  const handlePublish = async () => {
    if (!window.confirm(`Publish all ${draftCount} draft shifts for this week? Employees will be notified.`)) return;
    setPublishing(true);
    try {
      const res = await api.post("/shifts/publish", { weekStart: isoDate(days[0]), weekEnd: isoDate(days[6]) });
      showToast(`🚀 Published! ${res.data.count || draftCount} shifts sent to employees.`);
      loadData();
    } catch {
      showToast("Failed to publish");
    } finally {
      setPublishing(false);
    }
  };

  const handleCopyPrevWeek = async () => {
    const prevDays = getWeek(weekOffset - 1);
    try {
      const res = await api.get(`/shifts/week?start=${isoDate(prevDays[0])}&end=${isoDate(prevDays[6])}`);
      const prevShifts = res.data.shifts || [];
      if (!prevShifts.length) { showToast(t("noPrevShifts")); return; }

      const calls = prevShifts.map(s => {
        const prevDate = new Date(s.date);
        const newDate  = new Date(prevDate);
        newDate.setDate(prevDate.getDate() + 7);
        return api.post("/shifts", {
          employeeId: s.employee?._id || s.employee?.id || s.employee,
          date: isoDate(newDate),
          startTime: s.startTime, endTime: s.endTime,
          timeLabel: s.timeLabel, role: s.role, area: s.area||"",
          isDraft: true,
        });
      });
      await Promise.all(calls);
      showToast(`✓ Copied ${calls.length} shifts from last week as drafts`);
      loadData();
    } catch {
      showToast("Failed to copy previous week");
    }
  };

  /* ── filtered employees ── */
  const visibleEmps = filter
    ? employees.filter(e => shifts.some(s => {
        const sid = s.employee?._id||s.employee?.id||s.employee;
        return String(sid)===String(e._id||e.id) && s.role===filter;
      }))
    : employees;

  return (
    <div className="su-page" style={{ paddingBottom:40 }}>

      {/* ── TOAST ── */}
      {toast && (
        <div style={{ position:"fixed", top:24, right:24, background:"#1a1a1a", color:"#f5b800",
          padding:"13px 24px", borderRadius:14, fontWeight:700, zIndex:9999, fontSize:13,
          boxShadow:"0 8px 30px rgba(0,0,0,.3)", animation:"fadeIn .2s ease" }}>
          {toast}
        </div>
      )}

      {/* ── MODAL ── */}
      {modal && (
        <ShiftModal
          emp={modal.emp} date={modal.date} shift={modal.shift||null}
          onSave={handleSaveShift}
          onDelete={handleDeleteShift}
          onClose={() => setModal(null)}
        />
      )}

      {/* ── TOP BAR ── */}
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center",
        flexWrap:"wrap", gap:14, marginBottom:20 }}>

        <div className="su-title" style={{ marginBottom:0 }}>SCHEDULE MANAGER</div>

        <div style={{ display:"flex", alignItems:"center", gap:10, flexWrap:"wrap" }}>
          {/* Week nav */}
          <button onClick={()=>setWeekOffset(o=>o-1)}
            style={{ background:"#f0f0ec", border:"none", borderRadius:8, padding:"8px 14px",
              cursor:"pointer", fontWeight:700, fontSize:13 }}>‹</button>
          <button onClick={()=>setWeekOffset(0)}
            style={{ background: weekOffset===0?"#f5b800":"#f0f0ec", border:"none", borderRadius:8,
              padding:"8px 14px", cursor:"pointer", fontWeight:700, fontSize:13 }}>Today</button>
          <span style={{ fontWeight:800, fontSize:14, color:"#2563eb", minWidth:190, textAlign:"center" }}>{weekLabel}</span>
          <button onClick={()=>setWeekOffset(o=>o+1)}
            style={{ background:"#f0f0ec", border:"none", borderRadius:8, padding:"8px 14px",
              cursor:"pointer", fontWeight:700, fontSize:13 }}>›</button>

          {/* Copy prev week */}
          <button onClick={handleCopyPrevWeek}
            style={{ background:"#f0f0ec", border:"none", borderRadius:8, padding:"8px 14px",
              cursor:"pointer", fontWeight:600, fontSize:12, color:"#555" }}>
            📋 Copy Prev Week
          </button>

          {/* Publish */}
          <button onClick={handlePublish} disabled={publishing || draftCount===0}
            style={{ background: draftCount>0?"#22c55e":"#d1d5db", border:"none", borderRadius:10,
              padding:"9px 20px", cursor: draftCount>0?"pointer":"not-allowed",
              fontWeight:800, fontSize:13, color:"#fff",
              boxShadow: draftCount>0?"0 2px 8px rgba(34,197,94,.4)":"none" }}>
            {publishing ? {t("publishing")} : draftCount>0 ? `🚀 ${t("publishDrafts")} ${draftCount}` : t("allPublished")}
          </button>
        </div>
      </div>

      {/* ── STATS STRIP ── */}
      <div style={{ display:"flex", gap:10, marginBottom:18, flexWrap:"wrap" }}>
        {[
          { label:{t("totalShifts")},    value: shifts.length,                    color:"#f5b800" },
          { label:{t("published")},       value: publishedCount,                   color:"#22c55e" },
          { label:{t("drafts")},          value: draftCount,                       color:"#f59e0b" },
          { label:{t("staffScheduled")}, value: new Set(shifts.map(s=>String(s.employee?._id||s.employee?.id||s.employee))).size, color:"#818cf8" },
          { label:{t("totalHours")},     value: fmtHrs(totalWeekMins),           color:"#38bdf8" },
        ].map(s=>(
          <div key={s.label} style={{ background:"#1a1a1a", borderRadius:12, padding:"12px 18px",
            flex:1, minWidth:110 }}>
            <div style={{ color:s.color, fontWeight:800, fontSize:20 }}>{s.value}</div>
            <div style={{ color:"#666", fontSize:10, marginTop:2, textTransform:"uppercase", letterSpacing:.5 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── ROLE FILTER ── */}
      <div style={{ display:"flex", gap:6, marginBottom:14, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:11, color:"#aaa", fontWeight:600, marginRight:4 }}>FILTER:</span>
        <button onClick={()=>setFilter("")}
          style={{ padding:"4px 12px", border:"1.5px solid", borderRadius:20, cursor:"pointer",
            fontSize:11, fontWeight:600,
            borderColor: !filter?"#1a1a1a":"#e0e0e0",
            background:  !filter?"#1a1a1a":"#fff",
            color:       !filter?"#fff":"#888" }}>All</button>
        {ROLES.map(r=>{
          const c = rc(r);
          return (
            <button key={r} onClick={()=>setFilter(filter===r?"":r)}
              style={{ padding:"4px 12px", border:"1.5px solid", borderRadius:20, cursor:"pointer",
                fontSize:11, fontWeight:600,
                borderColor: filter===r?c.bg:"#e0e0e0",
                background:  filter===r?c.bg:"#fff",
                color:       filter===r?"#fff":"#888" }}>{r}</button>
          );
        })}
      </div>

      {/* ── MAIN GRID ── */}
      <div style={{ background:"#fff", borderRadius:16, overflow:"hidden",
        boxShadow:"0 2px 20px rgba(0,0,0,.08)", border:"1px solid #f0f0ec" }}>

        {/* ── HEADER ROW ── */}
        <div style={{ display:"grid", gridTemplateColumns:"190px repeat(7,1fr)",
          borderBottom:"2px solid #f0f0ec", position:"sticky", top:0, zIndex:10 }}>
          <div style={{ padding:"12px 16px", background:"#f8f8f6", borderRight:"1px solid #f0f0ec" }}>
            <div style={{ fontSize:10, fontWeight:700, color:"#aaa", textTransform:"uppercase", letterSpacing:1 }}>Employee</div>
            <div style={{ fontSize:10, color:"#ccc", marginTop:2 }}>{visibleEmps.length} staff</div>
          </div>
          {days.map((d,i)=>{
            const dk      = isoDate(d);
            const isToday = dk===today;
            const count   = shiftsOnDay(dk).length;
            return (
              <div key={i} style={{
                padding:"10px 8px", textAlign:"center",
                background: isToday?"#f5b800": i>=5?"#fafaf8":"#fff",
                borderRight: i<6?"1px solid #f0f0ec":"none"
              }}>
                <div style={{ fontSize:9, fontWeight:700, textTransform:"uppercase",
                  letterSpacing:1, color: isToday?"#1a1a1a":"#aaa" }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize:22, fontWeight:900, color: isToday?"#1a1a1a":"#222", lineHeight:1.2 }}>
                  {d.getDate()}
                </div>
                <div style={{ fontSize:9, color: isToday?"#1a1a1a99":"#bbb" }}>
                  {d.toLocaleDateString("en",{month:"short"})}
                </div>
                {count > 0 && (
                  <div style={{ marginTop:3, background: isToday?"rgba(0,0,0,.15)":"#f0f0ec",
                    borderRadius:20, padding:"1px 7px", display:"inline-block",
                    fontSize:9, fontWeight:700, color: isToday?"#1a1a1a":"#888" }}>
                    {count} shift{count!==1?"s":""}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── EMPLOYEE ROWS ── */}
        {loading ? (
          <div style={{ padding:60, textAlign:"center", color:"#aaa" }}>Loading schedule…</div>
        ) : visibleEmps.length === 0 ? (
          <div style={{ padding:60, textAlign:"center", color:"#aaa" }}>
            <div style={{ fontSize:36, marginBottom:10 }}>👥</div>
            {t("noData")}
          </div>
        ) : visibleEmps.map((emp, ei) => {
          const empId   = emp._id || emp.id;
          const empName = emp.name || `${emp.firstName} ${emp.lastName}`;
          const weekMins = empWeekMins(empId);
          const initials = empName.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

          return (
            <div key={empId} style={{
              display:"grid", gridTemplateColumns:"190px repeat(7,1fr)",
              borderBottom: ei < visibleEmps.length-1 ? "1px solid #f0f0ec":"none",
            }}>
              {/* ── Employee Cell ── */}
              <div style={{ padding:"10px 14px", borderRight:"1px solid #f0f0ec",
                background: ei%2===0?"#fff":"#fafaf8",
                display:"flex", flexDirection:"column", justifyContent:"center" }}>
                <div style={{ display:"flex", alignItems:"center", gap:9 }}>
                  <div style={{ width:32, height:32, borderRadius:"50%", background:"#f5b800",
                    display:"flex", alignItems:"center", justifyContent:"center",
                    fontWeight:800, fontSize:12, color:"#1a1a1a", flexShrink:0 }}>
                    {initials}
                  </div>
                  <div style={{ minWidth:0 }}>
                    <div style={{ fontSize:12, fontWeight:700, color:"#1a1a1a",
                      whiteSpace:"nowrap", overflow:"hidden", textOverflow:"ellipsis" }}>{empName}</div>
                    <div style={{ fontSize:10, color:"#aaa" }}>{emp.position}</div>
                  </div>
                </div>
                <div style={{ marginTop:6, fontSize:10, fontWeight:600,
                  color: weekMins > 0 ? "#22c55e":"#ddd" }}>
                  {weekMins > 0 ? `${fmtHrs(weekMins)} this week` : "No shifts"}
                </div>
              </div>

              {/* ── Day Cells ── */}
              {days.map((d, di) => {
                const dateKey   = isoDate(d);
                const dayShifts = shiftsFor(empId, dateKey);
                const isToday   = dateKey === today;
                const isWknd    = di >= 5;

                return (
                  <div key={di}
                    onClick={() => !dayShifts.length && setModal({ emp, date: dateKey })}
                    style={{
                      padding:"6px 5px", minHeight:80,
                      borderRight: di<6?"1px solid #f0f0ec":"none",
                      background: isToday?"#fffbeb": isWknd?"#f9f9f7": ei%2===0?"#fff":"#fafaf8",
                      cursor: dayShifts.length ? "default":"pointer",
                      transition:"background .15s",
                    }}
                    onMouseEnter={e => { if(!dayShifts.length) e.currentTarget.style.background="#f0f7ff"; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isToday?"#fffbeb":isWknd?"#f9f9f7":ei%2===0?"#fff":"#fafaf8"; }}
                  >
                    {dayShifts.length === 0 ? (
                      <div style={{ height:"100%", display:"flex", alignItems:"center",
                        justifyContent:"center", color:"#e0e0e0", fontSize:20,
                        paddingTop:16, userSelect:"none" }}>+</div>
                    ) : (
                      dayShifts.map(s => {
                        const c    = rc(s.role);
                        const mins = calcMins(s.startTime, s.endTime);
                        return (
                          <div key={s._id}
                            onClick={e => { e.stopPropagation(); setModal({ emp, date: dateKey, shift: s }); }}
                            style={{
                              background: c.bg,
                              borderRadius:8, padding:"7px 8px",
                              marginBottom:4, cursor:"pointer",
                              boxShadow:`0 2px 6px ${c.bg}55`,
                              border: s.isDraft ? "2px dashed rgba(255,255,255,.6)" : "2px solid transparent",
                              position:"relative",
                            }}>
                            {s.isDraft && (
                              <div style={{ position:"absolute", top:3, right:5,
                                fontSize:8, color:"rgba(255,255,255,.8)", fontWeight:700,
                                textTransform:"uppercase", letterSpacing:.5 }}>DRAFT</div>
                            )}
                            <div style={{ color:"#fff", fontSize:10, fontWeight:700, lineHeight:1.4 }}>
                              {fmt12(s.startTime)}–{fmt12(s.endTime)}
                            </div>
                            {mins > 0 && (
                              <div style={{ color:"rgba(255,255,255,.75)", fontSize:9 }}>{fmtHrs(mins)}</div>
                            )}
                            <div style={{ color:"rgba(255,255,255,.9)", fontSize:10, fontWeight:600, marginTop:2 }}>
                              {s.role}
                            </div>
                            {s.area && (
                              <div style={{ color:"rgba(255,255,255,.7)", fontSize:9 }}>📍 {s.area}</div>
                            )}
                          </div>
                        );
                      })
                    )}

                    {/* Add more button if already has shifts */}
                    {dayShifts.length > 0 && (
                      <button
                        onClick={e=>{ e.stopPropagation(); setModal({ emp, date: dateKey }); }}
                        style={{ width:"100%", background:"none", border:"1px dashed #e0e0e0",
                          borderRadius:6, color:"#ccc", fontSize:11, cursor:"pointer",
                          padding:"3px 0", marginTop:2 }}>+ add</button>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}

        {/* ── TOTALS ROW ── */}
        {!loading && visibleEmps.length > 0 && (
          <div style={{ display:"grid", gridTemplateColumns:"190px repeat(7,1fr)",
            borderTop:"2px solid #f0f0ec", background:"#f8f8f6" }}>
            <div style={{ padding:"10px 14px", fontSize:11, fontWeight:700, color:"#aaa",
              textTransform:"uppercase", letterSpacing:.5, display:"flex", alignItems:"center" }}>
              Daily Coverage
            </div>
            {days.map((d, i) => {
              const dk      = isoDate(d);
              const count   = shiftsOnDay(dk).length;
              const dayMins = shiftsOnDay(dk).reduce((a,s)=>a+calcMins(s.startTime,s.endTime),0);
              const pct     = employees.length ? Math.round((count/employees.length)*100) : 0;
              return (
                <div key={i} style={{ padding:"10px 8px", textAlign:"center",
                  borderRight: i<6?"1px solid #f0f0ec":"none" }}>
                  <div style={{ fontSize:12, fontWeight:800,
                    color: pct>=80?"#22c55e": pct>=50?"#f59e0b":"#dc2626" }}>
                    {pct}%
                  </div>
                  <div style={{ fontSize:9, color:"#bbb" }}>{count} staff · {fmtHrs(dayMins)}</div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LEGEND ── */}
      <div style={{ display:"flex", gap:12, marginTop:16, flexWrap:"wrap", alignItems:"center" }}>
        <span style={{ fontSize:10, color:"#aaa", fontWeight:700, textTransform:"uppercase", letterSpacing:1 }}>Roles:</span>
        {Object.entries(ROLE_COLORS).map(([role,c])=>(
          <div key={role} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:c.bg }} />
            <span style={{ fontSize:11, color:"#888" }}>{role}</span>
          </div>
        ))}
        <div style={{ marginLeft:8, display:"flex", alignItems:"center", gap:5 }}>
          <div style={{ width:10, height:10, borderRadius:3, border:"2px dashed #999" }} />
          <span style={{ fontSize:11, color:"#888" }}>Draft</span>
        </div>
      </div>

      {/* ── HELP TIP ── */}
      <div style={{ marginTop:14, background:"#f0f7ff", borderRadius:12, padding:"10px 16px",
        fontSize:12, color:"#3b82f6", border:"1px solid #bfdbfe" }}>
        💡 <strong>Tip:</strong> Click any empty cell to add a shift. Click an existing shift to edit or delete it. Drafts show a dashed border — publish when ready.
      </div>
    </div>
  );
}