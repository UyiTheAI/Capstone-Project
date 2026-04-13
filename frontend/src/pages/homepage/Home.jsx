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

const CYCLE = ["group chats.","sticky notes.","spreadsheets.","text threads."];
const NAV   = [["Features","#features"],["How it works","#how"],["Pricing","#pricing"],["Contact","#contact"]];

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

  useEffect(() => {
    const h = () => { setScrolled(window.scrollY > 20); };
    window.addEventListener("scroll", h, { passive:true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  // Active nav based on scroll position
  useEffect(() => {
    const sections = NAV.map(([,h]) => ({ id:h.slice(1), el:document.querySelector(h) })).filter(s=>s.el);
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
      setTimeout(() => { setWordIdx(i=>(i+1)%CYCLE.length); setWordOut(false); }, 350);
    }, 2400);
    return () => clearInterval(id);
  }, []);

  const [fRef,fVis]=useFadeIn(), [pRef,pVis]=useFadeIn(), [cRef,cVis]=useFadeIn();

  const sendContact = async (e) => {
    e.preventDefault();
    if (!cForm.name||!cForm.email||!cForm.message) { setCErr("Please fill in all fields."); return; }
    setCLoad(true); setCErr(""); setCMsg("");
    try {
      await api.post("/contact", cForm);
      setCMsg("Message sent! We'll get back to you within 1–2 business days.");
      setCForm({ name:"", email:"", message:"" });
    } catch(err) { setCErr(err.response?.data?.message||"Failed to send. Please try again."); }
    finally { setCLoad(false); }
  };

  const FEATURES = [
    { title:t("mySchedule"),    desc:"Build the week's schedule in minutes. Assign roles, publish — your team is notified instantly." },
    { title:t("shiftSwap"),     desc:"Employees request swaps through the app. Managers approve in one tap. No back-and-forth." },
    { title:t("dashboard"),     desc:"Who's in, who's out, what's pending — all in one place without digging through messages." },
    { title:t("notifications"), desc:"Shift added, swap approved, schedule changed — the right people find out automatically." },
    { title:t("staffReports"),  desc:"Pull attendance and hours for any period. Built for payroll, not just demos." },
    { title:t("tips"),          desc:"Distribute tips equally or manually. Employees see their payout instantly." },
  ];

  const PRICING_ITEMS = [
    "Unlimited shift scheduling","Staff management & registration",
    t("shiftSwap"),t("swapApprovals"),t("staffReports"),
    "7 Canadian languages","Attendance tracking",t("notifications"),t("dashboard"),
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

          {/* Language switcher — right after brand */}
          <div style={{ marginRight:24, flexShrink:0 }}>
            <LanguageSwitcher />
          </div>

          {/* Divider */}
          <div style={{ width:1, height:22, background:"#ebebeb", marginRight:24, flexShrink:0 }} />

          {/* Nav links — normal weight, dark hover */}
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

          {/* Right actions */}
          <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
            <button onClick={onLoginClick}
              style={{ padding:"8px 18px", background:"transparent", border:"1.5px solid #e0e0e0", borderRadius:9, fontFamily:"var(--font-body)", fontSize:13, fontWeight:500, color:"#555", cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap" }}
              onMouseOver={e=>{e.currentTarget.style.borderColor="#1a1a1a";e.currentTarget.style.color="#1a1a1a";}}
              onMouseOut={e=>{e.currentTarget.style.borderColor="#e0e0e0";e.currentTarget.style.color="#555";}}>
              {t("signIn")}
            </button>
            <button onClick={onGetStarted}
              style={{ padding:"9px 20px", background:"#f5b800", border:"2px solid #f5b800", borderRadius:9, fontFamily:"var(--font-body)", fontSize:13, fontWeight:800, color:"#1a1a1a", cursor:"pointer", transition:"all .18s", whiteSpace:"nowrap", boxShadow:"0 2px 10px rgba(245,184,0,.25)" }}
              onMouseOver={e=>{e.currentTarget.style.background="#e5a800";e.currentTarget.style.borderColor="#e5a800";e.currentTarget.style.boxShadow="0 4px 18px rgba(245,184,0,.4)";}}
              onMouseOut={e=>{e.currentTarget.style.background="#f5b800";e.currentTarget.style.borderColor="#f5b800";e.currentTarget.style.boxShadow="0 2px 10px rgba(245,184,0,.25)";}}>
              {t("getStarted")} →
            </button>

            {/* Mobile hamburger */}
            <button onClick={()=>setMobileOpen(o=>!o)}
              style={{ display:"none", width:38, height:38, background:"#f4f4f0", border:"1px solid #e5e5e5", borderRadius:9, cursor:"pointer", alignItems:"center", justifyContent:"center", fontSize:17, color:"#555", flexShrink:0, marginLeft:4 }}
              className="nav-hamburger">
              {mobileOpen?"✕":"☰"}
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div style={{ background:"#fff", borderTop:"1px solid #f0f0f0", padding:"12px 24px 20px" }}>
            {NAV.map(([l,h])=>(
              <a key={h} href={h} onClick={()=>setMobileOpen(false)}
                style={{ display:"block", padding:"11px 0", fontSize:14, fontWeight:400, color:"#888", textDecoration:"none", borderBottom:"1px solid #f5f5f5", transition:"color .15s" }}
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
      <section className="hero">
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="hero-inner">
            <div style={{ display:"inline-flex", alignItems:"center", gap:8, background:"rgba(245,184,0,.1)", border:"1px solid rgba(245,184,0,.2)", borderRadius:20, padding:"5px 14px", marginBottom:20 }}>
              <span style={{ fontSize:10, color:"#f5b800", fontWeight:700, letterSpacing:1.5, textTransform:"uppercase" }}>🍁 Built for Canadian teams</span>
            </div>
            <p className="hero-eyebrow">Shift scheduling for restaurants & small teams</p>
            <h1 className="hero-h1">
              Stop managing<br/>shifts in{" "}
              <span className={`hero-word ${wordOut?"hero-word-out":"hero-word-in"}`}>{CYCLE[wordIdx]}</span>
            </h1>
            <p className="hero-sub">
              SHIFT-UP gives managers a real schedule they can publish, and gives employees one place to see it.
              Swaps go through the app — not through you.
            </p>
            <div className="hero-ctas">
              <button className="btn-primary" onClick={onGetStarted}>Start free trial — 7 days</button>
              <button className="btn-secondary" onClick={onLoginClick}>{t("signIn")}</button>
            </div>
            <p className="hero-fine">No credit card until trial ends · No setup fee · Cancel anytime</p>
            <div style={{ display:"flex", gap:24, marginTop:32, flexWrap:"wrap" }}>
              {[["🍁","Made for Canada"],["🔒","Stripe secured"],["🌐","7 languages"],["⚡","10-min setup"]].map(([ic,tx])=>(
                <div key={tx} style={{ display:"flex", alignItems:"center", gap:7, fontSize:12, color:"#888" }}>
                  <span>{ic}</span><span>{tx}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ FEATURES ══════════════════════════════════════════════════════ */}
      <section id="features" ref={fRef} className={`features ${fVis?"fade-visible":"fade-hidden"}`}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="features-header">
            <h2 className="section-title">{t("featuresTitle")}</h2>
            <p className="section-sub">Built for businesses where the schedule changes every week and half the team doesn't have work email.</p>
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
      <section id="how" style={{ background:"#fff", padding:"80px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div style={{ textAlign:"center", marginBottom:60 }}>
            <h2 style={{ fontFamily:"var(--font-head)", fontSize:42, color:"#1a1a1a", marginBottom:12, letterSpacing:1 }}>HOW IT WORKS</h2>
            <p style={{ color:"#888", fontSize:15, maxWidth:480, margin:"0 auto", lineHeight:1.7 }}>Up and running in under 10 minutes. No training required.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:48 }}>
            {[
              { n:"01", icon:"🔐", title:"Create your account",        desc:"Sign up, enter your details, and complete the 7-day free trial setup. Account is created after Stripe payment." },
              { n:"02", icon:"👥", title:"Register your team",          desc:"Add managers and employees from the Register Staff page. Each gets their own login instantly." },
              { n:"03", icon:"📅", title:"Build & publish the schedule",desc:"Create shifts, assign roles, hit publish. Your team gets notified automatically." },
            ].map((s,i,a)=>(
              <div key={s.n} style={{ position:"relative" }}>
                {i<a.length-1 && <div style={{ position:"absolute", top:20, left:"calc(100% + 24px)", width:24, height:2, background:"#f0f0ec" }} />}
                <div style={{ width:44, height:44, borderRadius:12, background:"#f5b800", display:"flex", alignItems:"center", justifyContent:"center", fontSize:22, marginBottom:16 }}>{s.icon}</div>
                <div style={{ fontSize:11, fontWeight:700, color:"#ccc", letterSpacing:2, marginBottom:8 }}>{s.n}</div>
                <h3 style={{ fontSize:16, fontWeight:800, color:"#1a1a1a", marginBottom:10 }}>{s.title}</h3>
                <p style={{ fontSize:13, color:"#888", lineHeight:1.7 }}>{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══ PRICING ═══════════════════════════════════════════════════════ */}
      <section id="pricing" ref={pRef} className={`pricing ${pVis?"fade-visible":"fade-hidden"}`}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", flexDirection:"column", alignItems:"center" }}>
          <h2 className="pricing-h">SIMPLE PRICING</h2>
          <p className="pricing-sub">Start free for 7 days. Then just $5 CAD/month — less than a coffee.</p>
          <div className="pricing-card">
            <div className="pricing-card-head">
              <div className="pricing-trial-left">
                <span className="pricing-t-badge">T</span>
                <div>
                  <div className="pricing-trial-title">7-Day Free Trial</div>
                  <div className="pricing-trial-sub">Card saved now · Charged only after trial ends · Cancel anytime</div>
                </div>
              </div>
              <span className="pricing-free-badge">FREE</span>
            </div>
            <div className="pricing-amount">
              <span className="pricing-dollar">$5</span>
              <div className="pricing-suffix"><span className="pricing-cad">CAD</span><span className="pricing-mo">{t("perMonth")} after trial</span></div>
            </div>
            <ul className="pricing-list">
              {PRICING_ITEMS.map(item=>(
                <li key={item} className="pricing-item"><span className="pricing-check">✓</span>{item}</li>
              ))}
            </ul>
            <button className="pricing-cta" onClick={onGetStarted}>🔒 Start Free Trial — No Credit Card Charged Today</button>
            <p className="pricing-stripe">Secured by Stripe · Account created only after payment</p>
          </div>
        </div>
      </section>

      {/* ══ CONTACT ═══════════════════════════════════════════════════════ */}
      <section id="contact" ref={cRef} className={`contact ${cVis?"fade-visible":"fade-hidden"}`}>
        <div style={{ maxWidth:1200, margin:"0 auto" }}>
          <div className="contact-inner">
            <h2 className="section-title">{t("contactTitle")}</h2>
            <p className="section-sub">{t("contactSubtitle")}</p>
            <form className="contact-form" onSubmit={sendContact}>
              <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:14 }}>
                <input type="text" placeholder="Your Name" value={cForm.name} onChange={e=>setCForm(f=>({...f,name:e.target.value}))} required />
                <input type="email" placeholder="Your Email" value={cForm.email} onChange={e=>setCForm(f=>({...f,email:e.target.value}))} required />
              </div>
              <textarea placeholder="Your message…" value={cForm.message} onChange={e=>setCForm(f=>({...f,message:e.target.value}))} required />
              {cErr && <div className="contact-err">⚠ {cErr}</div>}
              {cMsg && <div className="contact-ok">✅ {cMsg}</div>}
              <button type="submit" className="contact-submit" disabled={cLoad}>{cLoad?"Sending…":"Send Message →"}</button>
            </form>
          </div>
        </div>
      </section>

      {/* ══ FOOTER ════════════════════════════════════════════════════════ */}
      <footer style={{ background:"#111", padding:"36px 32px" }}>
        <div style={{ maxWidth:1200, margin:"0 auto", display:"flex", alignItems:"center", justifyContent:"space-between", flexWrap:"wrap", gap:16 }}>
          <div style={{ display:"flex", alignItems:"center", gap:10 }}>
            <div style={{ width:32, height:32, background:"#f5b800", borderRadius:8, display:"flex", alignItems:"center", justifyContent:"center", fontFamily:"'Bebas Neue',sans-serif", fontSize:15, color:"#1a1a1a" }}>SU</div>
            <span style={{ fontFamily:"'Bebas Neue',sans-serif", fontSize:20, color:"#fff", letterSpacing:2 }}>{t("appName")}</span>
            <span style={{ fontSize:11, color:"#333", marginLeft:4 }}>🍁</span>
          </div>
          <p style={{ color:"#333", fontSize:12, margin:0 }}>© {new Date().getFullYear()} SHIFT-UP</p>
          <div style={{ display:"flex", gap:20, alignItems:"center" }}>
            {NAV.map(([l,h])=>(
              <a key={h} href={h} style={{ color:"#555", fontSize:13, textDecoration:"none", transition:"color .15s" }}
                onMouseOver={e=>e.currentTarget.style.color="#f5b800"}
                onMouseOut={e=>e.currentTarget.style.color="#555"}>{l}</a>
            ))}
            <button onClick={onLoginClick} style={{ color:"#555", fontSize:13, background:"none", border:"none", cursor:"pointer", fontFamily:"var(--font-body)", padding:0 }}>{t("signIn")}</button>
          </div>
        </div>
      </footer>
    </div>
  );
}