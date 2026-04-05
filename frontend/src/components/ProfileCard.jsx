import React, { useState, useRef, useEffect } from "react";
import api from "../api";
import { useAuth } from "../context/AuthContext";
import ChangePassword from "./ChangePassword";

export default function ProfileCard({ onClose }) {
  const { user, updateUser, logout } = useAuth();
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
  const fileRef = useRef();

  const isOwner    = user?.role === "owner";
  const initials   = `${user?.firstName?.[0]||""}${user?.lastName?.[0]||""}`.toUpperCase();
  const roleColor  = { employee:"#4f46e5", manager:"#0891b2", owner:"#f5b800" }[user?.role] || "#888";

  // Load subscription status for owner
  useEffect(() => {
    if (!isOwner) return;
    api.get("/subscription/status")
      .then(res => { if (res.data.success) setSubStatus(res.data); })
      .catch(() => {});
  }, [isOwner]);

  const handlePhoto = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    if (file.size > 2*1024*1024) { setError("Photo must be under 2MB."); return; }
    const reader = new FileReader();
    reader.onload = () => { setAvatar(reader.result); setError(""); };
    reader.readAsDataURL(file);
  };

  const handleSave = async () => {
    setSaving(true); setError(""); setSaved(false);
    try {
      const res = await api.put("/auth/me", { firstName, lastName, position, availability, avatar });
      updateUser(res.data.user);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save profile.");
    } finally { setSaving(false); }
  };

  const handleCancelSubscription = async () => {
    if (!window.confirm("Are you sure you want to cancel your subscription? You will keep access until the end of your billing period.")) return;
    setCancelling(true); setError("");
    try {
      const res = await api.post("/subscription/cancel");
      setCancelDone(true);
      setSubStatus(prev => ({ ...prev, subscription: { ...prev?.subscription, cancelAtEnd: true } }));
      alert(`✅ ${res.data.message}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel subscription.");
    } finally { setCancelling(false); }
  };

  const inputStyle = {
    width:"100%", padding:"10px 14px", border:"1.5px solid #e0e0e0",
    borderRadius:10, fontFamily:"var(--font-body)", fontSize:14,
    outline:"none", boxSizing:"border-box", background:"#fff",
  };

  const TABS = [
    { key:"profile",  icon:"👤", label:"Profile"      },
    { key:"password", icon:"🔐", label:"Password"     },
    ...(isOwner ? [{ key:"subscription", icon:"💳", label:"Subscription" }] : []),
  ];

  return (
    <div style={{ position:"fixed", inset:0, background:"rgba(0,0,0,.55)", zIndex:3000, display:"flex", alignItems:"center", justifyContent:"center", padding:20 }}>
      <div style={{ background:"#fff", borderRadius:24, width:"100%", maxWidth:520, maxHeight:"92vh", overflow:"hidden", fontFamily:"var(--font-body)", boxShadow:"0 24px 80px rgba(0,0,0,.25)", display:"flex", flexDirection:"column" }}>

        {/* Header */}
        <div style={{ background:"#1a1a1a", padding:"20px 28px", display:"flex", justifyContent:"space-between", alignItems:"center", flexShrink:0 }}>
          <div style={{ display:"flex", alignItems:"center", gap:14 }}>
            {avatar
              ? <img src={avatar} alt="" style={{ width:44, height:44, borderRadius:"50%", objectFit:"cover", border:"2px solid #f5b800" }} />
              : <div style={{ width:44, height:44, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:16, color: user?.role==="owner"?"#1a1a1a":"#fff" }}>{initials}</div>
            }
            <div>
              <div style={{ color:"#fff", fontWeight:800, fontSize:16 }}>{user?.firstName} {user?.lastName}</div>
              <div style={{ display:"flex", alignItems:"center", gap:8, marginTop:3 }}>
                <span style={{ background:roleColor, color: user?.role==="owner"?"#1a1a1a":"#fff", padding:"2px 10px", borderRadius:20, fontSize:11, fontWeight:700, textTransform:"capitalize" }}>{user?.role}</span>
                <span style={{ color:"#666", fontSize:12 }}>{user?.email}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} style={{ background:"rgba(255,255,255,.1)", border:"none", color:"#fff", width:34, height:34, borderRadius:"50%", cursor:"pointer", fontSize:18 }}>×</button>
        </div>

        {/* Tabs */}
        <div style={{ display:"flex", borderBottom:"2px solid #f0f0f0", flexShrink:0 }}>
          {TABS.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)} style={{
              flex:1, padding:"13px 0", border:"none", cursor:"pointer",
              background: tab===t.key?"#fff":"#f9f9f7",
              fontFamily:"var(--font-body)", fontWeight: tab===t.key?800:600,
              fontSize:12, color: tab===t.key?"#1a1a1a":"#aaa",
              borderBottom: tab===t.key?"2px solid #f5b800":"2px solid transparent",
            }}>
              {t.icon} {t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div style={{ padding:"24px 28px", overflowY:"auto", flex:1 }}>

          {/* ── PROFILE TAB ── */}
          {tab === "profile" && (
            <>
              {/* Avatar */}
              <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:22, padding:16, background:"#f9f9f7", borderRadius:14 }}>
                <div style={{ position:"relative", flexShrink:0 }}>
                  {avatar
                    ? <img src={avatar} alt="" style={{ width:76, height:76, borderRadius:"50%", objectFit:"cover", border:"3px solid #f5b800" }} />
                    : <div style={{ width:76, height:76, borderRadius:"50%", background:roleColor, display:"flex", alignItems:"center", justifyContent:"center", fontWeight:900, fontSize:26, color: user?.role==="owner"?"#1a1a1a":"#fff" }}>{initials}</div>
                  }
                  <button onClick={() => fileRef.current.click()} style={{ position:"absolute", bottom:2, right:2, width:24, height:24, borderRadius:"50%", background:"#1a1a1a", border:"2px solid #fff", color:"#f5b800", cursor:"pointer", fontSize:12, display:"flex", alignItems:"center", justifyContent:"center" }}>✏</button>
                  <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhoto} style={{ display:"none" }} />
                </div>
                <div>
                  <div style={{ fontWeight:800, fontSize:15 }}>{firstName} {lastName}</div>
                  <div style={{ fontSize:13, color:"#aaa", marginTop:2 }}>{position||"No position set"}</div>
                  <button onClick={() => fileRef.current.click()} style={{ marginTop:8, padding:"5px 14px", background:"#f5b800", color:"#1a1a1a", border:"none", borderRadius:8, fontSize:12, fontWeight:700, cursor:"pointer", fontFamily:"var(--font-body)" }}>
                    📷 Change Photo
                  </button>
                  <div style={{ fontSize:11, color:"#ccc", marginTop:4 }}>JPG, PNG or WEBP · Max 2MB</div>
                </div>
              </div>

              {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>{error}</div>}

              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12, marginBottom:12 }}>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>First Name</label>
                  <input style={inputStyle} value={firstName} onChange={e=>setFirstName(e.target.value)} />
                </div>
                <div>
                  <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Last Name</label>
                  <input style={inputStyle} value={lastName} onChange={e=>setLastName(e.target.value)} />
                </div>
              </div>

              <div style={{ marginBottom:12 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Position</label>
                <input style={inputStyle} value={position} onChange={e=>setPosition(e.target.value)} placeholder="e.g. Owner, Manager" />
              </div>

              <div style={{ marginBottom:20 }}>
                <label style={{ fontSize:12, fontWeight:700, color:"#555", display:"block", marginBottom:6, textTransform:"uppercase", letterSpacing:.5 }}>Availability</label>
                <select style={inputStyle} value={availability} onChange={e=>setAvailability(e.target.value)}>
                  <option value="Full-Time">Full-Time</option>
                  <option value="Part-Time">Part-Time</option>
                  <option value="On-Call">On-Call</option>
                </select>
              </div>

              <button onClick={handleSave} disabled={saving} style={{ width:"100%", padding:"13px", background: saved?"#22c55e":"#f5b800", color:"#1a1a1a", border:"none", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:800, fontSize:15, cursor:"pointer", marginBottom:10, transition:"background .3s" }}>
                {saving?"Saving...":saved?"✅ Saved!":"Save Profile"}
              </button>

              <button onClick={logout} style={{ width:"100%", padding:"11px", background:"transparent", color:"#dc2626", border:"1.5px solid #fee2e2", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:700, fontSize:14, cursor:"pointer" }}>
                Sign Out
              </button>
            </>
          )}

          {/* ── PASSWORD TAB ── */}
          {tab === "password" && <ChangePassword />}

          {/* ── SUBSCRIPTION TAB (owner only) ── */}
          {tab === "subscription" && isOwner && (
            <div>
              <h3 style={{ fontFamily:"var(--font-head)", fontSize:24, margin:"0 0 16px" }}>Subscription</h3>

              {/* Status card */}
              <div style={{ background: subStatus?.trial?"#f0fdf4":"#f9f9f7", border:`1.5px solid ${subStatus?.trial?"#86efac":"#e5e5e5"}`, borderRadius:14, padding:"18px 20px", marginBottom:20 }}>
                <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start" }}>
                  <div>
                    <div style={{ fontWeight:800, fontSize:16, color:"#1a1a1a", marginBottom:4 }}>SHIFT-UP Pro</div>
                    <div style={{ fontSize:13, color:"#888" }}>$5.00 CAD / month</div>
                  </div>
                  <span style={{
                    padding:"4px 14px", borderRadius:20, fontSize:12, fontWeight:700,
                    background: subStatus?.trial?"#dcfce7": subStatus?.active?"#dbeafe":"#fee2e2",
                    color:      subStatus?.trial?"#16a34a": subStatus?.active?"#1d4ed8":"#dc2626",
                  }}>
                    {subStatus?.trial?"🎁 Trial": subStatus?.active?"✅ Active":"❌ Inactive"}
                  </span>
                </div>

                {subStatus?.subscription && (
                  <div style={{ marginTop:14, paddingTop:14, borderTop:"1px solid #e5e5e5", display:"grid", gridTemplateColumns:"1fr 1fr", gap:10 }}>
                    {subStatus.trial && subStatus.subscription.trialEnd && (
                      <div>
                        <div style={{ fontSize:11, color:"#aaa", textTransform:"uppercase", letterSpacing:.5 }}>Trial Ends</div>
                        <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginTop:2 }}>
                          {new Date(subStatus.subscription.trialEnd).toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" })}
                        </div>
                      </div>
                    )}
                    <div>
                      <div style={{ fontSize:11, color:"#aaa", textTransform:"uppercase", letterSpacing:.5 }}>
                        {subStatus.trial?"First Charge":"Next Billing"}
                      </div>
                      <div style={{ fontSize:13, fontWeight:700, color:"#1a1a1a", marginTop:2 }}>
                        {new Date(subStatus.subscription.currentPeriodEnd).toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" })}
                      </div>
                    </div>
                    {subStatus.subscription.cancelAtEnd && (
                      <div style={{ gridColumn:"1/-1", background:"#fff8e1", border:"1px solid #ffe082", borderRadius:8, padding:"8px 12px", fontSize:12, color:"#92400e" }}>
                        ⚠️ Subscription will end on {new Date(subStatus.subscription.currentPeriodEnd).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Plan includes */}
              <div style={{ background:"#f9f9f7", borderRadius:12, padding:"14px 16px", marginBottom:20 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#888", textTransform:"uppercase", letterSpacing:.5, marginBottom:10 }}>Plan Includes</div>
                {["Unlimited shift scheduling","Staff management & registration","Shift swap approvals","Tip distribution","Staff reports & analytics","9 language support","Email notifications"].map(f => (
                  <div key={f} style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6, fontSize:13, color:"#555" }}>
                    <span style={{ color:"#22c55e", fontWeight:700 }}>✓</span> {f}
                  </div>
                ))}
              </div>

              {error && <div style={{ padding:"10px 14px", background:"#fee2e2", borderRadius:8, color:"#dc2626", fontSize:13, marginBottom:14 }}>{error}</div>}

              {/* Cancel button */}
              {!subStatus?.subscription?.cancelAtEnd && !cancelDone ? (
                <button
                  onClick={handleCancelSubscription}
                  disabled={cancelling || !subStatus?.active}
                  style={{ width:"100%", padding:"12px", background:"transparent", color:"#dc2626", border:"1.5px solid #dc2626", borderRadius:12, fontFamily:"var(--font-body)", fontWeight:700, fontSize:14, cursor: (!subStatus?.active||cancelling)?"not-allowed":"pointer", opacity: !subStatus?.active?.5:1 }}
                >
                  {cancelling?"Cancelling...":"Cancel Subscription"}
                </button>
              ) : (
                <div style={{ padding:"12px 16px", background:"#f9f9f7", borderRadius:12, fontSize:13, color:"#888", textAlign:"center" }}>
                  Subscription cancellation confirmed. A confirmation email has been sent.
                </div>
              )}

              <div style={{ marginTop:12, fontSize:12, color:"#aaa", textAlign:"center" }}>
                Cancelling keeps your access until the end of the billing period. No further charges.
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}