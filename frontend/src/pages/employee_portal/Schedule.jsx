import React, { useState, useEffect } from "react";
import api from "../../api";
import "../../App.css";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

export default function Schedule({ user }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchShifts = async () => {
      try {
        const res = await api.get("/shifts");

        const shifts = res.data.shifts || res.data || [];

        const mappedEvents = shifts.map((shift) => {
          const dateOnly = new Date(shift.date)
            .toISOString()
            .split("T")[0];

          return {
            id: shift._id,
            title: `${shift.role}${shift.area ? ` (${shift.area})` : ""}`,
            start: `${dateOnly}T${shift.startTime}`,
            end: `${dateOnly}T${shift.endTime}`
          };
        });

        setEvents(mappedEvents);
      } catch (err) {
        console.error("Failed to load shifts:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchShifts();
  }, []);

  return (
    <div className="su-page">

      {/* PAGE TITLE */}
      <div className="su-title mb-4">MY SCHEDULE</div>

      {/* PROFILE CARD */}
      <div className="su-card mb-4" style={{ maxWidth: 300 }}>
        <div className="su-card-title">My Profile</div>

        <div className="text-sm">
          <strong>Name:</strong>{" "}
          {user?.name || `${user?.firstName} ${user?.lastName}`}
        </div>

        <div className="text-sm mt-2">
          <strong>Role:</strong> {user?.position || user?.role}
        </div>

        <div className="text-sm mt-2">
          <strong>Availability:</strong> {user?.availability}
        </div>

        <div className="text-sm mt-2">
          <strong>Email:</strong> {user?.email}
        </div>
      </div>

      {/* CALENDAR CARD */}
      <div className="su-card">
        <div className="su-card-title">Schedule Calendar</div>

        {loading ? (
          <div style={{ padding: 40 }}>Loading shifts...</div>
        ) : (
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
        )}
      </div>

    </div>
  );
}
