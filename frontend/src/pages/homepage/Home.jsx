import React, { useEffect, useState } from "react";
import "../../App.css";
import { useLanguage } from "../../context/LanguageContext";

const Home = ({ onGetStarted, onLoginClick }) => {
  const { t } = useLanguage();
  const [showHeader, setShowHeader] = useState(true);
  const [lastY, setLastY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      setShowHeader(window.scrollY < lastY || window.scrollY < 60);
      setLastY(window.scrollY);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastY]);

  const features = [
    ["📅", "Scheduling",           "Plan shifts in minutes with intelligent scheduling that respects employee availability, roles, and staffing needs."],
    ["📊", "Reports & Analytics",  "Access coverage and staffing reports instantly with cost breakdowns."],
    ["🔄", "Shift Swap",           "Employees submit swap requests through a guided workflow, keeping changes organized."],
    ["✅", "Manager Approvals",    "Approve or reject swap requests while maintaining full control over coverage."],
    ["🔔", "Smart Notifications",  "Automatic alerts keep managers and staff informed about schedules and changes."],
    ["📈", "Manager Dashboard",    "Monitor hours, coverage, and upcoming shifts at a glance."],
  ];

  const pricingItems = [
    "Employee scheduling",
    "Shift swap requests",
    "Schedule change notifications",
    "Manager dashboard",
  ];

  // Stats cards — renamed from `t` to `stat` to avoid shadowing the translation function
  const heroStats = ["⚡ 3 Pending Swaps", "✅ 95% Coverage"];

  return (
    <div style={{ fontFamily: "var(--font-body)", color: "#1a1a1a" }}>

      {/* HEADER */}
      <header
        className="su-header"
        style={{ opacity: showHeader ? 1 : 0, transition: "opacity 0.3s", position: "sticky", top: 0, zIndex: 100 }}
      >
        <div className="su-brand">
          <div className="su-logobox">UP</div>
          {t("appName")}
        </div>
        <nav className="su-nav">
          <a href="#features" className="su-navbtn" style={{ textDecoration: "none", color: "#1a1a1a" }}>{t("featuresTitle")}</a>
          <a href="#pricing"  className="su-navbtn" style={{ textDecoration: "none", color: "#1a1a1a" }}>{t("pricingTitle")}</a>
          <button className="su-btn su-btn-outline su-btn-sm" onClick={onLoginClick}>{t("login")}</button>
          <button className="su-btn su-btn-black su-btn-sm"   onClick={onGetStarted}>{t("getStarted")}</button>
        </nav>
      </header>

      {/* HERO */}
      <section style={{ background: "#1a1a1a", padding: "72px 56px", display: "grid", gridTemplateColumns: "1fr 1fr", gap: 36, alignItems: "center" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-head)", fontSize: 62, color: "#fff", lineHeight: 1.05 }}>
            {t("heroTitle")}
          </h1>
          <p style={{ color: "#aaa", marginTop: 12, fontSize: 15, lineHeight: 1.7 }}>
            {t("heroSubtitle")}
          </p>
          <button className="su-btn su-btn-yellow mt-4" onClick={onGetStarted}>{t("getStarted")} →</button>
        </div>
        <div style={{ background: "#f5b800", borderRadius: 18, padding: 28 }}>
          <div style={{ background: "#1a1a1a", borderRadius: 12, padding: 20, color: "#fff" }}>
            <div className="text-xs text-muted mb-2" style={{ color: "#666" }}>{t("todaysCoverage")}</div>
            {[["Front", "Maria G."], ["Kitchen", "Kevin C."], ["Bar", "Sarah T."], ["Waitstaff", "John M."]].map(([area, emp]) => (
              <div key={area} className="flex justify-between mt-2 text-sm" style={{ borderBottom: "1px solid #333", paddingBottom: 6 }}>
                <span style={{ color: "#888" }}>{area}</span><span>{emp}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-2 mt-3">
            {heroStats.map((stat) => (
              <div key={stat} style={{ flex: 1, background: "rgba(0,0,0,.15)", borderRadius: 9, padding: "9px 12px", fontSize: 12, fontWeight: 700 }}>{stat}</div>
            ))}
          </div>
        </div>
      </section>

      {/* FEATURES */}
      <section style={{ padding: "56px 56px" }} id="features">
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 38, marginBottom: 22 }}>{t("featuresTitle")}</h2>
        <div className="su-g3" style={{ gap: 14 }}>
          {features.map(([icon, title, desc]) => (
            <div key={title} className="su-card">
              <div style={{ fontSize: 26 }}>{icon}</div>
              <h3 style={{ fontSize: 14, fontWeight: 700, margin: "10px 0 8px" }}>{title}</h3>
              <p style={{ fontSize: 13, color: "#666", lineHeight: 1.6 }}>{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section style={{ background: "#1a1a1a", padding: "56px", textAlign: "center" }} id="pricing">
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 38, color: "#fff", marginBottom: 22 }}>{t("pricingTitle")}</h2>
        <div style={{ background: "#f5b800", borderRadius: 18, padding: "30px 32px", maxWidth: 300, margin: "0 auto" }}>
          <div style={{ fontFamily: "var(--font-head)", fontSize: 52 }}>$5<span style={{ fontSize: 18 }}>{t("perMonth")}</span></div>
          <ul style={{ listStyle: "none", margin: "18px 0", textAlign: "left" }}>
            {pricingItems.map((item) => (
              <li key={item} style={{ padding: "5px 0", fontSize: 13, borderBottom: "1px solid rgba(0,0,0,.1)" }}>✓ {item}</li>
            ))}
          </ul>
          <button className="su-btn su-btn-black w-full" onClick={onGetStarted}>{t("getStarted")}</button>
        </div>
      </section>

      {/* ABOUT */}
      <section style={{ padding: "56px", background: "#fff" }} id="about">
        <h2 style={{ fontFamily: "var(--font-head)", fontSize: 38, marginBottom: 14 }}>ABOUT SHIFT-UP</h2>
        <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, maxWidth: 620, marginBottom: 10 }}>
          At ShiftUp, we believe in empowering businesses with smarter, more efficient ways to manage their workforce.
        </p>
        <p style={{ color: "#555", fontSize: 14, lineHeight: 1.7, maxWidth: 620 }}>
          Create and publish schedules in minutes, employees view shifts in real-time, and managers can communicate effectively with their entire team.
        </p>
      </section>

    </div>
  );
};

export default Home;