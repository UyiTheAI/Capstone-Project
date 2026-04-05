require("dotenv").config();
const mongoose     = require("mongoose");
const connectDB    = require("./config/db");
const User         = require("./models/User");
const Shift        = require("./models/Shift");
const SwapRequest  = require("./models/SwapRequest");
const Notification = require("./models/Notification");
const Attendance   = require("./models/Attendance");

const seed = async () => {
  await connectDB();
  console.log("🌱 Seeding database...");

  await Promise.all([
    User.deleteMany(), Shift.deleteMany(),
    SwapRequest.deleteMany(), Notification.deleteMany(), Attendance.deleteMany(),
  ]);
  console.log("🗑  Cleared existing data");

  // ── Users ──────────────────────────────────────────────────────────────────
  const users = await User.create([
    { firstName:"Maria",  lastName:"Garcia",   email:"maria@shiftup.com",   password:"password123", role:"employee", position:"Waitstaff",     availability:"Full-Time",  noShows:0, coveragePercent:95 },
    { firstName:"Kevin",  lastName:"Chen",     email:"kevin@shiftup.com",   password:"password123", role:"employee", position:"Dishwasher",    availability:"Full-Time",  noShows:5, coveragePercent:85 },
    { firstName:"Sarah",  lastName:"Thompson", email:"sarah@shiftup.com",   password:"password123", role:"employee", position:"Kitchen Staff", availability:"Part-Time",  noShows:6, coveragePercent:50 },
    { firstName:"John",   lastName:"Miller",   email:"john@shiftup.com",    password:"password123", role:"employee", position:"Bartender",     availability:"Full-Time",  noShows:0, coveragePercent:95 },
    { firstName:"Terry",  lastName:"Young",    email:"terry@shiftup.com",   password:"password123", role:"employee", position:"Dishwasher",    availability:"Full-Time",  noShows:2, coveragePercent:90 },
    { firstName:"Lisa",   lastName:"Wong",     email:"lisa@shiftup.com",    password:"password123", role:"employee", position:"Host",           availability:"Part-Time",  noShows:1, coveragePercent:92 },
    { firstName:"Carlos", lastName:"Reyes",    email:"carlos@shiftup.com",  password:"password123", role:"employee", position:"Cook",           availability:"Full-Time",  noShows:3, coveragePercent:88 },
    { firstName:"Alex",   lastName:"Johnson",  email:"manager@shiftup.com", password:"password123", role:"manager",  position:"Floor Manager", availability:"Full-Time",  noShows:0, coveragePercent:100 },
    { firstName:"Sam",    lastName:"Owner",    email:"owner@shiftup.com",   password:"password123", role:"owner",    position:"Owner",          availability:"Full-Time",  subscriptionStatus:"active", subscriptionPlan:"pro" },
  ]);

  const employees = users.filter(u => u.role === "employee");
  const manager   = users.find(u => u.role === "manager");
  const owner     = users.find(u => u.role === "owner");

  console.log(`✅ Created ${users.length} users`);

  // ── Shifts ─────────────────────────────────────────────────────────────────
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const timeSlots = [
    { startTime:"09:00", endTime:"17:00", area:"Front of House" },
    { startTime:"11:00", endTime:"19:00", area:"Kitchen"        },
    { startTime:"14:00", endTime:"22:00", area:"Bar"            },
    { startTime:"08:00", endTime:"16:00", area:"Back of House"  },
  ];

  const shiftData = [];

  // Current week
  employees.forEach((emp, ei) => {
    [0,1,2,3,4].forEach(dayOffset => {
      const d    = new Date(monday);
      d.setDate(monday.getDate() + dayOffset);
      const slot = timeSlots[ei % timeSlots.length];
      shiftData.push({
        employee:  emp._id,
        date:      new Date(d),
        startTime: slot.startTime,
        endTime:   slot.endTime,
        timeLabel: `${slot.startTime}-${slot.endTime}`,
        role:      emp.position || "Waitstaff",
        area:      slot.area,
        status:    "scheduled",
        isDraft:   false,
        createdBy: manager._id,
      });
    });
  });

  // Previous week
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);
  employees.slice(0, 4).forEach((emp, ei) => {
    [0,1,2,3,4].forEach(dayOffset => {
      const d    = new Date(prevMonday);
      d.setDate(prevMonday.getDate() + dayOffset);
      const slot = timeSlots[ei % timeSlots.length];
      shiftData.push({
        employee:  emp._id,
        date:      new Date(d),
        startTime: slot.startTime,
        endTime:   slot.endTime,
        timeLabel: `${slot.startTime}-${slot.endTime}`,
        role:      emp.position || "Waitstaff",
        area:      slot.area,
        status:    "scheduled",
        isDraft:   false,
        createdBy: manager._id,
      });
    });
  });

  const shifts = await Shift.create(shiftData);
  console.log(`✅ Created ${shifts.length} shifts`);

  // ── Swap Requests ──────────────────────────────────────────────────────────
  const swaps = await SwapRequest.create([
    { requester:employees[0]._id, requested:employees[1]._id, shift:shifts[0]._id, reason:"Family event",       status:"pending"  },
    { requester:employees[2]._id, requested:employees[3]._id, shift:shifts[5]._id, reason:"Doctor appointment", status:"approved" },
    { requester:employees[1]._id, requested:employees[4]._id, shift:shifts[10]._id,reason:"Personal",           status:"pending"  },
  ]);
  console.log(`✅ Created ${swaps.length} swap requests`);

  // ── Notifications ──────────────────────────────────────────────────────────
  const notifData = [];
  employees.forEach(emp => {
    notifData.push({ user:emp._id, type:"shift_published", message:"Your schedule for this week has been published", read:false });
  });
  notifData.push(
    { user:employees[0]._id, type:"swap_approved",  message:"Your shift swap has been approved", read:false },
    { user:employees[1]._id, type:"swap_requested", message:"Maria wants to swap a shift with you", read:false },
    { user:manager._id,      type:"swap_pending",   message:"New shift swap needs approval", read:false },
    { user:owner._id,        type:"system",         message:"Welcome to SHIFT-UP! Your trial is active.", read:false },
  );
  const notifs = await Notification.create(notifData);
  console.log(`✅ Created ${notifs.length} notifications`);

  // ── Attendance ─────────────────────────────────────────────────────────────
  const attendanceData = [];
  employees.slice(0, 5).forEach(emp => {
    for (let i = 1; i <= 5; i++) {
      const d = new Date(monday);
      d.setDate(monday.getDate() - i);
      attendanceData.push({ employee:emp._id, date:d, clockIn:"09:05", clockOut:"17:10", hoursWorked:8.1, status:"present" });
    }
  });
  const attendance = await Attendance.create(attendanceData);
  console.log(`✅ Created ${attendance.length} attendance records`);

  console.log("\n🎉 Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Owner:    owner@shiftup.com    / password123");
  console.log("  Manager:  manager@shiftup.com  / password123");
  console.log("  Employee: maria@shiftup.com    / password123");
  process.exit(0);
};

seed().catch(err => { console.error("❌ Seed failed:", err); process.exit(1); });