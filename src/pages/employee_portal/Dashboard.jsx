import React from "react";
import "./Dashboard.css";
import logo from "../../assets/up-text-icon.jpg";
import { CalendarDays, Bell, LogOut } from "lucide-react";

const shifts = [
  { day: "Mon", date: "Dec 9", role: "Waitstaff", time: "9:00 AM - 5:00 PM" },
  { day: "Tue", date: "Dec 10", role: "Waitstaff", time: "9:00 AM - 5:00 PM" },
  { day: "Wed", date: "Dec 11", role: "Host", time: "12:00 PM - 8:00 PM" },
  { day: "Thu", date: "Dec 12", role: "Server", time: "9:00 AM - 5:00 PM" },
  { day: "Fri", date: "Dec 13", role: "Bartender", time: "4:00 PM - 11:00 PM" },
];

export default function Dashboard({ user, onLogout }) {
  return (
    <div className="dashboard">
      {/* HEADER */}
      <header className="dashboard-header">
        <section className="title-section">
          <div className="logo"><img src={logo} alt="Logo" /></div>
          <div className="title">SHIFT‑UP</div>
        </section>

        <div className="header-actions">
          <button className="nav-btn active">Schedule</button>
          <button className="nav-btn">Shift Swap</button>
          <button className="nav-btn">Availability</button>
          <Bell size={20} />
          <LogOut size={20} onClick={onLogout} style={{ cursor: "pointer" }} />
        </div>
      </header>

      {/* CONTENT */}
      <div className="dashboard-content">
        {/* SIDEBAR */}
        <aside className="sidebar">
          <h3>My Profile</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Role:</strong> {user?.role}</p>

          <div className="calendar-box">
            <h4>December 2024</h4>
            <div className="calendar-grid">
              {[...Array(31)].map((_, i) => (
                <div
                  key={i}
                  className={`calendar-day ${i + 1 === 10 ? "active-day" : ""}`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          </div>
        </aside>

        {/* MAIN SCHEDULE */}
        <main className="schedule">
          <h2>Week View</h2>

          <div className="shift-grid">
            {shifts.map((shift, index) => (
              <div key={index} className="shift-card">
                <div className="shift-top">
                  <span className="shift-day">{shift.day}</span>
                  <span className="shift-date">{shift.date}</span>
                </div>

                <h4>{shift.role}</h4>
                <p>{shift.time}</p>

                <button className="details-btn">View Details</button>
              </div>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
