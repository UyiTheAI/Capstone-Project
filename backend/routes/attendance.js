const express     = require("express");
const router      = express.Router();
const Attendance  = require("../models/Attendance");
const Shift       = require("../models/Shift");
const User        = require("../models/User");
const SwapRequest = require("../models/SwapRequest");
const { protect, authorize } = require("../middleware/auth");
const { getMyEmployeeIds } = require("../utils/getMyEmployees");

// ── GET /api/attendance ───────────────────────────────────────────────────
router.get("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    const query  = { employee:{ $in:empIds } };
    if (req.query.from) query.date = { ...query.date, $gte:new Date(req.query.from) };
    if (req.query.to)   query.date = { ...query.date, $lte:new Date(new Date(req.query.to).setHours(23,59,59,999)) };

    const records = await Attendance.find(query)
      .populate("employee","firstName lastName name position")
      .populate("shift","startTime endTime role area")
      .sort({ date:-1 });
    res.json({ success:true, records });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── GET /api/attendance/summary ───────────────────────────────────────────
router.get("/summary", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const empIds   = await getMyEmployeeIds(req.user._id, req.user.role);
    const employees= await User.find({ _id:{ $in:empIds } })
      .select("firstName lastName position availability noShows coveragePercent lastAttendance");

    const summaries = await Promise.all(employees.map(async (emp) => {
      const [recs, totalShifts, swapCount] = await Promise.all([
        Attendance.find({ employee:emp._id }).sort({ date:-1 }),
        Shift.countDocuments({ employee:emp._id }),
        SwapRequest.countDocuments({ requester:emp._id }),
      ]);
      const present  = recs.filter(r => r.status==="present").length;
      const noShows  = recs.filter(r => r.status==="no-show" || r.status==="absent").length;
      const late     = recs.filter(r => r.status==="late").length;
      const totalHrs = recs.reduce((a,r) => a+(r.hoursWorked||0), 0);
      const coverage = recs.length>0 ? Math.round((present/recs.length)*100) : 100;
      return {
        _id:emp._id, firstName:emp.firstName, lastName:emp.lastName,
        name:`${emp.firstName} ${emp.lastName}`,
        position:emp.position, availability:emp.availability,
        totalShifts, totalAttendance:recs.length,
        present, noShows, late,
        totalHours: Math.round(totalHrs*10)/10,
        coveragePercent: coverage,
        totalSwapRequests: swapCount,
        lastAttendance: recs[0]?.date || emp.lastAttendance || null,
        recentRecords: recs.slice(0,5),
      };
    }));
    res.json({ success:true, summaries });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── GET /api/attendance/report ────────────────────────────────────────────
// Returns ALL org employees with their stats for the given date range.
// If no attendance records exist for an employee they still appear with zeros.
router.get("/report", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to)
      return res.status(400).json({ success:false, message:"from and to dates required" });

    const dateFrom = new Date(from);
    const dateTo   = new Date(new Date(to).setHours(23,59,59,999));

    // Get ALL employees in org using the helper
    const empIds   = await getMyEmployeeIds(req.user._id, req.user.role);

    if (!empIds.length) {
      return res.json({ success:true, report:[], totals:{ hours:0, cost:0, noShows:0 }, from, to });
    }

    const employees = await User.find({ _id:{ $in:empIds } })
      .select("firstName lastName position");

    // Get all attendance records in range for all org employees in one query
    const allRecords = await Attendance.find({
      employee: { $in:empIds },
      date:     { $gte:dateFrom, $lte:dateTo },
    });

    // Get all swap counts in one query
    const swapCounts = await SwapRequest.aggregate([
      { $match: { requester:{ $in:empIds } } },
      { $group: { _id:"$requester", count:{ $sum:1 } } },
    ]);
    const swapMap = {};
    swapCounts.forEach(s => { swapMap[s._id.toString()] = s.count; });

    const report = employees.map(emp => {
      const empIdStr = emp._id.toString();
      const recs     = allRecords.filter(r => r.employee.toString() === empIdStr);
      const hours    = Math.round(recs.reduce((a,r)=>a+(r.hoursWorked||0),0) * 10) / 10;
      const noShows  = recs.filter(r=>r.status==="no-show"||r.status==="absent").length;
      return {
        employee:    { _id:emp._id, name:`${emp.firstName} ${emp.lastName}`, position:emp.position||"" },
        shifts:      recs.length,
        hours,
        cost:        Math.round(hours * 15),   // $15/hr estimate
        noShows,
        swapRequests: swapMap[empIdStr] || 0,
      };
    });

    const totals = {
      hours:   Math.round(report.reduce((a,r)=>a+r.hours,0) * 10) / 10,
      cost:    report.reduce((a,r)=>a+r.cost,0),
      noShows: report.reduce((a,r)=>a+r.noShows,0),
    };

    res.json({ success:true, report, totals, from, to });
  } catch (err) {
    console.error("Attendance report error:", err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ── POST /api/attendance ──────────────────────────────────────────────────
router.post("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { employeeId, shiftId, date, status, clockIn, clockOut, notes } = req.body;
    if (!employeeId || !shiftId || !date)
      return res.status(400).json({ success:false, message:"employeeId, shiftId, date required" });

    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    const inOrg  = empIds.map(id=>id.toString()).includes(employeeId.toString());
    if (!inOrg) return res.status(403).json({ success:false, message:"Employee not in your org" });

    const calcHours = (ci, co) => {
      if (!ci || !co) return 0;
      const [sh,sm] = ci.split(":").map(Number);
      let   [eh,em] = co.split(":").map(Number);
      if (eh < sh) eh += 24;
      return Math.round(((eh*60+em)-(sh*60+sm))/60 * 10) / 10;
    };

    const isAbsent    = status==="no-show" || status==="absent";
    const hoursWorked = isAbsent ? 0 : (clockIn && clockOut ? calcHours(clockIn, clockOut) : 8);

    const record = await Attendance.findOneAndUpdate(
      { employee:employeeId, shift:shiftId },
      { employee:employeeId, shift:shiftId, date:new Date(date),
        status:status||"present",
        clockIn:  isAbsent ? null : (clockIn||null),
        clockOut: isAbsent ? null : (clockOut||null),
        hoursWorked, notes:notes||"" },
      { upsert:true, new:true }
    ).populate("employee","firstName lastName")
     .populate("shift","startTime endTime role");

    // Recalculate employee stats
    const allRecs  = await Attendance.find({ employee:employeeId });
    const noShows  = allRecs.filter(r=>r.status==="no-show"||r.status==="absent").length;
    const present  = allRecs.filter(r=>r.status==="present").length;
    const coverage = allRecs.length>0 ? Math.round((present/allRecs.length)*100) : 100;
    await User.findByIdAndUpdate(employeeId, { noShows, coveragePercent:coverage, lastAttendance:new Date(date) });

    res.json({ success:true, record });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── PUT /api/attendance/:id ───────────────────────────────────────────────
router.put("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { status, clockIn, clockOut, notes } = req.body;
    const calcHours = (ci, co) => {
      if (!ci || !co) return 0;
      const [sh,sm] = ci.split(":").map(Number);
      let   [eh,em] = co.split(":").map(Number);
      if (eh < sh) eh += 24;
      return Math.round(((eh*60+em)-(sh*60+sm))/60 * 10) / 10;
    };
    const isAbsent    = status==="no-show" || status==="absent";
    const hoursWorked = !isAbsent && clockIn && clockOut ? calcHours(clockIn, clockOut) : 0;

    const record = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status, clockIn:isAbsent?null:clockIn, clockOut:isAbsent?null:clockOut, hoursWorked, notes },
      { new:true }
    ).populate("employee","firstName lastName")
     .populate("shift","startTime endTime role");

    if (!record) return res.status(404).json({ success:false, message:"Record not found" });

    const allRecs  = await Attendance.find({ employee:record.employee._id });
    const noShows  = allRecs.filter(r=>r.status==="no-show"||r.status==="absent").length;
    const present  = allRecs.filter(r=>r.status==="present").length;
    const coverage = allRecs.length>0 ? Math.round((present/allRecs.length)*100) : 100;
    await User.findByIdAndUpdate(record.employee._id, { noShows, coveragePercent:coverage });

    res.json({ success:true, record });
  } catch (err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;