import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../context/LanguageContext";

const fmt = (n) => `$${Number(n).toFixed(2)}`;
const fmtDate = (d) => new Date(d).toLocaleDateString("en", { weekday:"short", month:"short", day:"numeric", year:"numeric" });

export default function TipManager() {
  const { t } = useLanguage();
  const [employees, setEmployees]     = useState([]);
  const [tips, setTips]               = useState([]);
  const [loading, setLoading]         = useState(true);
  const [submitting, setSubmitting]   = useState(false);
  const [msg, setMsg]                 = useState("");
  const [err, setErr]                 = useState("");
  const [tab, setTab]                 = useState("add"); // add | history

  const [form, setForm] = useState({
    date: new Date().toISOString().split("T")[0],
    totalAmount: "",
    splitMethod: "equal",
    note: "",
  });

  // Manual split: { employeeId: amount }
  const [manualAmounts, setManualAmounts] = useState({});

  /* ── fetch data ── */
  useEffect(() => {
    fetchAll();
  }, []);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [empsRes, tipsRes] = await Promise.all([
        api.get("/users/employees"),
        api.get("/tips"),
      ]);
      const emps = empsRes.data.employees || [];
      setEmployees(emps);
      setTips(tipsRes.data.tips || []);
      // Init manual amounts
      const init = {};
      emps.forEach((e) => { init[e._id || e.id] = ""; });
      setManualAmounts(init);
    } catch (e) {
      setErr("Failed to load data: " + (e.response?.data?.message || e.message));
    } finally {
      setLoading(false);
    }
  };

  /* ── auto-fill equal split amounts for display ── */
  const equalShare =
    form.splitMethod === "equal" && form.totalAmount && employees.length
      ? (parseFloat(form.totalAmount) / employees.length).toFixed(2)
      : null;

  /* ── manual total ── */
  const manualTotal = Object.values(manualAmounts)
    .reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

  /* ── submit ── */
  const handleSubmit = async () => {
    setErr(""); setMsg("");
    if (!form.date || !form.totalAmount) {
      setErr("Please enter a date and total tip amount.");
      return;
    }
    if (form.splitMethod === "manual") {
      const diff = Math.abs(manualTotal - parseFloat(form.totalAmount));
      if (diff > 0.1) {
        setErr(`Manual amounts total $${manualTotal.toFixed(2)} but total is $${form.totalAmount}. Please reconcile.`);
        return;
      }
    }

    let distributions = [];
    if (form.splitMethod === "equal") {
      const share = parseFloat((parseFloat(form.totalAmount) / employees.length).toFixed(2));
      distributions = employees.map((e) => ({ employee: e._id || e.id, amount: share }));
    } else if (form.splitMethod === "manual") {
      distributions = employees
        .filter((e) => parseFloat(manualAmounts[e._id || e.id]) > 0)
        .map((e) => ({ employee: e._id || e.id, amount: parseFloat(manualAmounts[e._id || e.id]) }));
    }

    setSubmitting(true);
    try {
      await api.post("/tips", {
        date: form.date,
        totalAmount: parseFloat(form.totalAmount),
        splitMethod: form.splitMethod,
        note: form.note,
        distributions,
      });
      setMsg(`✅ Tips of ${fmt(form.totalAmount)} distributed to ${distributions.length} employees!`);
      setForm({ date: new Date().toISOString().split("T")[0], totalAmount: "", splitMethod: "equal", note: "" });
      const init = {};
      employees.forEach((e) => { init[e._id || e.id] = ""; });
      setManualAmounts(init);
      fetchAll();
      setTab("history");
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to distribute tips.");
    } finally {
      setSubmitting(false);
    }
  };

  /* ── delete ── */
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this tip record?")) return;
    try {
      await api.delete(`/tips/${id}`);
      setTips((prev) => prev.filter((t) => t._id !== id));
    } catch {
      alert("Failed to delete.");
    }
  };

  /* ── totals ── */
  const grandTotal = tips.reduce((s, t) => s + t.totalAmount, 0);

  if (loading) return (
    <div className="su-page" style={{ textAlign:"center", padding:60, color:"#aaa" }}>
      <div style={{ fontSize:36 }}>💰</div>
      <div style={{ marginTop:10 }}>Loading tip data…</div>
    </div>
  );

  return (
    <div className="su-page">
      <div className="su-title">TIP MANAGER</div>

      {/* ── STATS STRIP ── */}
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        {[
          { icon:"💰", label:{t("totalTips")}, value: fmt(grandTotal) },
          { icon:"📋", label:{t("tipRecords")},             value: tips.length },
          { icon:"👥", label:{t("activeEmployees")},        value: employees.length },
          { icon:"📅", label:{t("lastDistribution")},       value: tips[0] ? fmtDate(tips[0].date) : "—" },
        ].map((s) => (
          <div key={s.label} style={{ background:"#1a1a1a", borderRadius:12, padding:"14px 20px", flex:1, minWidth:140 }}>
            <div style={{ fontSize:20 }}>{s.icon}</div>
            <div style={{ color:"#f5b800", fontWeight:800, fontSize:22, marginTop:4 }}>{s.value}</div>
            <div style={{ color:"#888", fontSize:11 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* ── TABS ── */}
      <div style={{ display:"flex", gap:4, background:"#f0f0ec", borderRadius:10, padding:4, marginBottom:20, width:"fit-content" }}>
        {[["add",{t("addTips")}], ["history",{t("tipHistory")}]].map(([key, label]) => (
          <button key={key} onClick={() => setTab(key)}
            style={{ padding:"8px 20px", border:"none", borderRadius:8, cursor:"pointer", fontWeight:700, fontSize:13,
              background: tab===key ? "#1a1a1a":"transparent", color: tab===key ? "#fff":"#666" }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "add" ? (
        /* ── ADD TIPS ── */
        <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, alignItems:"start" }}>

          {/* LEFT: Form */}
          <div className="su-card">
            <div className="su-card-title">Record Tip Distribution</div>
            {err && <div className="su-alert-err" style={{ marginBottom:14 }}>{err}</div>}
            {msg && <div className="su-alert-ok" style={{ marginBottom:14 }}>{msg}</div>}

            <div className="su-form-row">
              <label className="su-label">Date *</label>
              <input className="su-input" type="date"
                value={form.date} onChange={(e) => setForm({...form, date:e.target.value})} />
            </div>

            <div className="su-form-row">
              <label className="su-label">Total Tip Amount ($) *</label>
              <input className="su-input" type="number" min="0" step="0.01"
                placeholder="e.g. 350.00"
                value={form.totalAmount}
                onChange={(e) => setForm({...form, totalAmount:e.target.value})} />
            </div>

            <div className="su-form-row">
              <label className="su-label">Split Method *</label>
              <div style={{ display:"flex", gap:8 }}>
                {[["equal",{t("equalSplit")}], ["manual",{t("manualSplit")}]].map(([val, label]) => (
                  <button key={val} onClick={() => setForm({...form, splitMethod:val})}
                    style={{ flex:1, padding:"9px 0", border:"2px solid", borderRadius:10, cursor:"pointer",
                      fontWeight:700, fontSize:12,
                      borderColor: form.splitMethod===val ? "#f5b800":"#e0e0e0",
                      background:  form.splitMethod===val ? "#fff8e1":"#fff",
                      color:       form.splitMethod===val ? "#1a1a1a":"#888" }}>
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="su-form-row">
              <label className="su-label">Note (optional)</label>
              <input className="su-input" type="text"
                placeholder="e.g. Friday night dinner service"
                value={form.note}
                onChange={(e) => setForm({...form, note:e.target.value})} />
            </div>

            <button className="su-btn su-btn-black su-btn-pill"
              style={{ width:"100%", marginTop:8 }}
              onClick={handleSubmit} disabled={submitting}>
              {submitting ? "Distributing…" : `💰 Distribute ${form.totalAmount ? fmt(form.totalAmount) : "Tips"}`}
            </button>
          </div>

          {/* RIGHT: Preview */}
          <div className="su-card">
            <div className="su-card-title">
              Distribution Preview
              {form.splitMethod === "manual" && (
                <span style={{ fontSize:12, fontWeight:400, color: Math.abs(manualTotal - (parseFloat(form.totalAmount)||0)) > 0.1 ? "#dc2626":"#16a34a", marginLeft:10 }}>
                  Allocated: {fmt(manualTotal)} / {fmt(form.totalAmount || 0)}
                </span>
              )}
            </div>

            {employees.length === 0 ? (
              <div style={{ color:"#aaa", fontSize:13, padding:20, textAlign:"center" }}>No employees found.</div>
            ) : (
              <div style={{ display:"flex", flexDirection:"column", gap:8 }}>
                {employees.map((e) => {
                  const id   = e._id || e.id;
                  const name = e.name || `${e.firstName} ${e.lastName}`;
                  const amt  = form.splitMethod === "equal"
                    ? (equalShare ? fmt(equalShare) : "—")
                    : "";
                  return (
                    <div key={id} style={{ display:"flex", alignItems:"center", gap:10,
                      padding:"10px 12px", background:"#f9f9f7", borderRadius:10 }}>
                      {/* Avatar */}
                      <div style={{ width:34, height:34, borderRadius:"50%", background:"#f5b800",
                        display:"flex", alignItems:"center", justifyContent:"center",
                        fontWeight:800, fontSize:13, color:"#1a1a1a", flexShrink:0 }}>
                        {name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)}
                      </div>
                      <div style={{ flex:1 }}>
                        <div style={{ fontWeight:700, fontSize:13 }}>{name}</div>
                        <div style={{ fontSize:11, color:"#888" }}>{e.position}</div>
                      </div>
                      {/* Amount */}
                      {form.splitMethod === "equal" ? (
                        <div style={{ fontWeight:800, color:"#16a34a", fontSize:15 }}>{amt}</div>
                      ) : (
                        <input
                          type="number" min="0" step="0.01"
                          placeholder="0.00"
                          value={manualAmounts[id] || ""}
                          onChange={(ev) => setManualAmounts({...manualAmounts, [id]: ev.target.value})}
                          style={{ width:80, padding:"5px 8px", border:"1.5px solid #e0e0e0", borderRadius:8,
                            fontSize:13, fontWeight:700, textAlign:"right" }} />
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

      ) : (
        /* ── HISTORY ── */
        <div>
          {tips.length === 0 ? (
            <div style={{ textAlign:"center", padding:60, color:"#aaa" }}>
              <div style={{ fontSize:40 }}>📭</div>
              <div style={{ marginTop:10 }}>No tip records yet.</div>
            </div>
          ) : (
            <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
              {tips.map((t) => (
                <div key={t._id} style={{ background:"#fff", borderRadius:14, padding:"16px 20px",
                  boxShadow:"0 2px 8px rgba(0,0,0,.05)", borderLeft:"5px solid #f5b800" }}>

                  {/* Header row */}
                  <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", flexWrap:"wrap", gap:8 }}>
                    <div>
                      <span style={{ fontWeight:800, fontSize:15 }}>{fmtDate(t.date)}</span>
                      {t.note && <span style={{ marginLeft:10, color:"#888", fontSize:12 }}>{t.note}</span>}
                    </div>
                    <div style={{ display:"flex", alignItems:"center", gap:10 }}>
                      <span style={{ background:"#f5b800", color:"#1a1a1a", fontWeight:800,
                        padding:"4px 14px", borderRadius:20, fontSize:14 }}>
                        {fmt(t.totalAmount)}
                      </span>
                      <span style={{ background:"#f0f0ec", color:"#888", fontSize:11,
                        padding:"3px 10px", borderRadius:20, fontWeight:600, textTransform:"uppercase" }}>
                        {t.splitMethod}
                      </span>
                      <button onClick={() => handleDelete(t._id)}
                        style={{ background:"#fee2e2", border:"none", color:"#dc2626",
                          borderRadius:8, padding:"5px 12px", cursor:"pointer", fontSize:12, fontWeight:700 }}>
                        🗑 Delete
                      </button>
                    </div>
                  </div>

                  {/* Distributions */}
                  <div style={{ display:"flex", flexWrap:"wrap", gap:8, marginTop:12 }}>
                    {(t.distributions || []).map((d) => {
                      const name = d.employee?.name || `${d.employee?.firstName||""} ${d.employee?.lastName||""}`.trim() || "Employee";
                      return (
                        <div key={d._id || d.employee?._id} style={{
                          background:"#f9f9f7", border:"1px solid #f0f0ec",
                          borderRadius:8, padding:"6px 12px",
                          display:"flex", alignItems:"center", gap:8, fontSize:12 }}>
                          <div style={{ width:26, height:26, borderRadius:"50%", background:"#e0f2fe",
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontWeight:800, fontSize:10, color:"#0891b2" }}>
                            {name.split(" ").map(n=>n[0]).join("").toUpperCase().slice(0,2)}
                          </div>
                          <span style={{ fontWeight:600 }}>{name}</span>
                          <span style={{ fontWeight:800, color:"#16a34a" }}>{fmt(d.amount)}</span>
                        </div>
                      );
                    })}
                  </div>

                  <div style={{ marginTop:8, fontSize:11, color:"#bbb" }}>
                    Recorded by {t.recordedBy?.name || `${t.recordedBy?.firstName||""} ${t.recordedBy?.lastName||""}`} · {new Date(t.createdAt).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}