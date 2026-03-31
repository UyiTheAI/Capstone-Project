const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const Shift   = require("../models/Shift");
const SwapRequest = require("../models/SwapRequest");
const { protect, authorize } = require("../middleware/auth");

// ── GET /api/users/employees – All employees (any logged-in user)
router.get("/employees", protect, async (req, res) => {
  try {
    const employees = await User.find({ role: "employee", isActive: true })
      .select("-password")
      .sort({ firstName: 1 });

    const withStats = await Promise.all(
      employees.map(async (emp) => {
        const swapCount = await SwapRequest.countDocuments({ requester: emp._id });
        return { ...emp.toJSON(), totalSwapRequests: swapCount };
      })
    );

    res.json({ success: true, employees: withStats });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/users/me/availability – MUST be before /:id
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

// ── GET /api/users/reports/weekly – MUST be before /:id
router.get("/reports/weekly", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const { from, to } = req.query;
    if (!from || !to) {
      return res.status(400).json({ success: false, message: "from and to dates required" });
    }

    const employees = await User.find({ role: "employee", isActive: true })
      .select("firstName lastName name position");
    const hourlyRate = 10;

    const report = await Promise.all(
      employees.map(async (emp) => {
        const shifts = await Shift.find({
          employee: emp._id,
          date: { $gte: new Date(from), $lte: new Date(to) },
          status: { $ne: "no-show" },
        });

        const totalHours = shifts.reduce((sum, s) => {
          const [sh, sm] = (s.startTime || "0:0").split(":").map(Number);
          const [eh, em] = (s.endTime   || "0:0").split(":").map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          return sum + (diff > 0 ? diff / 60 : 8);
        }, 0);

        const cost = Math.round(totalHours * hourlyRate * 100) / 100;
        const noShowCount = await Shift.countDocuments({
          employee: emp._id,
          date: { $gte: new Date(from), $lte: new Date(to) },
          status: "no-show",
        });
        const swapCount = await SwapRequest.countDocuments({ requester: emp._id });

        return {
          employee: { id: emp._id, name: emp.name, position: emp.position },
          hours: Math.round(totalHours * 10) / 10,
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

// ── GET /api/users/:id – AFTER specific routes
router.get("/:id", protect, authorize("manager", "owner"), async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/users/:id – AFTER specific routes
router.put("/:id", protect, async (req, res) => {
  try {
    if (req.user.role === "employee" && req.user._id.toString() !== req.params.id) {
      return res.status(403).json({ success: false, message: "Not authorized" });
    }
    const { password, ...updateData } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    ).select("-password");

    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;