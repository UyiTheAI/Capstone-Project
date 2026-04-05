require("dotenv").config();
const mongoose     = require("mongoose");
const connectDB    = require("./config/db");
const User         = require("./models/User");
const Shift        = require("./models/Shift");
const SwapRequest  = require("./models/SwapRequest");
const Notification = require("./models/Notification");
const Attendance   = require("./models/Attendance");

const isoDate = (d) => new Date(d).toISOString().split("T")[0];

const seed = async () => {
  await connectDB();
  console.log("🌱 Seeding database...");

  await Promise.all([
    User.deleteMany(), Shift.deleteMany(),
    SwapRequest.deleteMany(), Notification.deleteMany(), Attendance.deleteMany(),
  ]);
  console.log("🗑  Cleared existing data");

  // ── USERS ───────────────────────────────────────────────────────────────────
  // Owner — standalone, no createdBy
  const owner = await User.create({
    firstName: "Sam",   lastName: "Owner",
    email: "owner@shiftup.com", password: "password123",
    role: "owner", position: "Owner", availability: "Full-Time",
    subscriptionStatus: "active", subscriptionPlan: "pro",
  });

  // Manager — created BY owner, orgOwner = owner
  const manager = await User.create({
    firstName: "Alex",  lastName: "Johnson",
    email: "manager@shiftup.com", password: "password123",
    role: "manager", position: "Floor Manager", availability: "Full-Time",
    createdBy: owner._id, orgOwner: owner._id,
  });

  // Employees — Maria created by OWNER, Kevin created by MANAGER
  const maria = await User.create({
    firstName: "Maria", lastName: "Garcia",
    email: "maria@shiftup.com", password: "password123",
    role: "employee", position: "Waitstaff", availability: "Full-Time",
    createdBy: owner._id, orgOwner: owner._id,
  });

  const kevin = await User.create({
    firstName: "Kevin", lastName: "Chen",
    email: "kevin@shiftup.com", password: "password123",
    role: "employee", position: "Cook", availability: "Part-Time",
    createdBy: manager._id, orgOwner: owner._id,
  });

  const employees = [maria, kevin];
  console.log(`✅ Created 4 users`);
  console.log(`   owner@shiftup.com → registered: manager, maria`);
  console.log(`   manager@shiftup.com → registered: kevin`);

  // ── SHIFTS ──────────────────────────────────────────────────────────────────
  const today  = new Date(); today.setHours(0,0,0,0);
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay()+6) % 7));
  const prevMonday = new Date(monday);
  prevMonday.setDate(monday.getDate() - 7);

  // Current week — manager creates shifts for kevin (his employee)
  const currentShiftData = [0,1,2,3,4].map(day => {
    const d = new Date(monday); d.setDate(monday.getDate() + day);
    return {
      employee: kevin._id, date: new Date(d),
      startTime: "14:00", endTime: "22:00", timeLabel: "2PM-10PM",
      role: "Cook", area: "Kitchen", status: "scheduled",
      isDraft: false, createdBy: manager._id,
    };
  });

  // Owner also creates shifts for maria (her employee)
  const mariaShiftData = [0,1,2,3,4].map(day => {
    const d = new Date(monday); d.setDate(monday.getDate() + day);
    return {
      employee: maria._id, date: new Date(d),
      startTime: "09:00", endTime: "17:00", timeLabel: "9AM-5PM",
      role: "Waitstaff", area: "Front", status: "scheduled",
      isDraft: false, createdBy: owner._id,
    };
  });

  // Previous week shifts — for attendance records
  const pastShiftData = [];
  employees.forEach((emp, ei) => {
    [0,1,2,3,4].forEach(day => {
      const d = new Date(prevMonday); d.setDate(prevMonday.getDate() + day);
      pastShiftData.push({
        employee: emp._id, date: new Date(d),
        startTime: ei===0 ? "09:00":"14:00", endTime: ei===0 ? "17:00":"22:00",
        timeLabel: ei===0 ? "9AM-5PM":"2PM-10PM",
        role: emp.position, area: ei===0 ? "Front":"Kitchen",
        status: "scheduled", isDraft: false,
        createdBy: ei===0 ? owner._id : manager._id,
      });
    });
  });

  const [currentShifts, mariaShifts, pastShifts] = await Promise.all([
    Shift.create(currentShiftData),
    Shift.create(mariaShiftData),
    Shift.create(pastShiftData),
  ]);
  const allCurrentShifts = [...currentShifts, ...mariaShifts];
  console.log(`✅ Created ${allCurrentShifts.length + pastShifts.length} shifts`);

  // ── ATTENDANCE (past week) ──────────────────────────────────────────────────
  const patterns = [
    ["present","present","present","late","present"],    // maria
    ["present","present","no-show","present","present"], // kevin
  ];
  const attendanceData = [];
  employees.forEach((emp, ei) => {
    const empPast = pastShifts.filter(s => s.employee.toString() === emp._id.toString());
    empPast.forEach((shift, di) => {
      const status   = patterns[ei % patterns.length][di];
      const isAbsent = status === "no-show" || status === "absent";
      const clockIn  = isAbsent ? null : (status==="late" ? "10:12" : shift.startTime);
      const clockOut = isAbsent ? null : shift.endTime;
      let hoursWorked = 0;
      if (clockIn && clockOut) {
        const [sh,sm] = clockIn.split(":").map(Number);
        let   [eh,em] = clockOut.split(":").map(Number);
        if (eh < sh) eh += 24;
        hoursWorked = Math.round(((eh*60+em)-(sh*60+sm))/60*10)/10;
      }
      attendanceData.push({ employee: emp._id, shift: shift._id, date: shift.date, status, clockIn, clockOut, hoursWorked });
    });
  });
  await Attendance.create(attendanceData);
  // Update noShows on User
  for (const emp of employees) {
    const noShows = attendanceData.filter(a => a.employee.toString()===emp._id.toString() && a.status==="no-show").length;
    await User.findByIdAndUpdate(emp._id, { noShows });
  }
  console.log(`✅ Created ${attendanceData.length} attendance records`);

  // ── SWAP REQUEST ─────────────────────────────────────────────────────────────
  await SwapRequest.create([{
    requester:        maria._id,
    proposedEmployee: kevin._id,
    shift:            allCurrentShifts[0]._id,
    shiftDate:        isoDate(allCurrentShifts[0].date),
    shiftTime:        `${allCurrentShifts[0].startTime} - ${allCurrentShifts[0].endTime}`,
    shiftRole:        allCurrentShifts[0].role,
    reason:           "Family event",
    status:           "pending",
  }]);
  console.log("✅ Created 1 swap request");

  // ── NOTIFICATIONS ─────────────────────────────────────────────────────────────
  await Notification.create([
    { recipient:maria._id,   type:"SCHEDULE_PUBLISHED", title:"Schedule Published", message:"Your schedule for this week has been published", read:false },
    { recipient:kevin._id,   type:"SCHEDULE_PUBLISHED", title:"Schedule Published", message:"Your schedule for this week has been published", read:false },
    { recipient:manager._id, type:"SWAP_REQUEST",       title:"New Swap Request",   message:"Maria Garcia wants to swap a shift",           read:false },
    { recipient:owner._id,   type:"SHIFT_ALERT",        title:"Welcome!",           message:"Welcome to SHIFT-UP! Your trial is active.",   read:false },
  ]);
  console.log("✅ Created 4 notifications");

  console.log("\n🎉 Seed complete!\n");
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║           DEMO CREDENTIALS                       ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log("║ Owner:    owner@shiftup.com    / password123     ║");
  console.log("║   └─ registered: manager, maria                  ║");
  console.log("║ Manager:  manager@shiftup.com  / password123     ║");
  console.log("║   └─ registered: kevin                           ║");
  console.log("║ Employee: maria@shiftup.com    / password123     ║");
  console.log("║ Employee: kevin@shiftup.com    / password123     ║");
  console.log("╚══════════════════════════════════════════════════╝\n");

  process.exit(0);
};

seed().catch(err => { console.error("❌ Seed failed:", err.message); process.exit(1); });