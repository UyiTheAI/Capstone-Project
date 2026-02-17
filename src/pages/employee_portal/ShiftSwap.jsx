import React, { useState } from "react";
import "./ShiftSwap.css";
import logo from "../../assets/up-text-icon.jpg";
import { Bell, LogOut } from "lucide-react";

export default function ShiftSwap({ user, onLogout, onBackToSchedule }) {

  const [selectedDate, setSelectedDate] = useState("");
  const [employee, setEmployee] = useState("");
  const [reason, setReason] = useState("");

  const coworkers = [
    "Maria Garcia",
    "Kevin Chen",
    "Sarah Thompson",
    "Jane Thompson"
  ];

  const handleSubmit = () => {
    if (!selectedDate || !employee || !reason) {
      alert("Please complete all fields");
      return;
    }

    alert("Shift swap request submitted!");

    // Redirect back to Schedule
    onBackToSchedule();
  };

  return (
    <div className="dashboard">

      {/* HEADER */}
      <header className="dashboard-header">
        <section className="title-section">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <div className="title">SHIFT-UP</div>
        </section>

        <div className="header-actions">
          <button className="nav-btn" onClick={onBackToSchedule}>
            Schedule
          </button>

          <button className="nav-btn active">
            Shift Swap
          </button>

          <button className="nav-btn">
            Availability
          </button>

          <Bell size={20} />
          <LogOut size={20} onClick={onLogout} style={{ cursor: "pointer" }} />
        </div>
      </header>

      {/* CONTENT */}
      <div className="swap-container">

        {/* LEFT — Select Shift */}
        <div className="swap-section">
          <h3>Selected Shift:</h3>

          <input
            type="date"
            className="date-picker"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
          />
        </div>

        {/* RIGHT — Replacement */}
        <div className="swap-section">
          <h3>Propose Replacement:</h3>

          <div className="employee-list">
            {coworkers.map((name) => (
              <div
                key={name}
                className={`employee-item ${
                  employee === name ? "selected" : ""
                }`}
                onClick={() => setEmployee(name)}
              >
                {name}
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* REASON */}
      <div className="reason-section">
        <h3>Reason for Swap (Required):</h3>

        <textarea
          placeholder="Explain why you need a swap..."
          value={reason}
          onChange={(e) => setReason(e.target.value)}
        />
      </div>

      {/* SUBMIT */}
      <div className="submit-row">
        <button className="submit-btn" onClick={handleSubmit}>
          Submit Request
        </button>
      </div>

    </div>
  );
}
