const express      = require("express");
const router       = express.Router();
const Shift        = require("../models/Shift");
const SwapRequest  = require("../models/SwapRequest");
const User         = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const { getMyEmployeeIds, getMyOrgUserIds } = require("../utils/getMyEmployees");

// GET /api/dashboard
router.get("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const today    = new Date(); today.setHours(0,0,0,0);
    const tomorrow = new Date(today); tomorrow.setDate(today.getDate()+1);
    const monday   = new Date(today); monday.setDate(today.getDate()-((today.getDay()+6)%7));
    const sunday   = new Date(monday); sunday.setDate(monday.getDate()+6);

    // Get only employees in this user's org
    const empIds    = await getMyEmployeeIds(req.user._id, req.user.role);
    const orgIds    = await getMyOrgUserIds(req.user._id, req.user.role);

    const [todayShifts, pendingSwaps, weeklyShifts] = await Promise.all([
      Shift.find({ employee: { $in: empIds }, date: { $gte: today, $lt: tomorrow } })
        .populate("employee", "firstName lastName name position"),
      SwapRequest.find({ status: "pending", requester: { $in: empIds } })
        .populate("requester", "firstName lastName name")
        .populate("proposedEmployee", "firstName lastName name")
        .sort({ createdAt: -1 }),
      Shift.find({ employee: { $in: empIds }, date: { $gte: monday, $lte: sunday }, status: { $ne: "no-show" } })
        .populate("employee", "firstName lastName name"),
    ]);

    // Group weekly hours by employee
    const hoursMap = {};
    weeklyShifts.forEach(s => {
      const id = s.employee?._id?.toString();
      if (!id) return;
      if (!hoursMap[id]) hoursMap[id] = { name: s.employee.name || `${s.employee.firstName} ${s.employee.lastName}`, hours: 0 };
      const [sh,sm] = (s.startTime||"09:00").split(":").map(Number);
      let   [eh,em] = (s.endTime  ||"17:00").split(":").map(Number);
      if (eh < sh) eh += 24;
      hoursMap[id].hours += Math.round(((eh*60+em)-(sh*60+sm))/60*10)/10;
    });
    const weeklyHours = Object.values(hoursMap).map(e => ({ ...e, cost: Math.round(e.hours * 15) }));

    res.json({
      success: true,
      todayShifts,
      pendingSwaps,
      weeklyHours,
      alerts: [],
      stats: {
        employeeCount:      empIds.length,
        pendingSwapsCount:  pendingSwaps.length,
        todayCoverage:      todayShifts.length,
        weeklyHoursTotal:   Object.values(hoursMap).reduce((a,e)=>a+e.hours,0),
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;