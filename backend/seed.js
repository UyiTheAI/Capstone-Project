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

  // ── Minimal Users ──────────────────────────────────────────────────────────
  const users = await User.create([
    {
      firstName: "Sam", lastName: "Owner",
      email: "owner@shiftup.com", password: "password123",
      role: "owner", position: "Owner", availability: "Full-Time",
      subscriptionStatus: "active", subscriptionPlan: "pro",
    },
    {
      firstName: "Alex", lastName: "Johnson",
      email: "manager@shiftup.com", password: "password123",
      role: "manager", position: "Floor Manager", availability: "Full-Time",
    },
    {
      firstName: "Maria", lastName: "Garcia",
      email: "maria@shiftup.com", password: "password123",
      role: "employee", position: "Waitstaff", availability: "Full-Time",
    },
    {
      firstName: "Kevin", lastName: "Chen",
      email: "kevin@shiftup.com", password: "password123",
      role: "employee", position: "Cook", availability: "Part-Time",
    },
  ]);

  const owner    = users.find(u => u.role === "owner");
  const manager  = users.find(u => u.role === "manager");
  const employees= users.filter(u => u.role === "employee");

  // Set createdBy — owner created manager and employees
  await User.updateMany(
    { _id: { $in: [manager._id, ...employees.map(e => e._id)] } },
    { createdBy: owner._id }
  );

  console.log(`✅ Created ${users.length} users (1 owner, 1 manager, ${employees.length} employees)`);

  // ── Minimal Shifts (current week only, Mon-Fri) ────────────────────────────
  const today  = new Date();
  const monday = new Date(today);
  monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
  monday.setHours(0, 0, 0, 0);

  const shiftData = [];
  employees.forEach((emp, ei) => {
    [0, 1, 2, 3, 4].forEach(dayOffset => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + dayOffset);
      shiftData.push({
        employee:  emp._id,
        date:      new Date(d),
        startTime: ei === 0 ? "09:00" : "14:00",
        endTime:   ei === 0 ? "17:00" : "22:00",
        timeLabel: ei === 0 ? "9AM-5PM" : "2PM-10PM",
        role:      emp.position || "Waitstaff",
        area:      ei === 0 ? "Front of House" : "Kitchen",
        status:    "scheduled",
        isDraft:   false,
        createdBy: manager._id,
      });
    });
  });

  const shifts = await Shift.create(shiftData);
  console.log(`✅ Created ${shifts.length} shifts (current week)`);

  // ── One swap request ───────────────────────────────────────────────────────
  await SwapRequest.create([{
    requester:        employees[0]._id,
    proposedEmployee: employees[1]._id,
    shift:            shifts[0]._id,
    shiftDate:        shifts[0].date.toISOString().split("T")[0],
    shiftTime:        `${shifts[0].startTime} - ${shifts[0].endTime}`,
    shiftRole:        shifts[0].role,
    reason:           "Family event",
    status:           "pending",
  }]);
  console.log("✅ Created 1 swap request");

  // ── Minimal notifications ──────────────────────────────────────────────────
  await Notification.create([
    { recipient: employees[0]._id, type: "SCHEDULE_PUBLISHED", title: "Schedule Published", message: "Your schedule for this week has been published", read: false },
    { recipient: employees[1]._id, type: "SCHEDULE_PUBLISHED", title: "Schedule Published", message: "Your schedule for this week has been published", read: false },
    { recipient: manager._id,      type: "SWAP_REQUEST",       title: "New Swap Request",  message: "New shift swap request needs your approval",    read: false },
    { recipient: owner._id,        type: "SHIFT_ALERT",        title: "Welcome!",          message: "Welcome to SHIFT-UP! Your 7-day trial is active.", read: false },
  ]);
  console.log("✅ Created 4 notifications");

  console.log("\n🎉 Seed complete!\n");
  console.log("Demo credentials:");
  console.log("  Owner:    owner@shiftup.com    / password123");
  console.log("  Manager:  manager@shiftup.com  / password123");
  console.log("  Employee: maria@shiftup.com    / password123");
  process.exit(0);
};

seed().catch(err => { console.error("❌ Seed failed:", err); process.exit(1); });