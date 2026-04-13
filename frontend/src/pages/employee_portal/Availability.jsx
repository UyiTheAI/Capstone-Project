import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const DAYS  = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const SLOTS = [
  { key:"morning",   color:"#f59e0b" },
  { key:"afternoon", color:"#0891b2" },
  { key:"evening",   color:"#4f46e5" },
];
const defaultAvail = () =>
  Object.fromEntries(DAYS.map(d=>[d,{morning:true,afternoon:true,evening:false}]));

export default function Availability({ user }) {
  const { t } = useLanguage();
  const [avail,     setAvail]     = useState(defaultAvail());
  const [availType, setAvailType] = useState(user?.availability||"Full-Time");
  const [loading,   setLoading]   = useState(false);
  const [saved,     setSaved]     = useState(false);
  const [err,       setErr]       = useState("");

  useEffect(() => { if(user?.availabilitySchedule) setAvail(user.availabilitySchedule); },[user]);

  const toggle = (day,slot) => setAvail(p=>({...p,[day]:{...p[day],[slot]:!p[day][slot]}}));

  const handleSave = async () => {
    setLoading(true); setErr("");
    try {
      await api.put("/users/me/availability",{availabilitySchedule:avail,availability:availType});
      setSaved(true); setTimeout(()=>setSaved(false),2500);
    } catch(e){ setErr(e.response?.data?.message||"Failed to save."); }
    finally  { setLoading(false); }
  };

  const slotLabel = { morning:t("morning"), afternoon:t("afternoon"), evening:t("evening") };
  const filled = DAYS.reduce((a,d)=>a+SLOTS.filter(s=>avail[d]?.[s.key]).length,0);

  return (
    <div className="su-page">
      {/* Header */}
      <div style={{ background:"#1a1a1a",borderRadius:16,padding:"22px 24px",marginBottom:20,display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:16 }}>
        <div>
          <div style={{ fontFamily:"var(--font-head)",fontSize:22,color:"#f5b800",letterSpacing:1 }}>{t("availabilityTitle")}</div>
          <div style={{ fontSize:13,color:"#666",marginTop:4 }}>{filled} of {DAYS.length*SLOTS.length} slots available this week</div>
        </div>
        <div style={{ display:"flex",alignItems:"center",gap:12 }}>
          <select value={availType} onChange={e=>setAvailType(e.target.value)}
            style={{ padding:"8px 14px",border:"1.5px solid #333",borderRadius:8,background:"#222",color:"#fff",fontFamily:"var(--font-body)",fontSize:13,cursor:"pointer",outline:"none" }}>
            <option value="Full-Time">{t("fullTime")}</option>
            <option value="Part-Time">{t("partTime")}</option>
            <option value="On-Call">{t("onCall")}</option>
          </select>
          <button onClick={handleSave} disabled={loading}
            style={{ padding:"9px 22px",background:"#f5b800",color:"#1a1a1a",border:"none",borderRadius:8,fontFamily:"var(--font-body)",fontWeight:800,fontSize:13,cursor:loading?"not-allowed":"pointer" }}>
            {loading?<span className="spinner" style={{ borderTopColor:"#1a1a1a" }} />:saved?`✓ ${t("availabilitySaved")}`:t("saveAvailability")}
          </button>
        </div>
      </div>

      {err && <div className="su-alert-err">{err}</div>}

      {/* Quick set */}
      <div style={{ display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center" }}>
        <span style={{ fontSize:12,color:"#aaa",marginRight:4 }}>{t("quickSelect")}:</span>
        {[
          ["All available",  ()=>setAvail(Object.fromEntries(DAYS.map(d=>[d,{morning:true,afternoon:true,evening:true}])))],
          ["Weekdays only",  ()=>setAvail(Object.fromEntries(DAYS.map((d,i)=>[d,{morning:i<5,afternoon:i<5,evening:false}])))],
          ["Mornings only",  ()=>setAvail(Object.fromEntries(DAYS.map(d=>[d,{morning:true,afternoon:false,evening:false}])))],
          ["Clear all",      ()=>setAvail(Object.fromEntries(DAYS.map(d=>[d,{morning:false,afternoon:false,evening:false}])))],
        ].map(([l,fn])=>(
          <button key={l} onClick={fn}
            style={{ padding:"6px 14px",background:"#fff",border:"1.5px solid #e5e5e5",borderRadius:8,fontSize:12,fontWeight:600,color:"#555",cursor:"pointer",fontFamily:"var(--font-body)" }}
            onMouseOver={e=>{e.currentTarget.style.borderColor="#1a1a1a";e.currentTarget.style.color="#1a1a1a";}}
            onMouseOut={e=>{e.currentTarget.style.borderColor="#e5e5e5";e.currentTarget.style.color="#555";}}>{l}</button>
        ))}
      </div>

      {/* Grid */}
      <div style={{ background:"#fff",borderRadius:16,border:"1px solid #ebebeb",overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.04)" }}>
        {/* Day headers */}
        <div style={{ display:"grid",gridTemplateColumns:"110px repeat(7,1fr)",background:"#1a1a1a" }}>
          <div style={{ padding:"12px 16px",fontSize:11,color:"#555",fontWeight:700,textTransform:"uppercase" }}>Slot</div>
          {DAYS.map((d,i)=>{
            const now=new Date(), diff=(i+1)-(now.getDay()||7), dd=new Date(now); dd.setDate(now.getDate()+diff);
            const isToday=dd.toDateString()===now.toDateString();
            return(
              <div key={d} style={{ padding:"12px 8px",textAlign:"center" }}>
                <div style={{ fontSize:11,fontWeight:700,color:isToday?"#f5b800":"#888",textTransform:"uppercase",letterSpacing:.5 }}>{d}</div>
                <div style={{ fontSize:12,color:isToday?"#f5b800":"#555",marginTop:2 }}>{dd.getDate()}</div>
              </div>
            );
          })}
        </div>

        {/* Slot rows */}
        {SLOTS.map((slot,si)=>(
          <div key={slot.key} style={{ display:"grid",gridTemplateColumns:"110px repeat(7,1fr)",borderTop:"1px solid #f0f0f0",background:si%2===0?"#fff":"#fafafa" }}>
            <div style={{ padding:"14px 16px",display:"flex",flexDirection:"column",justifyContent:"center",borderRight:"1px solid #f0f0f0" }}>
              <div style={{ display:"flex",alignItems:"center",gap:6 }}>
                <div style={{ width:8,height:8,borderRadius:"50%",background:slot.color }} />
                <span style={{ fontSize:13,fontWeight:700,color:"#1a1a1a" }}>{slotLabel[slot.key]}</span>
              </div>
            </div>
            {DAYS.map(day=>{
              const on=avail[day]?.[slot.key]??false;
              return(
                <div key={day} style={{ display:"flex",alignItems:"center",justifyContent:"center",padding:"12px 8px",cursor:"pointer" }} onClick={()=>toggle(day,slot.key)}>
                  <div style={{ width:36,height:36,borderRadius:10,background:on?slot.color:"#f0f0f0",display:"flex",alignItems:"center",justifyContent:"center",transition:"all .15s",boxShadow:on?`0 2px 8px ${slot.color}40`:"none" }}>
                    {on?<span style={{ color:"#fff",fontSize:16,fontWeight:800 }}>✓</span>:<span style={{ color:"#ccc",fontSize:14 }}>—</span>}
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Legend */}
      <div style={{ display:"flex",gap:16,marginTop:12,flexWrap:"wrap" }}>
        {SLOTS.map(s=>(
          <div key={s.key} style={{ display:"flex",alignItems:"center",gap:6,fontSize:12,color:"#888" }}>
            <div style={{ width:10,height:10,borderRadius:3,background:s.color }} />{slotLabel[s.key]}
          </div>
        ))}
      </div>
    </div>
  );
}