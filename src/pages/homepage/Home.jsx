import React from "react";
import "./Home.css";
import heroImage from "../../assets/hero-image.jpg";
import logo from "../../assets/up-text-icon.jpg";


const Home = ({ onGetStarted, onLoginClick }) => {
  return (
    <div className="page">
      {/* Top navigation */}
      <header className="header">
        <section className="title-section">
          <div className="logo"><img src={logo} alt="Logo" /></div>
          <div className="title">SHIFT‑UP</div>
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
          <button className="btn btn-primary hero-cta">
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
          With ShiftUp, experience a seamless flow from scheduling to payday. Manage every shift and hour effortlessly with a system designed to streamline staff scheduling.
        </p>
      </section>

      {/* Feature cards */}
      <section className="features-grid">
        <article className="card">
          <h3>Scheduling</h3>
          <p>
            Plan shifts in minutes with intelligent scheduling that respects employee availability, roles, and staffing needs.
          </p>
        </article>

        <article className="card">
          <h3>Report</h3>
          <p>
            Access simple coverage and staffing reports so you always know who is working and when.
          </p>
        </article>

        <article className="card">
          <h3>A Workflow for Employees to Request Shift Swaps</h3>
          <p>
            Employees can submit shift swap requests through a guided workflow, keeping changes organized and easy to review.
          </p>
        </article>

        <article className="card">
          <h3>A Workflow for Managers to Approve or Reject Swap Requests</h3>
          <p>
            Managers can quickly approve or reject swap requests while maintaining full control over coverage.
          </p>
        </article>

        <article className="card">
          <h3>Notifications for Schedule Changes, Updates, and Swap Approvals</h3>
          <p>
            Automatic alerts keep managers and staff informed about new schedules, changes, and approvals.
          </p>
        </article>

        <article className="card">
          <h3>A Simple Dashboard for Managers to See Coverage and Hours</h3>
          <p>
            A clear dashboard lets managers monitor total hours, coverage, and upcoming shifts at a glance.
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
            <li>Notifications for schedule changes, updates, and swap approvals</li>
            <li>Manager dashboard for coverage and hours</li>
          </ul>
          <button className="btn btn-primary price-cta">
            Get Started
          </button>
        </div>
      </section>

      {/* ABOUT */}
      <section className="about" id="about">
        <h2>About Us - ShiftUp</h2>

        <p>
          At ShiftUp, we believe in empowering businesses with smarter, more
          efficient ways to manage their workforce. Our mission is to simplify
          scheduling, improve team collaboration, and streamline operations.
        </p>

        <p>
          We understand the challenges businesses face when it comes to
          scheduling — from coordinating shifts and tracking availability to
          handling last-minute changes and swaps.
        </p>

        <p>
          With ShiftUp, businesses can create schedules in minutes, employees
          can view shifts in real-time, and managers can communicate
          effectively.
        </p>

        <p>
          Join us in revolutionizing workforce management and take the next
          step toward operational efficiency.
        </p>
      </section>
    </div>
  );
};

export default Home;