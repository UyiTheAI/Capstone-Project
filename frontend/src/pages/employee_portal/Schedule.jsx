import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

const ROLE_COLORS = {
  Waitstaff:       "#4f46e5",
  Dishwasher:      "#0891b2",
  "Kitchen Staff": "#16a34a",
  Bartender:       "#dc2626",
  Manager:         "#7c3aed",
  Server:          "#ea580c",
  Cook:            "#ca8a04",
  Host:            "#0d9488",
  default:         "#6b7280",
};

const getColor = (role) => ROLE_COLORS[role] || ROLE_COLORS.default;

function fmt12(t) {
  if (!t) return "";
  const [h, m] = t.split(":").map(Number);
  const ampm = h >= 12 ? "P" : "A";
  const h12 = h % 12 || 12;
  return m ? `${h12}:${String(m).padStart(2,"0")}${ampm}` : `${h12}${ampm}`;
}

function calcHours(start, end) {
  if (!start || !end) return null;
  const [sh, sm] = start.split(":").map(Number);
  const [eh, em] = end.split(":").map(Number);
  const diff = (eh * 60 + em) - (sh * 60 + sm);
  if (diff <= 0) return null;
  const h = Math.floor(diff / 60);
  const m = diff % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

const DAY_NAMES = ["MON","TUE","WED","THU","FRI","SAT","SUN"];

export default function Schedule({ user }) {
  const [shifts, setShifts]         = useState([]);
  const [loading, setLoading]       = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);

  const getWeekDates = (offset) => {
    const base = new Date();
    const day  = base.getDay();
    const mon  = new Date(base);
    mon.setDate(base.getDate() - ((day + 6) % 7) + offset * 7);
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(mon);
      d.setDate(mon.getDate() + i);
      return d;
    });
  };

  const days    = getWeekDates(weekOffset);
  const isoDate = (d) => d.toISOString().split("T")[0];
  const today   = isoDate(new Date());

  const weekLabel = `${days[0].toLocaleDateString("en",{month:"short",day:"numeric"})} – ${days[6].toLocaleDateString("en",{month:"short",day:"numeric",year:"numeric"})}`;

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const res = await api.get(`/shifts/week?start=${isoDate(days[0])}&end=${isoDate(days[6])}`);
        setShifts(res.data.shifts || []);
      } catch {
        setShifts([]);
      } finally {
        setLoading(false);
      }
    })();
  }, [weekOffset]);

  const shiftsOnDay = (d) => {
    const ds = isoDate(d);
    return shifts.filter((s) => {
      const sd = typeof s.date === "string" ? s.date.split("T")[0] : new Date(s.date).toISOString().split("T")[0];
      return sd === ds;
    });
  };

  const totalMins = shifts.reduce((acc, s) => {
    const [sh, sm] = (s.startTime||"0:0").split(":").map(Number);
    const [eh, em] = (s.endTime||"0:0").split(":").map(Number);
    return acc + Math.max(0, (eh*60+em)-(sh*60+sm));
  }, 0);
  const totalHoursLabel = totalMins ? `${Math.floor(totalMins/60)}h${totalMins%60?` ${totalMins%60}m`:""}` : "0h";

  const name = user?.name || `${user?.firstName||""} ${user?.lastName||""}`.trim();
  const initials = name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);

  return (
    <div className="su-page" style={{ fontFamily:"'DM Sans', sans-serif" }}>

      {/* ── TOP BAR ── */}
      <div style={{ display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:12, marginBottom:18 }}>
        <div style={{ display:"flex", alignItems:"center", gap:14 }}>
          <div style={{ width:42, height:42, borderRadius:"50%", background:"#f5b800",
            display:"flex", alignItems:"center", justifyContent:"center",
            fontWeight:800, fontSize:15, color:"#1a1a1a" }}>{initials}</div>
          <div>
            <div style={{ fontWeight:800, fontSize:16 }}>{name}</div>
            <div style={{ fontSize:12, color:"#888" }}>{user?.position} · {user?.availability}</div>
          </div>
        </div>

        <div style={{ display:"flex", alignItems:"center", gap:8, flexWrap:"wrap" }}>
          <button onClick={() => setWeekOffset(o=>o-1)}
            style={{ background:"#f0f0ec", border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontWeight:600, fontSize:13 }}>‹</button>
          <button onClick={() => setWeekOffset(0)}
            style={{ background: weekOffset===0 ? "#f5b800":"#f0f0ec", border:"none", borderRadius:8,
              padding:"7px 14px", cursor:"pointer", fontWeight:700, fontSize:13 }}>Today</button>
          <span style={{ fontWeight:700, fontSize:14, padding:"0 6px", color:"#2563eb" }}>{weekLabel}</span>
          <button onClick={() => setWeekOffset(o=>o+1)}
            style={{ background:"#f0f0ec", border:"none", borderRadius:8, padding:"7px 14px", cursor:"pointer", fontWeight:600, fontSize:13 }}>›</button>
        </div>

        {/* weekly hours pill */}
        <div style={{ background:"#1a1a1a", borderRadius:10, padding:"8px 18px", display:"flex", gap:14 }}>
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#f5b800", fontWeight:800, fontSize:18 }}>{shifts.length}</div>
            <div style={{ color:"#888", fontSize:10 }}>SHIFTS</div>
          </div>
          <div style={{ width:1, background:"#333" }} />
          <div style={{ textAlign:"center" }}>
            <div style={{ color:"#f5b800", fontWeight:800, fontSize:18 }}>{totalHoursLabel}</div>
            <div style={{ color:"#888", fontSize:10 }}>HOURS</div>
          </div>
        </div>
      </div>

      {/* ── CALENDAR GRID ── */}
      <div style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 16px rgba(0,0,0,.07)", border:"1px solid #f0f0ec" }}>

        {/* Day headers */}
        <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", borderBottom:"2px solid #f0f0ec" }}>
          {days.map((d, i) => {
            const isToday = isoDate(d) === today;
            const isWknd  = i >= 5;
            return (
              <div key={i} style={{
                padding:"12px 8px", textAlign:"center",
                background: isToday ? "#f5b800" : isWknd ? "#fafafa" : "#fff",
                borderRight: i < 6 ? "1px solid #f0f0ec" : "none"
              }}>
                <div style={{ fontSize:10, fontWeight:700, letterSpacing:1, textTransform:"uppercase",
                  color: isToday ? "#1a1a1a" : "#aaa" }}>{DAY_NAMES[i]}</div>
                <div style={{ fontSize:26, fontWeight:900, lineHeight:1.1,
                  color: isToday ? "#1a1a1a" : "#222" }}>{d.getDate()}</div>
                {isToday && (
                  <div style={{ width:6, height:6, borderRadius:"50%", background:"#1a1a1a", margin:"4px auto 0" }} />
                )}
              </div>
            );
          })}
        </div>

        {/* Shift cells */}
        {loading ? (
          <div style={{ padding:60, textAlign:"center", color:"#aaa" }}>Loading your schedule…</div>
        ) : (
          <div style={{ display:"grid", gridTemplateColumns:"repeat(7,1fr)", minHeight:280 }}>
            {days.map((d, i) => {
              const dayShifts = shiftsOnDay(d);
              const isWknd    = i >= 5;
              const isToday   = isoDate(d) === today;

              return (
                <div key={i} style={{
                  borderRight: i < 6 ? "1px solid #f0f0ec" : "none",
                  background: isWknd ? "#fafafa" : "#fff",
                  padding: 8, minHeight:220,
                  borderTop:"1px solid #f5f5f5",
                  position:"relative"
                }}>
                  {isToday && (
                    <div style={{ position:"absolute", top:0, left:0, right:0, height:3, background:"#f5b800", borderRadius:"0 0 4px 4px" }} />
                  )}

                  {dayShifts.length === 0 ? (
                    <div style={{ height:"100%", display:"flex", alignItems:"center", justifyContent:"center",
                      flexDirection:"column", paddingTop:40 }}>
                      <div style={{ fontSize:28, color:"#e5e5e5" }}>–</div>
                      <div style={{ fontSize:10, color:"#ddd", marginTop:4, fontWeight:600 }}>OFF</div>
                    </div>
                  ) : (
                    dayShifts.map((s) => {
                      const bg  = getColor(s.role);
                      const hrs = calcHours(s.startTime, s.endTime);
                      const timeStr = `${fmt12(s.startTime)} – ${fmt12(s.endTime)}`;
                      return (
                        <div key={s._id} style={{
                          background: bg,
                          borderRadius: 8,
                          padding: "9px 10px",
                          marginBottom: 6,
                          boxShadow: `0 3px 8px ${bg}55`,
                          cursor: "default",
                        }}>
                          <div style={{ color:"#fff", fontSize:11, fontWeight:700, marginBottom:1 }}>
                            {timeStr}{hrs ? ` · ${hrs}` : ""}
                          </div>
                          <div style={{ color:"rgba(255,255,255,.9)", fontSize:12, fontWeight:800, marginTop:3 }}>
                            {s.role}
                          </div>
                          {s.area && (
                            <div style={{ color:"rgba(255,255,255,.75)", fontSize:10, marginTop:2 }}>
                              {s.area}
                            </div>
                          )}
                          {s.status && s.status !== "scheduled" && (
                            <div style={{
                              marginTop:6, display:"inline-block",
                              background:"rgba(0,0,0,.2)", color:"#fff",
                              fontSize:9, padding:"2px 7px", borderRadius:20,
                              textTransform:"uppercase", fontWeight:700, letterSpacing:.5
                            }}>{s.status}</div>
                          )}
                        </div>
                      );
                    })
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ── LEGEND ── */}
      <div style={{ display:"flex", gap:12, marginTop:14, flexWrap:"wrap", padding:"0 2px" }}>
        {Object.entries(ROLE_COLORS).filter(([k])=>k!=="default").map(([role, bg]) => (
          <div key={role} style={{ display:"flex", alignItems:"center", gap:5 }}>
            <div style={{ width:10, height:10, borderRadius:3, background:bg }} />
            <span style={{ fontSize:11, color:"#888" }}>{role}</span>
          </div>
        ))}
      </div>

      {/* ── WEEK SUMMARY STRIP ── */}
      {!loading && shifts.length > 0 && (
        <div style={{ marginTop:16, background:"#fff", borderRadius:14, padding:"14px 20px",
          boxShadow:"0 2px 8px rgba(0,0,0,.05)", display:"flex", gap:8, flexWrap:"wrap" }}>
          <div style={{ fontWeight:700, fontSize:13, color:"#1a1a1a", marginRight:8, alignSelf:"center" }}>
            This Week:
          </div>
          {shifts.map((s) => {
            const bg  = getColor(s.role);
            const dateLabel = new Date(s.date).toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"});
            const hrs = calcHours(s.startTime, s.endTime);
            return (
              <div key={s._id} style={{
                background: bg + "18", border: `1.5px solid ${bg}44`,
                borderRadius:8, padding:"6px 12px", fontSize:12
              }}>
                <span style={{ fontWeight:700, color:bg }}>{dateLabel}</span>
                <span style={{ color:"#666", marginLeft:6 }}>
                  {fmt12(s.startTime)}–{fmt12(s.endTime)}{hrs ? ` (${hrs})` : ""}
                </span>
                <span style={{ marginLeft:6, color:"#999" }}>· {s.role}</span>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}