import React, { useEffect, useState } from "react";
import "./Home.css";
import heroImage from "../../assets/hero-image.jpg";
import logo from "../../assets/up-text-icon.jpg";

const Home = ({ onGetStarted, onLoginClick }) => {

  /* ===== Scroll Navbar Logic ===== */
  const [showHeader, setShowHeader] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY < lastScrollY) {
        setShowHeader(true);   // scrolling UP
      } else {
        setShowHeader(false);  // scrolling DOWN
      }
      setLastScrollY(window.scrollY);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [lastScrollY]);

  return (
    <div className="page">

      {/* Top navigation */}
      <header className={`header ${showHeader ? "show" : "hide"}`}>
        <section className="title-section">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <div className="title">SHIFT-UP</div>
        </section>

        <section className="nav-section">
          <nav className="nav">
            <a href="#features">Features</a>
            <a href="#pricing">Pricing</a>
            <a href="#about">About</a>
          </nav>

          <div className="header-actions">
            <button
              type="button"
              className="btn btn-outline"
              onClick={onLoginClick}
            >
              Login
            </button>

            <button
              type="button"
              className="btn btn-primary"
              onClick={onGetStarted}
            >
              Get Started
            </button>
          </div>
        </section>
      </header>

      {/* Hero */}
      <section className="hero">
        <div className="hero-text">
          <h1>Elevate Your Business into the Future</h1>
          <p className="hero-subtitle">
            Accelerate, Optimize, Transform
          </p>

          <button
            className="btn btn-primary hero-cta"
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* Hero image */}
      <section className="hero-image-container">
        <div className="hero-image">
          <img src={heroImage} alt="Hero" />
        </div>
      </section>

      {/* Value statement */}
      <section className="intro" id="features">
        <p>
          With ShiftUp, experience a seamless flow from scheduling to payday.
          Manage every shift and hour effortlessly with a system designed to
          streamline staff scheduling.
        </p>
      </section>

      {/* Feature cards */}
      <section className="features-grid">
        <article className="card">
          <h3>Scheduling</h3>
          <p>
            Plan shifts in minutes with intelligent scheduling that respects
            employee availability, roles, and staffing needs.
          </p>
        </article>

        <article className="card">
          <h3>Report</h3>
          <p>
            Access simple coverage and staffing reports so you always know who
            is working and when.
          </p>
        </article>

        <article className="card">
          <h3>Employee Shift Swap Requests</h3>
          <p>
            Employees can submit shift swap requests through a guided workflow,
            keeping changes organized and easy to review.
          </p>
        </article>

        <article className="card">
          <h3>Manager Approval Workflow</h3>
          <p>
            Managers can quickly approve or reject swap requests while
            maintaining full control over coverage.
          </p>
        </article>

        <article className="card">
          <h3>Smart Notifications</h3>
          <p>
            Automatic alerts keep managers and staff informed about new
            schedules, changes, and approvals.
          </p>
        </article>

        <article className="card">
          <h3>Manager Dashboard</h3>
          <p>
            A clear dashboard lets managers monitor total hours, coverage, and
            upcoming shifts at a glance.
          </p>
        </article>
      </section>

      {/* Pricing */}
      <section className="pricing" id="pricing">
        <div className="billing-toggle">
          <button className="active">Monthly</button>
          <button>Yearly</button>
          <button>Link</button>
        </div>

        <div className="pricing-card">
          <div className="price">
            <span className="price-amount">$5</span>
            <span className="price-period">/mo</span>
          </div>

          <ul className="price-features">
            <li>Employee scheduling</li>
            <li>Shift swap requests</li>
            <li>Schedule change notifications</li>
            <li>Manager dashboard</li>
          </ul>

          <button
            className="btn btn-primary price-cta"
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>
      </section>

      {/* About */}
      <section className="about" id="about">
        <h2>About ShiftUp</h2>

        <p>
          At ShiftUp, we believe in empowering businesses with smarter, more
          efficient ways to manage their workforce.
        </p>

        <p>
          With ShiftUp, businesses can create and publish schedules in minutes,
          employees can view their shifts in real-time, and managers can
          communicate effectively.
        </p>
      </section>

    </div>
  );
};

export default Home;
