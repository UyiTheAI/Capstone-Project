const express      = require("express");
const router       = express.Router();
const Shift        = require("../models/Shift");
const Notification = require("../models/Notification");
const User         = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const { getMyEmployeeIds } = require("../utils/getMyEmployees");

// ── GET /api/shifts/week ──────────────────────────────────────────────────
// Employee: own shifts only
// Manager/Owner: shifts for employees in their org only
router.get("/week", protect, async (req, res) => {
  try {
    const { start, end } = req.query;
    if (!start || !end)
      return res.status(400).json({ success: false, message: "start and end dates required" });

    const dateQuery = { $gte: new Date(start), $lte: new Date(new Date(end).setHours(23,59,59,999)) };

    if (req.user.role === "employee") {
      const shifts = await Shift.find({ employee: req.user._id, date: dateQuery })
        .populate("employee", "firstName lastName name position")
        .sort({ date: 1, startTime: 1 });
      return res.json({ success: true, shifts });
    }

    // Manager/Owner — only their org's employees
    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    const shifts = await Shift.find({ employee: { $in: empIds }, date: dateQuery })
      .populate("employee", "firstName lastName name position")
      .sort({ date: 1, startTime: 1 });

    res.json({ success: true, shifts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/shifts/today ─────────────────────────────────────────────────
router.get("/today", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
    const empIds   = await getMyEmployeeIds(req.user._id, req.user.role);
    const shifts   = await Shift.find({ employee: { $in: empIds }, date: { $gte: today, $lt: tomorrow } })
      .populate("employee", "firstName lastName name position");
    res.json({ success: true, shifts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── GET /api/shifts ───────────────────────────────────────────────────────
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "employee") {
      query.employee = req.user._id;
    } else {
      const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
      query.employee = { $in: empIds };
    }
    if (req.query.from) query.date = { ...query.date, $gte: new Date(req.query.from) };
    if (req.query.to)   query.date = { ...query.date, $lte: new Date(req.query.to) };

    const shifts = await Shift.find(query)
      .populate("employee", "firstName lastName name position")
      .sort({ date: 1 });

    res.json({ success: true, count: shifts.length, shifts });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/shifts ──────────────────────────────────────────────────────
router.post("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { employeeId, date, startTime, endTime, timeLabel, role, area, isDraft } = req.body;
    if (!employeeId || !date || !startTime || !endTime)
      return res.status(400).json({ success: false, message: "employeeId, date, startTime, endTime required" });

    // Verify the employee belongs to this manager/owner's org
    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    const belongs = empIds.map(id => id.toString()).includes(employeeId.toString());
    if (!belongs)
      return res.status(403).json({ success: false, message: "You can only schedule your own employees" });

    const shift = await Shift.create({
      employee: employeeId, date, startTime, endTime,
      timeLabel: timeLabel || `${startTime}-${endTime}`,
      role: role || "Waitstaff", area: area || "",
      isDraft: isDraft !== undefined ? isDraft : true,
      createdBy: req.user._id,
    });
    await shift.populate("employee", "firstName lastName name");
    res.status(201).json({ success: true, shift });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── PUT /api/shifts/:id ───────────────────────────────────────────────────
router.put("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const shift = await Shift.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
      .populate("employee", "firstName lastName name");
    if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });
    res.json({ success: true, shift });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── DELETE /api/shifts/:id ────────────────────────────────────────────────
router.delete("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const shift = await Shift.findByIdAndDelete(req.params.id);
    if (!shift) return res.status(404).json({ success: false, message: "Shift not found" });
    res.json({ success: true, message: "Shift deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/shifts/publish ──────────────────────────────────────────────
router.post("/publish", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { weekStart, weekEnd } = req.body;
    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);

    const drafts = await Shift.find({
      isDraft:  true,
      employee: { $in: empIds },
      date:     { $gte: new Date(weekStart), $lte: new Date(weekEnd) },
    }).populate("employee", "_id firstName lastName name");

    if (!drafts.length)
      return res.status(400).json({ success: false, message: "No draft shifts to publish" });

    await Shift.updateMany(
      { isDraft: true, employee: { $in: empIds }, date: { $gte: new Date(weekStart), $lte: new Date(weekEnd) } },
      { isDraft: false, publishedAt: new Date() }
    );

    const employeeIds = [...new Set(drafts.map(s => s.employee._id.toString()))];
    await Notification.insertMany(employeeIds.map(empId => ({
      recipient: empId,
      type:      "SCHEDULE_PUBLISHED",
      title:     "Schedule Published",
      message:   `Your schedule has been published for week of ${weekStart}`,
    })));

    res.json({ success: true, count: drafts.length, message: `Published ${drafts.length} shifts` });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;