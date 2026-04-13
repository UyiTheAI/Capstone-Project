import React, { useState, useRef, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "./ChangePassword";
import { useLanguage } from "../context/LanguageContext";

const fmtDate = (val) => {
  if (!val) return "—";
  const d = new Date(val);
  if (isNaN(d.getTime()) || d.getFullYear() < 2020) return "—";
  return d.toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" });
};

const inp = {
  width:"100%", padding:"10px 14px", border:"1.5px solid #ebebeb",
  borderRadius:10, fontFamily:"var(--font-body)", fontSize:14,
  outline:"none", boxSizing:"border-box", background:"#fff", transition:"border-color .2s",
};

export default function ProfileCard({ onClose }) {
  const { user, updateUser, logout } = useAuth();
  const { t } = useLanguage();
  const [tab,          setTab]          = useState("profile");
  const [firstName,    setFirstName]    = useState(user?.firstName || "");
  const [lastName,     setLastName]     = useState(user?.lastName  || "");
  const [position,     setPosition]     = useState(user?.position  || "");
  const [availability, setAvailability] = useState(user?.availability || "Full-Time");
  const [avatar,       setAvatar]       = useState(user?.avatar    || null);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");
  const [subStatus,    setSubStatus]    = useState(null);
  const [cancelling,   setCancelling]   = useState(false);
  const [cancelDone,   setCancelDone]   = useState(false);
  const [confirmCancel,setConfirmCancel]= useState(false);
  const fileRef = useRef();

  const isOwner   = user?.role === "owner";
  const initials  = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase();
  const roleColor = { employee:"#4f46e5", manager:"#0891b2", owner:"#f5b800" }[user?.role] || "#888";
  const roleTxt   = user?.role === "owner" ? "#1a1a1a" : "#fff";

  useEffect(() => {
    if (!isOwner) return;
    api.get("/subscription/status")
      .then(r => { if (r.data.success) setSubStatus(r.data); })
      .catch(() => {});
  }, [isOwner]);

  const handlePhoto = (e) => {
    const f = e.target.files[0]; if (!f) return;
    if (f.size > 2*1024*1024) { setError("Photo must be under 2MB."); return; }
    const r = new FileReader();
    r.onload = () => { setAvatar(r.result); setError(""); };
    r.readAsDataURL(f);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const r = await api.put("/auth/me", { firstName, lastName, position, availability, avatar });
      updateUser(r.data.user); setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch(e) { setError(e.response?.data?.message || "Failed to save."); }
    finally { setSaving(false); }
  };

  const handleCancelSubscription = async () => {
    setCancelling(true); setError(""); setConfirmCancel(false);
    try {
      await api.post("/subscription/cancel");
      setCancelDone(true);
      setSubStatus(p => ({ ...p, subscription: { ...p?.subscription, cancelAtEnd:true } }));
    } catch(e) { setError(e.response?.data?.message || "Failed to cancel."); }
    finally { setCancelling(false); }
  };

  const TABS = [
    { key:"profile",      label:t("profileTab")      },
    { key:"password",     label:t("passwordTab")     },
    ...(isOwner ? [{ key:"subscription", label:t("subscriptionTab") }] : []),
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:20, width:"100%", maxWidth:520, maxHeight:"92vh", overflow:"hidden", fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.25)", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ background:"#1a1a1a", padding:"20px 24px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid #f5b800" }} />
              : <div style={{ width:44, height:44, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, color:roleTxt }}>{initials}</div>}
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:15 }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                <span style={{ background:roleColor, color:roleTxt, padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{user?.role}</span>
                <span style={{ color:"#555", fontSize:12 }}>{user?.email}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ width:32, height:32, borderRadius:"50%", background:"rgba(255,255,255,.1)", border:"none", color:"#fff", cursor:"pointer", fontSize:18, display:"flex", alignItems:"center", justifyContent:"center" }}>×</button>
        </div>

        {/* Tabs — no icons */}
        <div style={{ display:"flex", borderBottom:"1px solid #f0f0f0", flexShrink:0 }}>
          {TABS.map(tb => (
            <button key={tb.key} onClick={() => setTab(tb.key)}
              style={{ flex:1, padding:"13px 0", border:"none", cursor:"pointer", background: tab===tb.key?"#fff":"#f9f9f7", fontFamily:"var(--font-body)", fontWeight: tab===tb.key?700:500, fontSize:13, color: tab===tb.key?"#1a1a1a":"#aaa", borderBottom: tab===tb.key?"2px solid #f5b800":"2px solid transparent", transition:"all .15s" }}>
              {tb.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding:"24px", overflowY:"auto", flex:1 }}>

          {/* ── PROFILE ── */}
          {tab === "profile" && (
            <>
              {/* Avatar */}
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:22, padding:16, background:"#f9f9f7", borderRadius:14 }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  {avatar
                    ? <img src={avatar} alt="" style={{ width:72, height:72, borderRadius:"50%", objectFit:"cover", border:"3px solid #f5b800" }} />
                    : <div style={{ width:72, height:72, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:24, color:roleTxt }}>{initials}</div>}
                  <button onClick={()=>fileRef.current.click()} style={{ position:"absolute", bottom:2, right:2, width:22, height:22, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #fff", color:"#f5b800", cursor:"pointer", fontSize:11, display:"flex", alignItems:"center", justifyContent:"center" }}>✏</button>
                  <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} style={{ display:"none" }} />
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15 }}>{firstName} {lastName}</div>
                  <div style={{ fontSize:13, color:"#aaa", marginTop:2 }}>{position||"No position set"}</div>
                  <button onClick={()=>fileRef.current.click()} style={{ marginTop:8, padding:"5px 14px", background:"#1a1a1a", color:"#f5b800", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                    Change Photo
                  </button>
                </div>
              </div>

              {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:9, color:"#dc2626", fontSize:13, marginBottom:14 }}>{error}</div>}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                {[["First Name", firstName, setFirstName],["Last Name", lastName, setLastName]].map(([l,v,fn])=>(
                  <div key={l}>
                    <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>{l}</label>
                    <input style={inp} value={v} onChange={e=>fn(e.target.value)}
                      onFocus={e=>e.target.style.borderColor="#f5b800"}
                      onBlur={e=>e.target.style.borderColor="#ebebeb"} />
                  </div>
                ))}
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>Position</label>
                <input style={inp} value={position} onChange={e=>setPosition(e.target.value)} placeholder="e.g. Manager, Owner"
                  onFocus={e=>e.target.style.borderColor="#f5b800"}
                  onBlur={e=>e.target.style.borderColor="#ebebeb"} />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ display:"block", fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:6 }}>Availability</label>
                <select style={inp} value={availability} onChange={e=>setAvailability(e.target.value)}>
                  <option>Full-Time</option><option>Part-Time</option><option>On-Call</option>
                </select>
              </div>

              <button onClick={handleSave} disabled={saving}
                style={{ width:"100%", padding:"13px", background: saved?"#16a34a":"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:"pointer", marginBottom:10, transition:"background .3s" }}>
                {saving?t("loading"):saved?"Saved!":t("saveProfile")}
              </button>

              <button onClick={logout}
                style={{ width:"100%", padding:"11px", background:"transparent", color:"#dc2626", border:"1.5px solid #fee2e2", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:700, fontSize:13, cursor:"pointer" }}>
                {t("signOut")}
              </button>
            </>
          )}

          {/* ── PASSWORD ── */}
          {tab === "password" && <ChangePassword />}

          {/* ── SUBSCRIPTION ── */}
          {tab === "subscription" && isOwner && (
            <div>
              {/* Status card */}
              <div style={{ background: subStatus?.trial?"#f0fdf4":"#f9f9f7", border:`1.5px solid ${subStatus?.trial?"#86efac":"#ebebeb"}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:15, color:"#1a1a1a", marginBottom:3 }}>SHIFT-UP Pro</div>
                    <div style={{ fontSize:13, color:"#888" }}>$5.00 CAD / month</div>
                  </div>
                  <span style={{ padding:"4px 14px", borderRadius:20, fontSize:12, fontWeight:700,
                    background: subStatus?.trial?"#dcfce7": subStatus?.active?"#dbeafe":"#fee2e2",
                    color:      subStatus?.trial?"#16a34a": subStatus?.active?"#1d4ed8":"#dc2626" }}>
                    {subStatus?.trial?"Trial Active": subStatus?.active?"Active":"Inactive"}
                  </span>
                </div>

                {subStatus?.subscription && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #e5e5e5", display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
                    {subStatus.trial && subStatus.subscription.trialEnd && (
                      <div>
                        <div style={{ fontSize:11, color:"#aaa", textTransform:"uppercase", letterSpacing:.5, marginBottom:3 }}>Trial Ends</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{fmtDate(subStatus.subscription.trialEnd)}</div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize:11, color:"#aaa", textTransform:"uppercase", letterSpacing:.5, marginBottom:3 }}>
                        {subStatus.trial ? "First Charge" : "Next Billing"}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a" }}>{fmtDate(subStatus.subscription.currentPeriodEnd)}</div>
                    </div>
                    {subStatus.subscription.cancelAtEnd && (
                      <div style={{ gridColumn:"1/-1", background:"#fff8e1", border:"1px solid #ffe082", borderRadius:9, padding:"10px 14px", fontSize:12, color:"#92400e" }}>
                        Subscription ends on {fmtDate(subStatus.subscription.currentPeriodEnd)}. No further charges.
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Plan includes */}
              <div style={{ background:"#f9f9f7", borderRadius:12, padding:"16px 18px", marginBottom:20 }}>
                <div style={{ fontSize:11, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:12 }}>Plan Includes</div>
                {["Unlimited shift scheduling","Staff management","Shift swap approvals","Tip distribution","Staff reports","7 Canadian languages","Email notifications","Manager dashboard"].map(f=>(
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:8, fontSize:13, color:"#555" }}>
                    <span style={{ color:"#16a34a", fontWeight:700, fontSize:14 }}>✓</span>{f}
                  </div>
                ))}
              </div>

              {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:9, color:"#dc2626", fontSize:13, marginBottom:14 }}>{error}</div>}

              {/* Inactive — prompt to resubscribe */}
              {!subStatus?.active && !subStatus?.trial && (
                <div style={{ background:"#fff8e1", border:"1.5px solid #ffe082", borderRadius:14, padding:"20px", marginBottom:20, textAlign:"center" }}>
                  <div style={{ fontWeight:800, fontSize:15, color:"#92400e", marginBottom:6 }}>No Active Subscription</div>
                  <div style={{ fontSize:13, color:"#a16207", lineHeight:1.7, marginBottom:18 }}>
                    Your subscription is inactive. Start a new subscription to restore access for your team.
                  </div>
                  <button
                    onClick={() => { onClose(); window.location.href = "/"; }}
                    style={{ width:"100%", padding:"13px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:800, fontSize:14, cursor:"pointer" }}>
                    Start New Subscription →
                  </button>
                  <div style={{ fontSize:11, color:"#aaa", marginTop:10 }}>
                    7-day free trial · $5 CAD/month after · Cancel anytime
                  </div>
                </div>
              )}

              {/* Cancel section */}
              {cancelDone || subStatus?.subscription?.cancelAtEnd ? (
                <div style={{ padding:"14px 16px", background:"#f9f9f7", borderRadius:12, fontSize:13, color:"#888", textAlign:"center" }}>
                  Cancellation confirmed. You keep access until the billing period ends.
                </div>
              ) : confirmCancel ? (
                <div style={{ background:"#fee2e2", border:"1px solid #fca5a5", borderRadius:12, padding:"18px 20px" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#dc2626", marginBottom:8 }}>Confirm Cancellation</div>
                  <div style={{ fontSize:13, color:"#dc2626", opacity:.8, marginBottom:16, lineHeight:1.6 }}>
                    Your access continues until <strong>{fmtDate(subStatus?.subscription?.currentPeriodEnd)}</strong>. No further charges after that.
                  </div>
                  <div style={{ display:"flex", gap:10 }}>
                    <button onClick={()=>setConfirmCancel(false)}
                      style={{ flex:1, padding:"11px", background:"#fff", border:"1.5px solid #e5e5e5", borderRadius:9, fontFamily:"var(--font-body)", fontWeight:600, fontSize:13, cursor:"pointer" }}>
                      Keep Subscription
                    </button>
                    <button onClick={handleCancelSubscription} disabled={cancelling}
                      style={{ flex:1, padding:"11px", background:"#dc2626", border:"none", borderRadius:9, fontFamily:"var(--font-body)", fontWeight:700, fontSize:13, color:"#fff", cursor:"pointer", opacity:cancelling?.7:1 }}>
                      {cancelling?"Cancelling…":"Yes, Cancel"}
                    </button>
                  </div>
                </div>
              ) : (
                <div>
                  <button onClick={()=>setConfirmCancel(true)} disabled={!subStatus?.active}
                    style={{ width:"100%", padding:"12px", background:"transparent", color:"#dc2626", border:"1.5px solid #fca5a5", borderRadius:10, fontFamily:"var(--font-body)", fontWeight:700, fontSize:13, cursor: !subStatus?.active?"not-allowed":"pointer", opacity: !subStatus?.active?.5:1 }}>
                    {t("cancelSubscription")}
                  </button>
                  <div style={{ marginTop:10, fontSize:12, color:"#ccc", textAlign:"center" }}>
                    You keep full access until the end of the billing period.
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}