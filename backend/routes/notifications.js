const express = require("express");
const router = express.Router();
const Shift = require("../models/Shift");
const SwapRequest = require("../models/SwapRequest");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// ── GET /api/dashboard – Manager dashboard summary
router.get("/", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    // Week start/end (Mon–Sun)
    const monday = new Date(today);
    monday.setDate(today.getDate() - ((today.getDay() + 6) % 7));
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    // Today's coverage
    const todayShifts = await Shift.find({
      date: { $gte: today, $lt: tomorrow },
    }).populate("employee", "firstName lastName name position");

    // Pending swap requests
    const pendingSwaps = await SwapRequest.find({ status: "pending" })
      .populate("requester", "firstName lastName name")
      .populate("proposedEmployee", "firstName lastName name")
      .sort({ createdAt: -1 });

    // Weekly hours
    const weeklyShifts = await Shift.find({
      date: { $gte: monday, $lte: sunday },
      status: { $ne: "no-show" },
    }).populate("employee", "firstName lastName name");

    // Group by employee
    const hourlyRate = 10;
    const hoursMap = {};
    weeklyShifts.forEach((s) => {
      const empId = s.employee?._id?.toString();
      if (!empId) return;
      if (!hoursMap[empId]) hoursMap[empId] = { name: s.employee.name, hours: 0 };
      hoursMap[empId].hours += 8; // default 8h per shift
    });

    const weeklyHours = Object.values(hoursMap).map((e) => ({
      ...e,
      cost: e.hours * hourlyRate,
    }));

    // Shift alerts: unassigned coverage, no-shows
    const alerts = [];
    const noShowShifts = await Shift.find({
      status: "no-show",
      date: { $gte: monday, $lte: sunday },
    }).populate("employee", "name");

    noShowShifts.forEach((s) => {
      alerts.push({ type: "no-show", text: `No-show detected: ${s.employee?.name} on ${s.date.toDateString()}` });
    });

    const employeeCount = await User.countDocuments({ role: "employee", isActive: true });

    res.json({
      success: true,
      todayShifts,
      pendingSwaps,
      weeklyHours,
      alerts,
      stats: {
        employeeCount,
        pendingSwapsCount: pendingSwaps.length,
        todayCoverage: todayShifts.length,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;