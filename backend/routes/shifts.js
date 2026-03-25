const express = require("express");
const router = express.Router();
const Shift = require("../models/Shift");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// ── GET /api/shifts  – Get all shifts (manager/owner) or own shifts (employee)
router.get("/", protect, async (req, res) => {
  try {
    let query = {};

    if (req.user.role === "employee") {
      query.employee = req.user._id;
    }

    // Optional date range filters
    if (req.query.from) query.date = { ...query.date, $gte: new Date(req.query.from) };
    if (req.query.to)   query.date = { ...query.date, $lte: new Date(req.query.to) };
    if (req.query.date) query.date = new Date(req.query.date);

    const shifts = await Shift.find(query)
      .populate("employee", "firstName lastName name position")
      .populate("createdBy", "firstName lastName")
      .sort({ date: 1 });

    // Format for FullCalendar
    const events = shifts.map((s) => ({
      id: s._id,
      title: `${s.employee?.name || "Unassigned"} – ${s.role}`,
      start: `${s.date.toISOString().split("T")[0]}T${s.startTime}`,
      end: `${s.date.toISOString().split("T")[0]}T${s.endTime}`,
      backgroundColor: roleColor(s.role),
      extendedProps: {
        employee: s.employee,
        role: s.role,
        area: s.area,
        status: s.status,
        timeLabel: s.timeLabel,
        isDraft: s.isDraft,
      },
    }));

    res.json({ success: true, count: shifts.length, events, shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/shifts/week – Get shifts for a specific week
router.get("/week", protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end) {
      return res.status(400).json({ success: false, message: "start and end dates required" });
    }

    let query = {
      date: { $gte: new Date(start), $lte: new Date(end) },
    };

    if (req.user.role === "employee") {
      query.employee = req.user._id;
    }

    const shifts = await Shift.find(query)
      .populate("employee", "firstName lastName name position")
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/shifts/today – Today's coverage
router.get("/today", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 1);

    const shifts = await Shift.find({
      date: { $gte: today, $lt: tomorrow },
    }).populate("employee", "firstName lastName name position");

    res.json({ success: true, shifts });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/shifts – Create a shift (manager/owner)
router.post("/", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const { employeeId, date, startTime, endTime, timeLabel, role, area, isDraft } = req.body;

    const shift = await Shift.create({
      employee: employeeId,
      date,
      startTime,
      endTime,
      timeLabel,
      role,
      area,
      isDraft: isDraft || false,
      createdBy: req.user._id,
    });

    await shift.populate("employee", "firstName lastName name");

    res.status(201).json({ success: true, shift });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/shifts/:id – Update a shift
router.put("/:id", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    }).populate("employee", "firstName lastName name");

    if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });

    res.json({ success: true, shift });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/shifts/:id – Delete a shift
router.delete("/:id", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });
    res.json({ success: true, message: "Shift deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/shifts/publish – Publish all draft shifts & notify employees
router.post("/publish", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.body;

    const drafts = await Shift.find({
      isDraft: true,
      date: { $gte: new Date(weekStart), $lte: new Date(weekEnd) },
    }).populate("employee", "_id firstName lastName name");

    if (drafts.length === 0) {
      return res.status(400).json({ success: false, message: "No draft shifts to publish" });
    }

    // Mark as published
    await Shift.updateMany(
      { isDraft: true, date: { $gte: new Date(weekStart), $lte: new Date(weekEnd) } },
      { isDraft: false, publishedAt: new Date() }
    );

    // Create notifications for each employee with shifts
    const employeeIds = [...new Set(drafts.map((s) => s.employee._id.toString()))];
    const notifications = employeeIds.map((empId) => ({
      recipient: empId,
      type: "SCHEDULE_PUBLISHED",
      title: "New Schedule Published",
      message: `New schedule published for week of ${weekStart} – ${weekEnd}`,
    }));

    await Notification.insertMany(notifications);

    res.json({ success: true, message: `Published ${drafts.length} shifts and notified ${employeeIds.length} employees` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Helper: role → color for calendar ────────────────────────────────────
function roleColor(role) {
  const map = {
    Waitstaff: "#4f46e5",
    Dishwasher: "#0891b2",
    "Kitchen Staff": "#16a34a",
    Bartender: "#dc2626",
    Front: "#d97706",
    Manager: "#7c3aed",
  };
  return map[role] || "#6b7280";
}

module.exports = router;