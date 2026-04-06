import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const statusColor = { pending:"#f59e0b", approved:"#16a34a", rejected:"#dc2626" };
const statusBg    = { pending:"#fff8e1", approved:"#dcfce7", rejected:"#fee2e2" };

export default function SwapApprovals({ user, onUpdate }) {
  const { t } = useLanguage();
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
      setSwaps(res.data.swaps||[]);
    } catch { setSwaps([]); }
    finally { setLoading(false); }
  };

  const handleAction = async (swapId, action) => {
    setActionLoading(prev=>({...prev,[swapId]:true}));
    try {
      await api.put(`/swaps/${swapId}/${action}`,{comment:comments[swapId]||""});
      setSwaps(prev=>prev.map(s=>s._id===swapId?{...s,status:action==="approve"?"approved":"rejected",managerComment:comments[swapId]||""}:s));
      onUpdate?.();
    } catch(err) { alert(err.response?.data?.message||t("error")); }
    finally { setActionLoading(prev=>({...prev,[swapId]:false})); }
  };

  const pendingCount = swaps.filter(s=>s.status==="pending").length;

  const TABS = [
    {key:"pending",  label:`⏳ ${t("pendingRequests")||"Pending"}${pendingCount>0?` (${pendingCount})`:""}`},
    {key:"approved", label:`✅ ${t("approved")||"Approved"}`},
    {key:"rejected", label:`❌ ${t("rejected")||"Rejected"}`},
    {key:"all",      label:`${t("all")} (${swaps.length})`},
  ];
  const filtered = filter==="all" ? swaps : swaps.filter(s=>s.status===filter);

  return (
    <div className="su-page">
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:24}}>
        <div>
          <div className="su-title" style={{marginBottom:4}}>{t("swapApprovals")}</div>
          <div style={{fontSize:14,color:"#888"}}>{t("submitSwapRequest")}</div>
        </div>
        <button onClick={fetchSwaps} style={{padding:"8px 16px",background:"#f0f0ec",border:"none",borderRadius:8,fontFamily:"var(--font-body)",fontWeight:600,fontSize:13,color:"#555",cursor:"pointer"}}>🔄 {t("filter")||"Refresh"}</button>
      </div>

      {/* Filter tabs */}
      <div style={{display:"flex",gap:4,background:"#f0f0ec",borderRadius:12,padding:4,marginBottom:24,width:"fit-content"}}>
        {TABS.map(tb=>(
          <button key={tb.key} onClick={()=>setFilter(tb.key)} style={{padding:"9px 18px",border:"none",borderRadius:9,cursor:"pointer",fontFamily:"var(--font-body)",fontSize:13,fontWeight:filter===tb.key?800:600,background:filter===tb.key?"#fff":"transparent",color:filter===tb.key?"#1a1a1a":"#888",boxShadow:filter===tb.key?"0 2px 8px rgba(0,0,0,.08)":"none"}}>{tb.label}</button>
        ))}
      </div>

      {loading
        ? <div style={{textAlign:"center",padding:60,color:"#aaa"}}>{t("loading")}</div>
        : filtered.length===0
          ? <div style={{textAlign:"center",padding:60,color:"#aaa",background:"#fff",borderRadius:16,border:"2px dashed #e5e5e5"}}><div style={{fontSize:40,marginBottom:10}}>🔄</div><div style={{fontWeight:700}}>{t("noSwapRequests")}</div></div>
          : <div style={{display:"flex",flexDirection:"column",gap:14}}>
              {filtered.map(swap=>{
                const reqName = swap.requester?.name||`${swap.requester?.firstName||""} ${swap.requester?.lastName||""}`.trim()||t("noData");
                const propName= swap.proposedEmployee?.name||`${swap.proposedEmployee?.firstName||""} ${swap.proposedEmployee?.lastName||""}`.trim()||t("noData");
                const isPending=swap.status==="pending";
                const isLoad  =actionLoading[swap._id];
                return (
                  <div key={swap._id} style={{background:"#fff",borderRadius:16,overflow:"hidden",boxShadow:"0 2px 12px rgba(0,0,0,.06)",border:`2px solid ${isPending?"#f5b800":"#f0f0f0"}`}}>
                    <div style={{background:isPending?"#fff8e1":"#f9f9f7",padding:"12px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:"1px solid #f0f0f0"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <span style={{fontSize:18}}>{isPending?"🔄":swap.status==="approved"?"✅":"❌"}</span>
                        <div>
                          <span style={{fontWeight:800,fontSize:15}}>{reqName}</span>
                          <span style={{color:"#888",fontSize:13}}> → </span>
                          <span style={{fontWeight:700,fontSize:14,color:"#4f46e5"}}>{propName}</span>
                        </div>
                      </div>
                      <span style={{padding:"4px 12px",borderRadius:20,fontSize:11,fontWeight:700,background:statusBg[swap.status]||"#f0f0f0",color:statusColor[swap.status]||"#888"}}>
                        {swap.status?.toUpperCase()}
                      </span>
                    </div>

                    <div style={{padding:"16px 20px"}}>
                      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:14}}>
                        {[[t("today")||"Date",swap.shiftDate],[t("week")||"Time",swap.shiftTime],[t("role")||"Role",swap.shiftRole]].map(([label,val])=>(
                          <div key={label}>
                            <div style={{fontSize:10,color:"#aaa",textTransform:"uppercase",letterSpacing:.5}}>{label}</div>
                            <div style={{fontWeight:700,fontSize:13,marginTop:3}}>{val}</div>
                          </div>
                        ))}
                      </div>

                      <div style={{background:"#f9f9f7",borderRadius:10,padding:"10px 14px",marginBottom:14}}>
                        <div style={{fontSize:11,color:"#aaa",textTransform:"uppercase",letterSpacing:.5,marginBottom:4}}>{t("reason")}</div>
                        <div style={{fontSize:13,color:"#555"}}>{swap.reason}</div>
                        {swap.coverageNote && <div style={{marginTop:6,fontSize:12,color:"#888"}}>{t("coverageNote")}: {swap.coverageNote}</div>}
                      </div>

                      {!isPending && swap.managerComment && (
                        <div style={{background:statusBg[swap.status],borderRadius:10,padding:"10px 14px",marginBottom:14,fontSize:13,color:statusColor[swap.status]}}>
                          {t("managerNote")}: "{swap.managerComment}"
                        </div>
                      )}

                      {isPending && (
                        <div>
                          <div style={{marginBottom:10}}>
                            <label style={{fontSize:11,fontWeight:700,color:"#888",textTransform:"uppercase",letterSpacing:.5,display:"block",marginBottom:6}}>{t("managerNote")} ({t("none")||"optional"})</label>
                            <input type="text" value={comments[swap._id]||""} onChange={e=>setComments(prev=>({...prev,[swap._id]:e.target.value}))}
                              placeholder={t("managerNote")||"Add a comment…"}
                              style={{width:"100%",padding:"9px 14px",border:"1.5px solid #e5e5e5",borderRadius:10,fontFamily:"var(--font-body)",fontSize:13,outline:"none",boxSizing:"border-box"}}/>
                          </div>
                          <div style={{display:"flex",gap:10}}>
                            <button onClick={()=>handleAction(swap._id,"approve")} disabled={isLoad}
                              style={{flex:1,padding:"11px 0",background:"#16a34a",color:"#fff",border:"none",borderRadius:10,fontFamily:"var(--font-body)",fontWeight:800,fontSize:14,cursor:"pointer",opacity:isLoad?.7:1}}>
                              {isLoad?"…":`✅ ${t("confirm")||"Approve"}`}
                            </button>
                            <button onClick={()=>handleAction(swap._id,"reject")} disabled={isLoad}
                              style={{flex:1,padding:"11px 0",background:"#fff",color:"#dc2626",border:"2px solid #dc2626",borderRadius:10,fontFamily:"var(--font-body)",fontWeight:800,fontSize:14,cursor:"pointer",opacity:isLoad?.7:1}}>
                              {isLoad?"…":`❌ ${t("delete")||"Reject"}`}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
      }
    </div>
  );
}