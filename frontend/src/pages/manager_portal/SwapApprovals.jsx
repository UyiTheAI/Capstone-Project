import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

const statusColor = { pending:"#f59e0b", approved:"#16a34a", rejected:"#dc2626" };
const statusBg    = { pending:"#fff8e1", approved:"#dcfce7", rejected:"#fee2e2" };

export default function SwapApprovals({ user, onUpdate }) {
  const [swaps,         setSwaps]         = useState([]);
  const [loading,       setLoading]       = useState(true);
  const [comments,      setComments]      = useState({});
  const [actionLoading, setActionLoading] = useState({});
  const [filter,        setFilter]        = useState("pending");

  useEffect(() => { fetchSwaps(); }, []);

  const fetchSwaps = async () => {
    setLoading(true);
    try {
      const res = await api.get("/swaps");
      setSwaps(res.data.swaps || []);
    } catch { setSwaps([]); }
    finally { setLoading(false); }
  };

  const handleAction = async (swapId, action) => {
    setActionLoading(prev => ({ ...prev, [swapId]:true }));
    try {
      await api.put(`/swaps/${swapId}/${action}`, { comment:comments[swapId]||"" });
      setSwaps(prev => prev.map(s =>
        s._id === swapId ? { ...s, status:action==="approve"?"approved":"rejected", managerComment:comments[swapId]||"" } : s
      ));
      onUpdate?.();
    } catch(err) {
      alert(err.response?.data?.message || `Failed to ${action} swap`);
    } finally {
      setActionLoading(prev => ({ ...prev, [swapId]:false }));
    }
  };

  const filtered = filter === "all" ? swaps : swaps.filter(s => s.status === filter);
  const pendingCount = swaps.filter(s => s.status === "pending").length;

  return (
    <div className="su-page">
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24 }}>
        <div>
          <div className="su-title" style={{ marginBottom:4 }}>SWAP APPROVALS</div>
          <div style={{ fontSize:14, color:"#888" }}>Review and approve or reject employee shift swap requests</div>
        </div>
        <button onClick={fetchSwaps} style={{ padding:"8px 16px", background:"#f0f0ec", border:"none", borderRadius:8, fontFamily:"var(--font-body)", fontWeight:600, fontSize:13, color:"#555", cursor:"pointer" }}>
          🔄 Refresh
        </button>
      </div>

      {/* Filter tabs */}
      <div style={{ display:"flex", gap:4, background:"#f0f0ec", borderRadius:12, padding:4, marginBottom:24, width:"fit-content" }}>
        {[
          {key:"pending",  label:`⏳ Pending${pendingCount>0?` (${pendingCount})`:""}`},
          {key:"approved", label:"✅ Approved"},
          {key:"rejected", label:"❌ Rejected"},
          {key:"all",      label:`All (${swaps.length})`},
        ].map(f => (
          <button key={f.key} onClick={()=>setFilter(f.key)} style={{
            padding:"9px 18px", border:"none", borderRadius:9, cursor:"pointer",
            fontFamily:"var(--font-body)", fontSize:13, fontWeight: filter===f.key?800:600,
            background: filter===f.key?"#fff":"transparent",
            color:      filter===f.key?"#1a1a1a":"#888",
            boxShadow:  filter===f.key?"0 2px 8px rgba(0,0,0,.08)":"none",
          }}>{f.label}</button>
        ))}
      </div>

      {loading ? (
        <div style={{ textAlign:"center", padding:60, color:"#aaa" }}>Loading swap requests…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign:"center", padding:60, color:"#aaa", background:"#fff", borderRadius:16, border:"2px dashed #e5e5e5" }}>
          <div style={{ fontSize:40, marginBottom:10 }}>🔄</div>
          <div style={{ fontWeight:700 }}>No {filter !== "all" ? filter : ""} swap requests</div>
        </div>
      ) : (
        <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
          {filtered.map(swap => {
            const requesterName  = swap.requester?.name    || `${swap.requester?.firstName||""} ${swap.requester?.lastName||""}`.trim() || "Unknown";
            const proposedName   = swap.proposedEmployee?.name || `${swap.proposedEmployee?.firstName||""} ${swap.proposedEmployee?.lastName||""}`.trim() || "Unknown";
            const isPending      = swap.status === "pending";
            const isLoading      = actionLoading[swap._id];
            const submittedAt    = new Date(swap.createdAt).toLocaleDateString("en",{month:"short",day:"numeric",hour:"numeric",minute:"2-digit"});

            return (
              <div key={swap._id} style={{ background:"#fff", borderRadius:16, overflow:"hidden", boxShadow:"0 2px 12px rgba(0,0,0,.06)", border:`2px solid ${isPending?"#f5b800":"#f0f0f0"}` }}>

                {/* Header strip */}
                <div style={{ background: isPending?"#fff8e1":"#f9f9f7", padding:"12px 20px", display:"flex", justifyContent:"space-between", alignItems:"center", borderBottom:"1px solid #f0f0f0" }}>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:18 }}>{isPending?"🔄":swap.status==="approved"?"✅":"❌"}</span>
                    <div>
                      <span style={{ fontWeight:800, fontSize:15 }}>{requesterName}</span>
                      <span style={{ color:"#888", fontSize:13 }}> → </span>
                      <span style={{ fontWeight:700, fontSize:14, color:"#4f46e5" }}>{proposedName}</span>
                    </div>
                  </div>
                  <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                    <span style={{ fontSize:11, color:"#aaa" }}>{submittedAt}</span>
                    <span style={{ padding:"4px 12px", borderRadius:20, fontSize:11, fontWeight:700, background:statusBg[swap.status]||"#f0f0f0", color:statusColor[swap.status]||"#888" }}>
                      {swap.status?.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Details */}
                <div style={{ padding:"16px 20px" }}>
                  <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr 1fr", gap:12, marginBottom:14 }}>
                    <div>
                      <div style={{ fontSize:10, color:"#aaa", textTransform:"uppercase", letterSpacing:.5 }}>Date</div>
                      <div style={{ fontWeight:700, fontSize:13, marginTop:3 }}>{swap.shiftDate}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:"#aaa", textTransform:"uppercase", letterSpacing:.5 }}>Time</div>
                      <div style={{ fontWeight:700, fontSize:13, marginTop:3 }}>{swap.shiftTime}</div>
                    </div>
                    <div>
                      <div style={{ fontSize:10, color:"#aaa", textTransform:"uppercase", letterSpacing:.5 }}>Role</div>
                      <div style={{ fontWeight:700, fontSize:13, marginTop:3 }}>{swap.shiftRole}</div>
                    </div>
                  </div>

                  <div style={{ background:"#f9f9f7", borderRadius:10, padding:"10px 14px", marginBottom:14 }}>
                    <div style={{ fontSize:11, color:"#aaa", textTransform:"uppercase", letterSpacing:.5, marginBottom:4 }}>Reason</div>
                    <div style={{ fontSize:13, color:"#555" }}>{swap.reason}</div>
                    {swap.coverageNote && (
                      <div style={{ marginTop:6, fontSize:12, color:"#888" }}>Coverage note: {swap.coverageNote}</div>
                    )}
                  </div>

                  {/* Approved/Rejected info */}
                  {!isPending && swap.managerComment && (
                    <div style={{ background: statusBg[swap.status], borderRadius:10, padding:"10px 14px", marginBottom:14, fontSize:13, color:statusColor[swap.status] }}>
                      Manager comment: "{swap.managerComment}"
                    </div>
                  )}

                  {/* Action area */}
                  {isPending && (
                    <div>
                      <div style={{ marginBottom:10 }}>
                        <label style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, display:"block", marginBottom:6 }}>
                          Comment (optional)
                        </label>
                        <input
                          type="text"
                          value={comments[swap._id]||""}
                          onChange={e => setComments(prev => ({ ...prev, [swap._id]:e.target.value }))}
                          placeholder="Add a note for the employee…"
                          style={{ width:"100%", padding:"9px 14px", border:"1.5px solid #e5e5e5", borderRadius:10, fontFamily:"var(--font-body)", fontSize:13, outline:"none", boxSizing:"border-box" }}
                        />
                      </div>
                      <div style={{ display:"flex", gap:10 }}>
                        <button
                          onClick={() => handleAction(swap._id, "approve")}
                          disabled={isLoading}
                          style={{ flex:1, padding:"11px 0", background:"#16a34a", color:"#fff", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:"pointer", opacity:isLoading?.7:1 }}
                        >
                          {isLoading ? "…" : "✅ Approve"}
                        </button>
                        <button
                          onClick={() => handleAction(swap._id, "reject")}
                          disabled={isLoading}
                          style={{ flex:1, padding:"11px 0", background:"#fff", color:"#dc2626", border:"2px solid #dc2626", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:"pointer", opacity:isLoading?.7:1 }}
                        >
                          {isLoading ? "…" : "❌ Reject"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}