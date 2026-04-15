import React, { useState, useRef, useEffect } from "react";
import "../../App.css";
import "./Home.css";
import { useLanguage } from "../../context/LanguageContext";
import LanguageSwitcher from "../../components/LanguageSwitcher";
import api from "../../api";

function useFadeIn() {
  const ref = useRef(null);
  const [vis, setVis] = useState(false);
  useEffect(() => {
    const el = ref.current; if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if(e.isIntersecting){setVis(true);obs.disconnect();} },{threshold:.1});
    obs.observe(el); return () => obs.disconnect();
  }, []);
  return [ref, vis];
}

export default function Home({ onGetStarted, onLoginClick }) {
  const { t } = useLanguage();
  const [scrolled,   setScrolled]   = useState(false);
  const [activeNav,  setActiveNav]  = useState("");
  const [wordIdx,    setWordIdx]    = useState(0);
  const [wordOut,    setWordOut]    = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [cForm, setCForm] = useState({ name:"", email:"", message:"" });
  const [cMsg,  setCMsg]  = useState("");
  const [cErr,  setCErr]  = useState("");
  const [cLoad, setCLoad] = useState(false);

  const NAV = [
    [t("navFeatures"),    "#features"],
    [t("navHowItWorks"),  "#how"],
    [t("navPricing"),     "#pricing"],
    [t("navContact"),     "#contact"],
  ];

  const CYCLE = [t("heroSwap1"), t("heroSwap2"), t("heroSwap3"), t("heroSwap4")];

  useEffect(() => {
    const h = () => { setScrolled(window.scrollY > 20); };
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const sections = [
      { id:"features", el:document.querySelector("#features") },
      { id:"how",      el:document.querySelector("#how") },
      { id:"pricing",  el:document.querySelector("#pricing") },
      { id:"contact",  el:document.querySelector("#contact") },
    ].filter(s=>s.el);
    const h = () => {
      const scrollY = window.scrollY + 80;
      let active = "";
      sections.forEach(s => { if (scrollY >= s.el.offsetTop) active = `#${s.id}`; });
      setActiveNav(active);
    };
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      setWordOut(true);
      setTimeout(() => { setWordIdx(i=>(i+1)%4); setWordOut(false); }, 350);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const [fRef,fVis]=useFadeIn(), [hRef,hVis]=useFadeIn(), [pRef,pVis]=useFadeIn();

  const sendContact = async (e) => {
    e.preventDefault();
    if (!cForm.name||!cForm.email||!cForm.message) { setCErr(t("contactErrFields")); return; }
    setCLoad(true); setCErr(""); setCMsg("");
    try {
      await api.post("/contact", cForm);
      setCMsg(t("contactSuccessMsg"));
      setCForm({ name:"", email:"", message:"" });
    } catch(err) { setCErr(err.response?.data?.message||t("contactErrFail")); }
    finally { setCLoad(false); }
  };

  const FEATURES = [
    { title:t("mySchedule"),    desc:t("featDesc1") },
    { title:t("shiftSwap"),     desc:t("featDesc2") },
    { title:t("dashboard"),     desc:t("featDesc3") },
    { title:t("notifications"), desc:t("featDesc4") },
    { title:t("staffReports"),  desc:t("featDesc5") },
    { title:t("tips"),          desc:t("featDesc6") },
  ];

  const PRICING_ITEMS = [
    t("pricingFeat1"), t("pricingFeat2"), t("pricingFeat3"),
    t("pricingFeat4"), t("pricingFeat5"), t("pricingFeat6"),
    t("pricingFeat7"), t("pricingFeat8"), t("pricingFeat9"), t("pricingFeat10"),
  ];

  return (
    <div style={{ fontFamily:"var(--font-body)", background:"#f4f4f0" }}>

      {/* ══ NAVBAR ════════════════════════════════════════════════════════ */}
      <header style={{
        position:"sticky", top:0, zIndex:200,
        background: scrolled ? "#fff" : "rgba(255,255,255,.97)",
        backdropFilter: "blur(16px)",
        borderBottom: `1px solid ${scrolled?"#ebebeb":"transparent"}`,
        boxShadow: scrolled ? "0 2px 28px rgba(0,0,0,.08)" : "none",
        transition: "border-color .3s, box-shadow .3s",
      }}>
        <div style={{ maxWidth:1200, margin:"0 auto", padding:"0 32px", height:64, display:"flex", alignItems:"center", gap:0 }}>

          {/* Brand */}
          <div style={{ display:"flex", alignItems:"center", gap:10, flexShrink:0, marginRight:32 }}>
            <div style={{ width:36, height:36, background:"#1a1a1a", borderRadius:10, display:"flex", alignItems:"center", justifyContent:"center" }}>
              <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:17, color:"#f5b800", fontWeight:900 }}>SU</span>
            </div>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:22, color:"#1a1a1a", letterSpacing:2 }}>
              {t("appName")}
            </span>
          </div>

          <div style={{ marginRight:24, flexShrink:0 }}>
            <LanguageSwitcher />
          </div>

          <div style={{ width:1, height:22, background:"#ebebeb", marginRight:24, flexShrink:0 }} />

          <nav style={{ display:"flex", alignItems:"center", gap:1, flex:1 }}>
            {NAV.map(([label, href]) => {
              const isActive = activeNav === href;
              return (
                <a key={href} href={href}
                  style={{
                    padding:"8px 14px", borderRadius:8, fontSize:13,
                    fontWeight: isActive ? 600 : 400,
                    color: isActive ? "#1a1a1a" : "#888",
                    textDecoration:"none", transition:"all .18s",
                    background: isActive ? "#f0f0ec" : "transparent",
                    borderBottom: isActive ? "2px solid #1a1a1a" : "2px solid transparent",
                    letterSpacing: .1,
                  }}
                  onMouseOver={e=>{if(!isActive){e.currentTarget.style.color="#1a1a1a";e.currentTarget.style.background="#f7f7f5";}}}
                  onMouseOut={e=>{if(!isActive){e.currentTarget.style.color="#888";e.currentTarget.style.background="transparent";}}}>
                  {label}
                </a>
              );
            })}
          </nav>

          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <button onClick={onLoginClick}
              style={{ padding:"8px 18px", background:"transparent", border:"1.5px solid #e0e0e0", borderRadius:9, fontFamily:"var(--font-body)", fontSize:13, fontWeight:500, color:"#555", cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor="#1a1a1a";e.currentTarget.style.color="#1a1a1a";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor="#e0e0e0";e.currentTarget.style.color="#555";}}>
              {t("signIn")}
            </button>
            <button onClick={onGetStarted}
              style={{ padding:"9px 20px", background:"#f5b800", border:"2px solid #f5b800", borderRadius:9, fontFamily:"var(--font-body)", fontSize:13, fontWeight:800, color:"#1a1a1a", cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap", boxShadow:"0 2px 10px rgba(245,184,0,.25)" }}
              onMouseOver={e=>{e.currentTarget.style.background="#e5a800";e.currentTarget.style.borderColor="#e5a800";}}
              onMouseOut={e=>{e.currentTarget.style.background="#f5b800";e.currentTarget.style.borderColor="#f5b800";}}>
              {t("getStarted")} →
            </button>

            <button onClick={()=>setMobileOpen(o=>!o)}
              style={{ display:"none", width:38, height:38, background:"#f4f4f0", border:"1px solid #e5e5e5", borderRadius:9, cursor:"pointer", alignItems:"center", justifyContent:"center", fontSize:17, color:"#555", flexShrink:0, marginLeft:4 }}
              className="nav-hamburger">
              {mobileOpen?"✕":"☰"}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <div style={{ background:"#fff", borderTop:"1px solid #f0f0f0", padding:"12px 24px 20px" }}>
            {NAV.map(([l,h])=>(
              <a key={h} href={h} onClick={()=>setMobileOpen(false)}
                style={{ display:"block", padding:"11px 0", fontSize:14, fontWeight:400, color:"#888", textDecoration:"none", borderBottom:"1px solid #f5f5f5" }}
                onMouseOver={e=>e.currentTarget.style.color="#1a1a1a"}
                onMouseOut={e=>e.currentTarget.style.color="#888"}>
                {l}
              </a>
            ))}
            <div style={{ marginTop:14, marginBottom:14 }}>
              <LanguageSwitcher />
            </div>
            <div style={{ display:"flex", gap:10 }}>
              <button onClick={()=>{onLoginClick();setMobileOpen(false);}} style={{ flex:1, padding:"11px", border:"1.5px solid #e0e0e0", borderRadius:9, background:"#fff", fontFamily:"var(--font-body)", fontSize:13, fontWeight:500, color:"#555", cursor:"pointer" }}>{t("signIn")}</button>
              <button onClick={()=>{onGetStarted();setMobileOpen(false);}} style={{ flex:1, padding:"11px", border:"none", borderRadius:9, background:"#f5b800", fontFamily:"var(--font-body)", fontSize:13, fontWeight:800, color:"#1a1a1a", cursor:"pointer" }}>{t("getStarted")}</button>
            </div>
          </div>
        )}
      </header>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="hero" style={{ backgroundImage:`url(${process.env.PUBLIC_URL}/hero-bg.jpg)`, backgroundSize:"cover", backgroundPosition:"center 40%" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="hero-inner">
            <p className="hero-eyebrow">{t("heroTitle")}</p>
            <h1 className="hero-h1">
              {t("heroSubtitle").split(".")[0]}
              {" "}
              <span className={`hero-word ${wordOut?"hero-word-out":"hero-word-in"}`}>{CYCLE[wordIdx]}</span>
            </h1>
            <p className="hero-sub">
              {t("featuresSubtitle")}
            </p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={onGetStarted}>{t("getStarted")}</button>
              <button className="btn-secondary" onClick={onLoginClick}>{t("signIn")}</button>
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
      <section id="features" ref={fRef} className={`features ${fVis?"fade-visible":"fade-hidden"}`}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="features-header">
            <h2 className="section-title">{t("featuresTitle")}</h2>
            <p className="section-sub">{t("featuresSubtitle")}</p>
          </div>
          <div className="features-grid">
            {FEATURES.map(({title,desc},i)=>(
              <div key={title} className="feature-cell" style={{ transitionDelay:fVis?`${i*60}ms`:"0ms" }}>
                <div className="feature-dot"/><h3 className="feature-title">{title}</h3><p className="feature-desc">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ HOW IT WORKS ══════════════════════════════════════════════════ */}
      <section id="how" ref={hRef} className={`how ${hVis?"fade-visible":"fade-hidden"}`}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="how-header">
            <h2 className="section-title" style={{ color:"#fff" }}>{t("howItWorksTitle")}</h2>
            <p className="section-sub" style={{ color:"#888" }}>{t("howItWorksSubtitle")}</p>
          </div>
          <div className="how-steps">
            {[
              { n:"01", title:t("howStep1Title"), desc:t("howStep1Desc") },
              { n:"02", title:t("howStep2Title"), desc:t("howStep2Desc") },
              { n:"03", title:t("howStep3Title"), desc:t("howStep3Desc") },
            ].map((s,i)=>(
              <div key={s.n} className="how-step" style={{ transitionDelay:hVis?`${i*100}ms`:"0ms" }}>
                <div className="how-step-num">{s.n}</div>
                <h3 className="how-step-title">{s.title}</h3>
                <p className="how-step-desc">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════════════════ */}
      <section id="pricing" ref={pRef} className={`pricing ${pVis?"fade-visible":"fade-hidden"}`}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:56 }}>
            <h2 className="pricing-h">{t("pricingTitle")}</h2>
            <p style={{ color:"#888", fontSize:16, margin:"12px auto 0", maxWidth:440 }}>{t("pricingSubtitle")}</p>
          </div>
          <div className="pricing-outer">
            <div className="pricing-left">
              <div className="pricing-trial-banner">
                <span>{t("trialBannerTitle")}</span>
                <span className="pricing-free-tag">{t("trialBannerFree")}</span>
              </div>
              <div className="pricing-amount">
                <span className="pricing-dollar">$5</span>
                <div className="pricing-suffix">
                  <span className="pricing-cad">CAD</span>
                  <span className="pricing-mo">{t("perMonth")}</span>
                </div>
              </div>
              <p className="pricing-card-sub">{t("proDesc")} {t("trialBannerDesc")}.</p>
              <button className="pricing-cta" onClick={onGetStarted}>{t("ctaGuest")} →</button>
            </div>
            <div className="pricing-right">
              <p className="pricing-features-label">{t("featuresTitle")}</p>
              <div className="pricing-features-grid">
                {PRICING_ITEMS.map(item=>(
                  <div key={item} className="pricing-feature-row">
                    <span className="pricing-check">✓</span>
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══ CONTACT ═══════════════════════════════════════════════════════ */}
      <section id="contact">
        <div className="contact-wrap">
          <div className="contact-left-panel">
            <span className="contact-eyebrow">{t("navContact")}</span>
            <h2 className="contact-head">{t("contactTitle").toUpperCase()}</h2>
            <p className="contact-left-sub">{t("contactSubtitle")}</p>
            <div className="contact-meta">
              <div className="contact-meta-row"><div className="contact-meta-dot"/><span>{t("contactMetaReply")}</span></div>
              <div className="contact-meta-row"><div className="contact-meta-dot"/><span>support@shiftup.ca</span></div>
              <div className="contact-meta-row"><div className="contact-meta-dot"/><span>{t("contactMetaHours")}</span></div>
            </div>
          </div>
          <div className="contact-right-panel">
            <form className="contact-form" onSubmit={sendContact}>
              <div className="contact-form-row">
                <div className="contact-field">
                  <label className="contact-label">{t("name")}</label>
                  <input type="text" placeholder={t("contactNamePlaceholder")} value={cForm.name} onChange={e=>setCForm(f=>({...f,name:e.target.value}))} required />
                </div>
                <div className="contact-field">
                  <label className="contact-label">{t("email")}</label>
                  <input type="email" placeholder="your@email.com" value={cForm.email} onChange={e=>setCForm(f=>({...f,email:e.target.value}))} required />
                </div>
              </div>
              <div className="contact-field">
                <label className="contact-label">{t("contactMsgLabel")}</label>
                <textarea placeholder={t("contactMsgPlaceholder")} value={cForm.message} onChange={e=>setCForm(f=>({...f,message:e.target.value}))} required />
              </div>
              {cErr && <div className="contact-err">{cErr}</div>}
              {cMsg && <div className="contact-ok">{cMsg}</div>}
              <button type="submit" className="contact-submit" disabled={cLoad}>
                {cLoad ? t("contactSending") : `${t("contactSendBtn")} →`}
              </button>
            </form>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{ background:"#fff", borderTop:"1px solid #e8e8e4", padding:"36px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, background:"#1a1a1a", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:"#f5b800" }}>SU</div>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#1a1a1a", letterSpacing:2 }}>{t("appName")}</span>
          </div>
          <p style={{ color:"#bbb", fontSize:12, margin:0 }}>© {new Date().getFullYear()} SHIFT-UP</p>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            {NAV.map(([l,h])=>(
              <a key={h} href={h} style={{ color:"#aaa", fontSize:13, textDecoration:"none", transition:"color .15s" }}
                onMouseOver={e=>e.currentTarget.style.color="#1a1a1a"}
                onMouseOut={e=>e.currentTarget.style.color="#aaa"}>{l}</a>
            ))}
            <button onClick={onLoginClick} style={{ color:"#aaa", fontSize:13, background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", padding:0 }}>{t("signIn")}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}
