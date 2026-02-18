const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Shift = require("../models/Shift");
const SwapRequest = require("../models/SwapRequest");
const { protect, authorize } = require("../middleware/auth");

// ── GET /api/users/employees – All employees (manager/owner)
router.get("/employees", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: true })
      .select("-password")
      .sort({ firstName: 1 });

    // Attach swap request counts
    const withStats = await Promise.all(
      employees.map(async (emp) => {
        const swapCount = await SwapRequest.countDocuments({ requester: emp._id });
        return {
          ...emp.toJSON(),
          totalSwapRequests: swapCount,
        };
      })
    );

    res.json({ success: true, employees: withStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/users/:id – Get single user
router.get("/:id", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/users/:id – Update user (manager/owner or self)
router.put("/:id", protect, async (req, res) => {
  try {
    // Allow self-update or manager update
    if (req.user.role === "employee" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }

    const user = await User.findByIdAndUpdate(
      req.params.id,
      { ...req.body, password: undefined }, // never update password here
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── PUT /api/users/me/availability – Update my availability schedule
router.put("/me/availability", protect, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      {
        availabilitySchedule: req.body.availabilitySchedule,
        availability: req.body.availability,
      },
      { new: true }
    ).select("-password");

    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── GET /api/users/reports/weekly – Weekly hours & cost report
router.get("/reports/weekly", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: "from and to dates required" });
    }

    const employees = await User.find({ role: "employee", isActive: true }).select("firstName lastName name position");
    const hourlyRate = 10; // default rate

    const report = await Promise.all(
      employees.map(async (emp) => {
        const shifts = await Shift.find({
          employee: emp._id,
          date: { $gte: new Date(from), $lte: new Date(to) },
          status: { $ne: "no-show" },
        });

        // Calculate hours from shifts (estimate 8h if no specific times)
        const totalHours = shifts.reduce((sum, s) => {
          const start = parseInt(s.startTime);
          const end = parseInt(s.endTime);
          return sum + (isNaN(start) || isNaN(end) ? 8 : Math.abs(end - start));
        }, 0);

        const cost = totalHours * hourlyRate;
        const noShowCount = await Shift.countDocuments({
          employee: emp._id,
          date: { $gte: new Date(from), $lte: new Date(to) },
          status: "no-show",
        });
        const swapCount = await SwapRequest.countDocuments({ requester: emp._id });

        return {
          employee: { id: emp._id, name: emp.name, position: emp.position },
          hours: totalHours,
          cost,
          noShows: noShowCount,
          swapRequests: swapCount,
        };
      })
    );

    const totals = report.reduce(
      (acc, r) => ({ hours: acc.hours + r.hours, cost: acc.cost + r.cost }),
      { hours: 0, cost: 0 }
    );

    res.json({ success: true, report, totals });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
