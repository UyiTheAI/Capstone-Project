require("dotenv").config();
const mongoose = require("mongoose");
const connectDB = require("./config/db");

const User         = require("./models/User");
const Shift        = require("./models/Shift");
const SwapRequest  = require("./models/SwapRequest");
const Notification = require("./models/Notification");
const Attendance   = require("./models/Attendance");
const Tip          = require("./models/Tip");

// ── Helpers ────────────────────────────────────────────────────────────────
const day = (offset = 0) => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() + offset);
  return d;
};

const seed = async () => {
  await connectDB();
  console.log("🌱 Seeding database...\n");

  try {
    // ── Clear all collections ──────────────────────────────────────────────
    await Promise.all([
      User.deleteMany(),
      Shift.deleteMany(),
      SwapRequest.deleteMany(),
      Notification.deleteMany(),
      Attendance.deleteMany(),
      Tip.deleteMany(),
    ]);
    console.log("🗑  Cleared all existing data");

    // ── Users ──────────────────────────────────────────────────────────────
    const users = await User.create([
      // ── Employees ──────────────────────────────────────────────────────
      {
        firstName: "Maria",  lastName: "Garcia",
        email: "maria@shiftup.com", password: "password123",
        role: "employee", position: "Waitstaff", availability: "Full-Time",
        noShows: 0, coveragePercent: 98,
        lastAttendance: day(-1),
        availabilitySchedule: {
          Mon: { morning: true,  afternoon: true,  evening: false },
          Tue: { morning: true,  afternoon: true,  evening: false },
          Wed: { morning: false, afternoon: true,  evening: true  },
          Thu: { morning: true,  afternoon: true,  evening: false },
          Fri: { morning: true,  afternoon: true,  evening: true  },
          Sat: { morning: false, afternoon: false, evening: true  },
          Sun: { morning: false, afternoon: false, evening: false },
        },
      },
      {
        firstName: "Kevin",  lastName: "Chen",
        email: "kevin@shiftup.com", password: "password123",
        role: "employee", position: "Dishwasher", availability: "Full-Time",
        noShows: 3, coveragePercent: 85,
        lastAttendance: day(-2),
        availabilitySchedule: {
          Mon: { morning: false, afternoon: true,  evening: true  },
          Tue: { morning: false, afternoon: true,  evening: true  },
          Wed: { morning: false, afternoon: true,  evening: true  },
          Thu: { morning: false, afternoon: false, evening: true  },
          Fri: { morning: false, afternoon: true,  evening: true  },
          Sat: { morning: true,  afternoon: true,  evening: true  },
          Sun: { morning: true,  afternoon: true,  evening: false },
        },
      },
      {
        firstName: "Sarah",  lastName: "Thompson",
        email: "sarah@shiftup.com", password: "password123",
        role: "employee", position: "Kitchen Staff", availability: "Part-Time",
        noShows: 5, coveragePercent: 72,
        lastAttendance: day(-3),
        availabilitySchedule: {
          Mon: { morning: true,  afternoon: false, evening: false },
          Tue: { morning: true,  afternoon: true,  evening: false },
          Wed: { morning: false, afternoon: false, evening: false },
          Thu: { morning: true,  afternoon: true,  evening: false },
          Fri: { morning: false, afternoon: false, evening: false },
          Sat: { morning: true,  afternoon: true,  evening: false },
          Sun: { morning: false, afternoon: false, evening: false },
        },
      },
      {
        firstName: "John",   lastName: "Mitchell",
        email: "john@shiftup.com", password: "password123",
        role: "employee", position: "Bartender", availability: "Full-Time",
        noShows: 1, coveragePercent: 92,
        lastAttendance: day(-1),
        availabilitySchedule: {
          Mon: { morning: false, afternoon: true,  evening: true  },
          Tue: { morning: false, afternoon: true,  evening: true  },
          Wed: { morning: false, afternoon: true,  evening: true  },
          Thu: { morning: false, afternoon: true,  evening: true  },
          Fri: { morning: false, afternoon: true,  evening: true  },
          Sat: { morning: true,  afternoon: true,  evening: true  },
          Sun: { morning: false, afternoon: false, evening: true  },
        },
      },
      {
        firstName: "Terry",  lastName: "Young",
        email: "terry@shiftup.com", password: "password123",
        role: "employee", position: "Server", availability: "Full-Time",
        noShows: 1, coveragePercent: 91,
        lastAttendance: day(-1),
        availabilitySchedule: {
          Mon: { morning: true,  afternoon: true,  evening: false },
          Tue: { morning: true,  afternoon: true,  evening: false },
          Wed: { morning: true,  afternoon: true,  evening: true  },
          Thu: { morning: true,  afternoon: true,  evening: false },
          Fri: { morning: true,  afternoon: true,  evening: true  },
          Sat: { morning: false, afternoon: true,  evening: true  },
          Sun: { morning: false, afternoon: false, evening: false },
        },
      },
      {
        firstName: "Priya",  lastName: "Patel",
        email: "priya@shiftup.com", password: "password123",
        role: "employee", position: "Host", availability: "Part-Time",
        noShows: 0, coveragePercent: 100,
        lastAttendance: day(-1),
        availabilitySchedule: {
          Mon: { morning: true,  afternoon: true,  evening: false },
          Tue: { morning: false, afternoon: false, evening: false },
          Wed: { morning: true,  afternoon: true,  evening: false },
          Thu: { morning: false, afternoon: false, evening: false },
          Fri: { morning: true,  afternoon: true,  evening: true  },
          Sat: { morning: true,  afternoon: true,  evening: true  },
          Sun: { morning: true,  afternoon: false, evening: false },
        },
      },
      {
        firstName: "Alex",   lastName: "Rivera",
        email: "alex@shiftup.com", password: "password123",
        role: "employee", position: "Cook", availability: "On-Call",
        noShows: 2, coveragePercent: 80,
        lastAttendance: day(-5),
        availabilitySchedule: {
          Mon: { morning: false, afternoon: false, evening: true  },
          Tue: { morning: false, afternoon: false, evening: true  },
          Wed: { morning: false, afternoon: false, evening: true  },
          Thu: { morning: false, afternoon: false, evening: true  },
          Fri: { morning: false, afternoon: false, evening: true  },
          Sat: { morning: false, afternoon: true,  evening: true  },
          Sun: { morning: false, afternoon: true,  evening: true  },
        },
      },
      // ── Manager ────────────────────────────────────────────────────────
      {
        firstName: "Manager", lastName: "Abel",
        email: "manager@shiftup.com", password: "password123",
        role: "manager", position: "Manager", availability: "Full-Time",
      },
      // ── Owner ──────────────────────────────────────────────────────────
      {
        firstName: "Owner", lastName: "Smith",
        email: "owner@shiftup.com", password: "password123",
        role: "owner", position: "Owner", availability: "Full-Time",
      },
    ]);

    const [maria, kevin, sarah, john, terry, priya, alex, manager, owner] = users;
    console.log(`✅ Created ${users.length} users`);

    // ── Shifts (current week Mon–Sun) ──────────────────────────────────────
    // Find this week's Monday
    const now = new Date();
    const dow = now.getDay(); // 0=Sun
    const diffToMon = dow === 0 ? -6 : 1 - dow;
    const monday = new Date(now);
    monday.setHours(0, 0, 0, 0);
    monday.setDate(now.getDate() + diffToMon);

    const wd = (n) => { const d = new Date(monday); d.setDate(monday.getDate() + n); return d; };

    const shiftData = [
      // ── MONDAY ──
      { employee: maria._id, date: wd(0), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P", role:"Waitstaff",    area:"Front",   status:"scheduled" },
      { employee: kevin._id, date: wd(0), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Dishwasher",  area:"Kitchen", status:"scheduled" },
      { employee: john._id,  date: wd(0), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Bartender",   area:"Bar",     status:"scheduled" },
      { employee: priya._id, date: wd(0), startTime:"09:00", endTime:"15:00", timeLabel:"9A–3P",  role:"Host",        area:"Front",   status:"scheduled" },

      // ── TUESDAY ──
      { employee: terry._id, date: wd(1), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P",  role:"Server",      area:"Front",   status:"scheduled" },
      { employee: sarah._id, date: wd(1), startTime:"11:00", endTime:"19:00", timeLabel:"11A–7P", role:"Kitchen Staff",area:"Kitchen",status:"scheduled" },
      { employee: alex._id,  date: wd(1), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Cook",        area:"Kitchen", status:"scheduled" },

      // ── WEDNESDAY ──
      { employee: maria._id, date: wd(2), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P",  role:"Waitstaff",  area:"Front",   status:"scheduled" },
      { employee: john._id,  date: wd(2), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Bartender",  area:"Bar",     status:"scheduled" },
      { employee: kevin._id, date: wd(2), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P",  role:"Dishwasher", area:"Kitchen", status:"scheduled" },

      // ── THURSDAY ──
      { employee: terry._id, date: wd(3), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P",  role:"Server",     area:"Front",   status:"scheduled" },
      { employee: priya._id, date: wd(3), startTime:"09:00", endTime:"15:00", timeLabel:"9A–3P",  role:"Host",       area:"Front",   status:"scheduled" },
      { employee: sarah._id, date: wd(3), startTime:"11:00", endTime:"19:00", timeLabel:"11A–7P", role:"Kitchen Staff",area:"Kitchen",status:"scheduled" },

      // ── FRIDAY ──
      { employee: maria._id, date: wd(4), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Waitstaff",  area:"Front",   status:"scheduled" },
      { employee: john._id,  date: wd(4), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Bartender",  area:"Bar",     status:"scheduled" },
      { employee: alex._id,  date: wd(4), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Cook",       area:"Kitchen", status:"scheduled" },
      { employee: kevin._id, date: wd(4), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Dishwasher", area:"Kitchen", status:"scheduled" },

      // ── SATURDAY ──
      { employee: terry._id, date: wd(5), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Server",     area:"Front",   status:"scheduled" },
      { employee: priya._id, date: wd(5), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Host",       area:"Front",   status:"scheduled" },
      { employee: john._id,  date: wd(5), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P", role:"Bartender",  area:"Bar",     status:"scheduled" },

      // ── SUNDAY ──
      { employee: alex._id,  date: wd(6), startTime:"12:00", endTime:"20:00", timeLabel:"12P–8P", role:"Cook",       area:"Kitchen", status:"scheduled" },
      { employee: kevin._id, date: wd(6), startTime:"12:00", endTime:"20:00", timeLabel:"12P–8P", role:"Dishwasher", area:"Kitchen", status:"scheduled" },

      // ── PAST WEEK (completed shifts) ──
      { employee: maria._id, date: day(-7), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P", role:"Waitstaff",   area:"Front",   status:"completed" },
      { employee: kevin._id, date: day(-7), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P",role:"Dishwasher",  area:"Kitchen", status:"completed" },
      { employee: john._id,  date: day(-7), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P",role:"Bartender",   area:"Bar",     status:"completed" },
      { employee: sarah._id, date: day(-6), startTime:"11:00", endTime:"19:00", timeLabel:"11A–7P",role:"Kitchen Staff",area:"Kitchen",status:"completed" },
      { employee: terry._id, date: day(-6), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P", role:"Server",      area:"Front",   status:"completed" },
      { employee: maria._id, date: day(-5), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P", role:"Waitstaff",   area:"Front",   status:"completed" },
      { employee: kevin._id, date: day(-4), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P",role:"Dishwasher",  area:"Kitchen", status:"no-show"   },
      { employee: john._id,  date: day(-3), startTime:"17:00", endTime:"23:00", timeLabel:"5P–11P",role:"Bartender",   area:"Bar",     status:"completed" },
      { employee: priya._id, date: day(-2), startTime:"09:00", endTime:"15:00", timeLabel:"9A–3P", role:"Host",        area:"Front",   status:"completed" },
      { employee: terry._id, date: day(-1), startTime:"09:00", endTime:"17:00", timeLabel:"9A–5P", role:"Server",      area:"Front",   status:"completed" },
    ];

    const shifts = await Shift.create(
      shiftData.map((s) => ({ ...s, createdBy: manager._id }))
    );
    console.log(`✅ Created ${shifts.length} shifts`);

    // ── Swap Requests ──────────────────────────────────────────────────────
    const swaps = await SwapRequest.create([
      {
        requester: maria._id, proposedEmployee: terry._id,
        shift: shifts[0]._id,
        shiftDate: wd(0).toDateString(), shiftTime: "9:00 AM – 5:00 PM", shiftRole: "Waitstaff",
        reason: "Doctor appointment on Monday morning",
        coverageNote: "Terry confirmed he can cover",
        status: "pending",
      },
      {
        requester: kevin._id, proposedEmployee: alex._id,
        shift: shifts[1]._id,
        shiftDate: wd(0).toDateString(), shiftTime: "5:00 PM – 11:00 PM", shiftRole: "Dishwasher",
        reason: "Family event I can't miss",
        coverageNote: "Alex is free that evening",
        status: "pending",
      },
      {
        requester: sarah._id, proposedEmployee: priya._id,
        shift: shifts[4]._id,
        shiftDate: wd(1).toDateString(), shiftTime: "11:00 AM – 7:00 PM", shiftRole: "Kitchen Staff",
        reason: "Car repair appointment",
        coverageNote: "",
        status: "approved",
        managerComment: "Approved — please confirm with each other",
        reviewedBy: manager._id,
        reviewedAt: day(-1),
      },
      {
        requester: john._id, proposedEmployee: terry._id,
        shift: shifts[8]._id,
        shiftDate: wd(2).toDateString(), shiftTime: "5:00 PM – 11:00 PM", shiftRole: "Bartender",
        reason: "Concert tickets I bought months ago",
        coverageNote: "Terry already said yes",
        status: "rejected",
        managerComment: "We are already short staffed Wednesday",
        reviewedBy: manager._id,
        reviewedAt: day(-1),
      },
    ]);
    console.log(`✅ Created ${swaps.length} swap requests`);

    // ── Notifications ──────────────────────────────────────────────────────
    await Notification.create([
      // Maria
      {
        recipient: maria._id, type: "SCHEDULE_PUBLISHED",
        title: "New Schedule Published",
        message: `New schedule published for the week of ${wd(0).toDateString()} – ${wd(6).toDateString()}`,
        read: false,
      },
      {
        recipient: maria._id, type: "SWAP_REQUEST",
        title: "Swap Request Sent",
        message: `You requested Terry to cover your Waitstaff shift on ${wd(0).toDateString()}`,
        read: true,
        relatedSwap: swaps[0]._id,
      },
      // Kevin
      {
        recipient: kevin._id, type: "SCHEDULE_PUBLISHED",
        title: "New Schedule Published",
        message: `New schedule published for the week of ${wd(0).toDateString()}`,
        read: false,
      },
      {
        recipient: kevin._id, type: "SWAP_REQUEST",
        title: "Swap Request Sent",
        message: `You requested Alex to cover your Dishwasher shift on ${wd(0).toDateString()}`,
        read: false,
        relatedSwap: swaps[1]._id,
      },
      // Sarah — approved
      {
        recipient: sarah._id, type: "APPROVED",
        title: "Swap Approved ✓",
        message: `Your swap request for ${wd(1).toDateString()} was APPROVED by Manager Abel`,
        read: false,
        relatedSwap: swaps[2]._id,
      },
      // Priya — new shift via swap
      {
        recipient: priya._id, type: "APPROVED",
        title: "You Received a Shift",
        message: `You now have a Kitchen Staff shift on ${wd(1).toDateString()} (swap with Sarah)`,
        read: false,
        relatedSwap: swaps[2]._id,
      },
      // John — rejected
      {
        recipient: john._id, type: "REJECTED",
        title: "Swap Rejected",
        message: `Your swap request for ${wd(2).toDateString()} was rejected. We are short staffed Wednesday.`,
        read: false,
        relatedSwap: swaps[3]._id,
      },
      // Manager — pending swap alerts
      {
        recipient: manager._id, type: "SWAP_REQUEST",
        title: "New Swap Request",
        message: `Maria submitted a swap request for ${wd(0).toDateString()}`,
        read: false,
        relatedSwap: swaps[0]._id,
      },
      {
        recipient: manager._id, type: "SWAP_REQUEST",
        title: "New Swap Request",
        message: `Kevin submitted a swap request for ${wd(0).toDateString()}`,
        read: false,
        relatedSwap: swaps[1]._id,
      },
      // Terry — swap coverage request
      {
        recipient: terry._id, type: "SWAP_REQUEST",
        title: "Coverage Requested",
        message: `Maria is requesting you cover her Waitstaff shift on ${wd(0).toDateString()} (9AM–5PM)`,
        read: false,
        relatedSwap: swaps[0]._id,
      },
    ]);
    console.log(`✅ Created 10 notifications`);

    // ── Attendance records (past 2 weeks) ──────────────────────────────────
    const pastShifts = shifts.slice(-9); // last 9 are past week shifts
    const attendanceRecords = pastShifts.map((s) => ({
      employee:    s.employee,
      shift:       s._id,
      date:        s.date,
      status:      s.status === "no-show" ? "no-show" : "present",
      clockIn:     s.status === "no-show" ? null : s.startTime,
      clockOut:    s.status === "no-show" ? null : s.endTime,
      hoursWorked: s.status === "no-show" ? 0 : (() => {
        const [sh, sm] = s.startTime.split(":").map(Number);
        const [eh, em] = s.endTime.split(":").map(Number);
        let diff = (eh * 60 + em) - (sh * 60 + sm);
        if (diff < 0) diff += 24 * 60;
        return Math.round((diff / 60) * 10) / 10;
      })(),
    }));
    await Attendance.create(attendanceRecords);
    console.log(`✅ Created ${attendanceRecords.length} attendance records`);

    // ── Tips ───────────────────────────────────────────────────────────────
    const frontEmployees = [maria._id, terry._id, john._id, priya._id];
    const allEmployees   = [maria._id, kevin._id, sarah._id, john._id, terry._id, priya._id, alex._id];

    const tipShare = (total, empIds) =>
      empIds.map((id) => ({ employee: id, amount: Math.round((total / empIds.length) * 100) / 100 }));

    await Tip.create([
      {
        date: day(-7), totalAmount: 420, splitMethod: "equal",
        note: "Busy Monday dinner service",
        recordedBy: owner._id,
        distributions: tipShare(420, frontEmployees),
      },
      {
        date: day(-6), totalAmount: 310, splitMethod: "equal",
        note: "Tuesday lunch + dinner",
        recordedBy: owner._id,
        distributions: tipShare(310, [maria._id, terry._id, john._id]),
      },
      {
        date: day(-5), totalAmount: 560, splitMethod: "equal",
        note: "Wednesday — private event",
        recordedBy: owner._id,
        distributions: tipShare(560, frontEmployees),
      },
      {
        date: day(-4), totalAmount: 280, splitMethod: "equal",
        note: "Thursday service",
        recordedBy: owner._id,
        distributions: tipShare(280, [maria._id, terry._id]),
      },
      {
        date: day(-3), totalAmount: 740, splitMethod: "equal",
        note: "Friday night — full house",
        recordedBy: owner._id,
        distributions: tipShare(740, allEmployees),
      },
      {
        date: day(-2), totalAmount: 890, splitMethod: "equal",
        note: "Saturday peak service",
        recordedBy: owner._id,
        distributions: tipShare(890, allEmployees),
      },
      {
        date: day(-1), totalAmount: 380, splitMethod: "equal",
        note: "Sunday brunch",
        recordedBy: owner._id,
        distributions: tipShare(380, [john._id, priya._id, alex._id]),
      },
    ]);
    console.log(`✅ Created 7 tip records`);

    // ── Notify employees about tip distributions ───────────────────────────
    const tipNotifs = [];
    for (const emp of allEmployees) {
      tipNotifs.push({
        recipient: emp, type: "SHIFT_ALERT",
        title: "💰 Tips Distributed",
        message: `Tips from this week have been distributed to your account. Check Tip Manager for details.`,
        read: false,
      });
    }
    await Notification.insertMany(tipNotifs);

    console.log("\n╔══════════════════════════════════════════════════╗");
    console.log("║          🎉  DATABASE SEEDED SUCCESSFULLY          ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log("║  👤 Employees  (7)  · 🗂 Manager  · 👑 Owner      ║");
    console.log(`║  📅 Shifts     ${shifts.length}   · 🔄 Swaps   ${swaps.length}               ║`);
    console.log("║  🔔 Notifs    17   · 📊 Attendance  9            ║");
    console.log("║  💰 Tips       7 records                          ║");
    console.log("╠══════════════════════════════════════════════════╣");
    console.log("║  Demo Login Credentials                           ║");
    console.log("║  Employee : maria@shiftup.com   / password123    ║");
    console.log("║  Manager  : manager@shiftup.com / password123    ║");
    console.log("║  Owner    : owner@shiftup.com   / password123    ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    process.exit(0);
  } catch (err) {
    console.error("❌ Seeding failed:", err.message);
    console.error(err);
    process.exit(1);
  }
};

seed();