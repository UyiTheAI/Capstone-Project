import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const DAYS      = ["Mon","Tue","Wed","Thu","Fri","Sat","Sun"];
const DAYS_KEYS = ["availMon","availTue","availWed","availThu","availFri","availSat","availSun"];
const SLOTS = [
  { key: "morning",   labelKey: "morning",   subKey: "morningTime" },
  { key: "afternoon", labelKey: "afternoon", subKey: "afternoonTime" },
  { key: "evening",   labelKey: "evening",   subKey: "eveningTime" },
];

const defaultAvail = () =>
  Object.fromEntries(DAYS.map((d) => [d, { morning: true, afternoon: true, evening: false }]));

export default function Availability({user }) {
  const { t } = useLanguage();
  const [avail, setAvail] = useState(defaultAvail());
  const [availType, setAvailType] = useState(user?.availability || "Full-Time");
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    if (user?.availabilitySchedule) {
      setAvail(user.availabilitySchedule);
    }
  }, [user]);

  const toggle = (day, slot) =>
    setAvail((prev) => ({ ...prev, [day]: { ...prev[day], [slot]: !prev[day][slot] } }));

  const handleSave = async () => {
    setLoading(true);
    setErr("");
    try {
      await api.put("/users/me/availability", {
        availabilitySchedule: avail,
        availability: availType,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      setErr(e.response?.data?.message || "Failed to save availability.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="su-page">
      <div className="su-title">MY AVAILABILITY</div>
      <div className="su-card">
        <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
          <div>
            <label className="su-label">Availability Type</label>
            <select className="su-input" style={{ width: "auto", marginTop: 4 }} value={availType} onChange={(e) => setAvailType(e.target.value)}>
              <option value={t("fullTimeOpt")}>{t("fullTime")}</option>
              <option value={t("partTimeOpt")}>{t("partTime")}</option>
              <option value={t("onCallOpt")}>{t("onCall")}</option>
            </select>
          </div>
          <button className="su-btn su-btn-yellow su-btn-sm" onClick={handleSave} disabled={loading}>
            {loading ? <span className="spinner" style={{ borderTopColor: "#1a1a1a" }} /> : saved ? "✓ Saved!" : t("saveAvailability")}
          </button>
        </div>

        {err && <div className="su-alert-err">{err}</div>}

        <p className="text-sm text-muted mb-4">Check the time slots you are available to work each week.</p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 8, overflowX: "auto" }}>
          {DAYS.map((day, i) => (
            <div key={day} style={{ background: "#f9f9f7", borderRadius: 10, padding: 12, textAlign: "center", minWidth: 90 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", color: "#aaa", marginBottom: 10 }}>{t(DAYS_KEYS[i])}</div>
              {SLOTS.map(({ key, labelKey }) => {
                const checked = avail[day]?.[key] || false;
                return (
                  <label key={key} style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: 8, cursor: "pointer" }}>
                    <div
                      style={{
                        width: 36, height: 36, borderRadius: 8, border: "2px solid",
                        borderColor: checked ? "#f5b800" : "#e0e0e0",
                        background: checked ? "#f5b800" : "transparent",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        transition: "all .15s", cursor: "pointer",
                      }}
                      onClick={() => toggle(day, key)}
                    >
                      {checked && <span style={{ color: "#1a1a1a", fontSize: 16, fontWeight: 700 }}>✓</span>}
                    </div>
                    <span style={{ fontSize: 9, color: "#aaa", marginTop: 3, textAlign: "center" }}>{t(labelKey)}</span>
                  </label>
                );
              })}
            </div>
          ))}
        </div>

        <div className="mt-4 text-xs text-muted">
          ✦ Yellow = available &nbsp;|&nbsp; ○ = unavailable. Tap any slot to toggle.
        </div>
      </div>
    </div>
  );
}