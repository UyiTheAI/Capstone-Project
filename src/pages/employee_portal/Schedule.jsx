import React, { useEffect, useState } from "react";
import "./Schedule.css";
import logo from "../../assets/up-text-icon.jpg";
import { Bell, LogOut } from "lucide-react";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import axios from "axios";

export default function Schedule({ user, onLogout, onShiftSwap }) {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    fetchShifts();
  }, []);

  const fetchShifts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/shifts");
      setEvents(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  return (
    <div className="dashboard">

      <header className="dashboard-header">
        <section className="title-section">
          <div className="logo">
            <img src={logo} alt="Logo" />
          </div>
          <div className="title">SHIFT-UP</div>
        </section>

        <div className="header-actions">
          <button className="nav-btn active">Schedule</button>
          <button className="nav-btn" onClick={onShiftSwap}>Shift Swap</button>
          <button className="nav-btn">Availability</button>
          <Bell size={20} />
          <LogOut size={20} onClick={onLogout} style={{ cursor: "pointer" }} />
        </div>
      </header>

      <div className="dashboard-content">

        <aside className="sidebar">
          <h3>My Profile</h3>
          <p><strong>Name:</strong> {user?.name}</p>
          <p><strong>Role:</strong> {user?.role}</p>
        </aside>

        <main className="schedule">

          <FullCalendar
            plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
            initialView="timeGridWeek"
            headerToolbar={{
              left: "prev,next today",
              center: "title",
              right: "dayGridMonth,timeGridWeek,timeGridDay"
            }}
            events={events}
            height="auto"
          />

        </main>

      </div>
    </div>
  );
}
