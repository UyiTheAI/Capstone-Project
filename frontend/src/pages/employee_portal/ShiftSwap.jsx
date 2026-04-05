import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

const statusColor = { pending:"#f59e0b", approved:"#16a34a", rejected:"#dc2626" };
const statusBg    = { pending:"#fff8e1", approved:"#dcfce7", rejected:"#fee2e2" };

export default function ShiftSwap({ user }) {
  const [myShifts,   setMyShifts]   = useState([]);
  const [orgEmps,    setOrgEmps]    = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading,    setLoading]    = useState(true);

  // Form state
  const [selectedShift, setSelectedShift] = useState(null);
  const [proposedEmp,   setProposedEmp]   = useState("");
  const [reason,        setReason]        = useState("");
  const [coverageNote,  setCoverageNote]  = useState("");
  const [submitting,    setSubmitting]    = useState(false);
  const [error,         setError]         = useState("");
  const [success,       setSuccess]       = useState("");
  const [step,          setStep]          = useState(1); // 1=select shift, 2=select employee, 3=confirm

  useEffect(() => { fetchAll(); }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const today  = new Date().toISOString().split("T")[0];
      const future = new Date(Date.now() + 30*24*60*60*1000).toISOString().split("T")[0];
      const [shiftsRes, empsRes, swapsRes] = await Promise.all([
        api.get(`/shifts?from=${today}&to=${future}`),
        api.get("/users/org-employees"),
        api.get("/swaps"),
      ]);
      const allShifts = shiftsRes.data.shifts || [];
      const myId = String(user?.id || user?._id || "");
      setMyShifts(allShifts.filter(s => {
        const empId = String(s.employee?._id || s.employee?.id || s.employee || "");
        return empId === myId && s.status !== "swapped";
      }));
      setOrgEmps((empsRes.data.users || []).filter(e => String(e._id||e.id) !== myId));
      setMyRequests(swapsRes.data.swaps || []);
    } catch(err) {
      setError("Failed to load data: " + (err.response?.data?.message || err.message));
    } finally { setLoading(false); }
  };

  const handleSubmit = async () => {
    setError(""); setSuccess("");
    if (!selectedShift) { setError("Please select a shift."); return; }
    if (!proposedEmp)   { setError("Please select a replacement employee."); return; }
    if (!reason.trim()) { setError("Please provide a reason."); return; }

    setSubmitting(true);
    try {
      const shiftDate = new Date(selectedShift.date).toLocaleDateString("en", { weekday:"short", month:"short", day:"numeric", year:"numeric" });
      await api.post("/swaps", {
        proposedEmployeeId: proposedEmp,
        shiftId:            selectedShift._id,
        shiftDate,
        shiftTime:  `${selectedShift.startTime} – ${selectedShift.endTime}`,
        shiftRole:  selectedShift.role || selectedShift.area || "Shift",
        reason,
        coverageNote,
      });
      setSuccess("✅ Swap request submitted! You'll be notified when it's reviewed.");
      setSelectedShift(null); setProposedEmp(""); setReason(""); setCoverageNote(""); setStep(1);
      fetchAll();
    } catch(err) {
      setError(err.response?.data?.message || "Failed to submit swap request.");
    } finally { setSubmitting(false); }
  };

  const inputStyle = { width:"100%", padding:"10px 14px", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:14, outline:"none", boxSizing:"border-box" };

  const pendingReqs  = myRequests.filter(r => r.status === "pending");
  const resolvedReqs = myRequests.filter(r => r.status !== "pending");
  const selectedEmpObj = orgEmps.find(e => String(e._id||e.id) === proposedEmp);

  if (loading) return <div style={{ padding:60, textAlign:"center", color:"#aaa" }}>Loading…</div>;

  return (
    <div className="su-page">
      <div className="su-title" style={{ marginBottom:4 }}>SHIFT SWAP</div>
      <p style={{ color:"#888", marginBottom:24, fontSize:14 }}>
        Request another employee to cover your shift. Your manager must approve the swap.
      </p>

      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:28, alignItems:"start" }}>

        {/* ── LEFT: Request Form ────────────────────────── */}
        <div style={{ background:"#fff", borderRadius:20, padding:"24px", boxShadow:"0 4px 20px rgba(0,0,0,.06)", border:"1px solid #f0f0f0" }}>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:22, margin:"0 0 20px" }}>New Swap Request</h3>

          {error   && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>⚠️ {error}</div>}
          {success && <div style={{ padding:"10px 14px", background:"#dcfce7", borderRadius:8, color:"#16a34a", fontSize:13, marginBottom:14 }}>{success}</div>}

          {/* Step indicators */}
          <div style={{ display:"flex", gap:0, marginBottom:20 }}>
            {[{n:1,label:"Select Shift"},{n:2,label:"Select Employee"},{n:3,label:"Confirm"}].map((s,i) => (
              <React.Fragment key={s.n}>
                <div style={{ display:"flex", alignItems:"center", gap:6, flex:1 }}>
                  <div style={{ width:26, height:26, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", background: step>=s.n?"#f5b800":"#e5e5e5", color: step>=s.n?"#1a1a1a":"#aaa", fontWeight:800, fontSize:12, flexShrink:0 }}>
                    {step>s.n?"✓":s.n}
                  </div>
                  <span style={{ fontSize:11, color: step>=s.n?"#1a1a1a":"#aaa", fontWeight: step===s.n?700:400 }}>{s.label}</span>
                </div>
                {i<2 && <div style={{ flex:0, width:20, height:1, background:"#e5e5e5", alignSelf:"center" }} />}
              </React.Fragment>
            ))}
          </div>

          {/* Step 1: Select shift */}
          {step === 1 && (
            <div>
              <div style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", marginBottom:10 }}>Your Upcoming Shifts</div>
              {myShifts.length === 0 ? (
                <div style={{ padding:24, textAlign:"center", color:"#aaa", background:"#f9f9f7", borderRadius:12 }}>
                  <div style={{ fontSize:28, marginBottom:8 }}>📅</div>
                  No upcoming shifts found.
                </div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:320, overflowY:"auto" }}>
                  {myShifts.map(s => {
                    const d    = new Date(s.date).toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"});
                    const isSel= selectedShift?._id === s._id;
                    return (
                      <div key={s._id} onClick={() => { setSelectedShift(s); setStep(2); }}
                        style={{ padding:"12px 16px", borderRadius:12, cursor:"pointer", border:`2px solid ${isSel?"#f5b800":"#f0f0f0"}`, background: isSel?"#fff8e1":"#fff", transition:"all .15s" }}>
                        <div style={{ fontWeight:700, fontSize:14 }}>{d}</div>
                        <div style={{ fontSize:13, color:"#888", marginTop:2 }}>{s.startTime} – {s.endTime} · {s.role||s.area||"Shift"}</div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Step 2: Select employee */}
          {step === 2 && (
            <div>
              <div style={{ background:"#f9f9f7", borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13 }}>
                <span style={{ color:"#888" }}>Shift: </span>
                <strong>{new Date(selectedShift.date).toLocaleDateString("en",{weekday:"short",month:"short",day:"numeric"})} · {selectedShift.startTime}–{selectedShift.endTime}</strong>
              </div>
              <div style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", marginBottom:10 }}>Choose Replacement</div>
              {orgEmps.length === 0 ? (
                <div style={{ padding:24, textAlign:"center", color:"#aaa", background:"#f9f9f7", borderRadius:12 }}>No other employees in your org yet.</div>
              ) : (
                <div style={{ display:"flex", flexDirection:"column", gap:8, maxHeight:280, overflowY:"auto" }}>
                  {orgEmps.map(e => {
                    const id   = String(e._id||e.id);
                    const name = e.name || `${e.firstName} ${e.lastName}`;
                    const ini  = name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2);
                    const isSel= proposedEmp === id;
                    return (
                      <div key={id} onClick={() => { setProposedEmp(id); setStep(3); }}
                        style={{ padding:"12px 16px", borderRadius:12, cursor:"pointer", border:`2px solid ${isSel?"#4f46e5":"#f0f0f0"}`, background: isSel?"#ede9fe":"#fff", display:"flex", alignItems:"center", gap:12 }}>
                        <div style={{ width:36, height:36, borderRadius:"50%", background:"#4f46e5", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:13, flexShrink:0 }}>{ini}</div>
                        <div>
                          <div style={{ fontWeight:700, fontSize:14 }}>{name}</div>
                          <div style={{ fontSize:12, color:"#aaa" }}>{e.position} · {e.availability}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
              <button onClick={()=>setStep(1)} style={{ marginTop:12, background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)", padding:0 }}>← Back</button>
            </div>
          )}

          {/* Step 3: Reason + confirm */}
          {step === 3 && (
            <div>
              <div style={{ background:"#f0fdf4", border:"1px solid #86efac", borderRadius:10, padding:"12px 16px", marginBottom:16, fontSize:13 }}>
                <div style={{ fontWeight:700, color:"#16a34a", marginBottom:4 }}>✅ Swap Summary</div>
                <div style={{ color:"#555" }}>
                  Shift: <strong>{new Date(selectedShift.date).toLocaleDateString("en",{weekday:"long",month:"short",day:"numeric"})} · {selectedShift.startTime}–{selectedShift.endTime}</strong><br/>
                  Replace with: <strong>{selectedEmpObj?.name || `${selectedEmpObj?.firstName} ${selectedEmpObj?.lastName}`}</strong>
                </div>
              </div>

              <div style={{ marginBottom:14 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase" }}>Reason *</label>
                <textarea value={reason} onChange={e=>setReason(e.target.value)}
                  placeholder="Why do you need to swap this shift?"
                  style={{ ...inputStyle, height:80, resize:"vertical" }} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase" }}>Coverage Note (optional)</label>
                <textarea value={coverageNote} onChange={e=>setCoverageNote(e.target.value)}
                  placeholder="Any notes for the replacement employee or manager?"
                  style={{ ...inputStyle, height:60, resize:"vertical" }} />
              </div>

              <button onClick={handleSubmit} disabled={submitting}
                style={{ width:"100%", padding:"13px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:"pointer", opacity:submitting?.7:1, marginBottom:10 }}>
                {submitting ? "Submitting…" : "Submit Swap Request"}
              </button>
              <button onClick={()=>setStep(2)} style={{ width:"100%", background:"none", border:"none", color:"#aaa", cursor:"pointer", fontSize:13, fontFamily:"var(--font-body)" }}>← Back</button>
            </div>
          )}
        </div>

        {/* ── RIGHT: My Requests ────────────────────────── */}
        <div>
          <h3 style={{ fontFamily:"var(--font-head)", fontSize:22, margin:"0 0 16px" }}>
            My Requests <span style={{ fontSize:15, color:"#aaa", fontWeight:400 }}>({myRequests.length})</span>
          </h3>

          {pendingReqs.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:"#f59e0b", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
                ⏳ Pending ({pendingReqs.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginBottom:20 }}>
                {pendingReqs.map(r => (
                  <SwapCard key={r._id} swap={r} />
                ))}
              </div>
            </>
          )}

          {resolvedReqs.length > 0 && (
            <>
              <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:8 }}>
                History ({resolvedReqs.length})
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, maxHeight:400, overflowY:"auto" }}>
                {resolvedReqs.map(r => (
                  <SwapCard key={r._id} swap={r} />
                ))}
              </div>
            </>
          )}

          {myRequests.length === 0 && (
            <div style={{ textAlign:"center", padding:48, color:"#aaa", background:"#f9f9f7", borderRadius:16, border:"2px dashed #e5e5e5" }}>
              <div style={{ fontSize:36, marginBottom:10 }}>🔄</div>
              <div style={{ fontWeight:700 }}>No swap requests yet</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SwapCard({ swap }) {
  const isOutgoing = true; // shown on employee's own view
  const otherPerson = swap.proposedEmployee;
  const otherName = otherPerson?.name || `${otherPerson?.firstName||""} ${otherPerson?.lastName||""}`.trim() || "—";
  return (
    <div style={{ background:"#fff", borderRadius:14, padding:"14px 16px", boxShadow:"0 2px 10px rgba(0,0,0,.05)", border:"1px solid #f0f0f0" }}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:8 }}>
        <div>
          <div style={{ fontWeight:700, fontSize:14 }}>{swap.shiftDate}</div>
          <div style={{ fontSize:12, color:"#aaa", marginTop:2 }}>{swap.shiftTime} · {swap.shiftRole}</div>
        </div>
        <span style={{ padding:"3px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:statusBg[swap.status]||"#f0f0f0", color:statusColor[swap.status]||"#888" }}>
          {swap.status}
        </span>
      </div>
      <div style={{ fontSize:12, color:"#888" }}>Replace with: <strong style={{ color:"#1a1a1a" }}>{otherName}</strong></div>
      <div style={{ fontSize:12, color:"#888", marginTop:2 }}>Reason: {swap.reason}</div>
      {swap.managerComment && (
        <div style={{ marginTop:8, padding:"8px 12px", background:"#f9f9f7", borderRadius:8, fontSize:12, color:"#555" }}>
          Manager: "{swap.managerComment}"
        </div>
      )}
    </div>
  );
}