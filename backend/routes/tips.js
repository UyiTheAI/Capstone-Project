const express  = require("express");
const router   = express.Router();
const Tip      = require("../models/Tip");
const User     = require("../models/User");
const Notification = require("../models/Notification");
const { protect, authorize } = require("../middleware/auth");

// ── GET /api/tips – All tip records (owner only)
router.get("/", protect, authorize("owner"), async (req, res) => {
  try {
    const tips = await Tip.find()
      .populate("distributions.employee", "firstName lastName name position")
      .populate("recordedBy", "firstName lastName name")
      .sort({ date: -1 })
      .limit(50);
    res.json({ success: true, tips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/tips/mine – Employee's own tip history
router.get("/mine", protect, async (req, res) => {
  try {
    const tips = await Tip.find({ "distributions.employee": req.user._id })
      .populate("recordedBy", "firstName lastName name")
      .sort({ date: -1 });

    const myTips = tips.map((t) => {
      const dist = t.distributions.find(
        (d) => d.employee.toString() === req.user._id.toString()
      );
      return {
        _id: t._id,
        date: t.date,
        totalAmount: t.totalAmount,
        myAmount: dist?.amount || 0,
        note: t.note,
        splitMethod: t.splitMethod,
        recordedBy: t.recordedBy,
      };
    });

    res.json({ success: true, tips: myTips });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/tips – Record and distribute tips (owner only)
router.post("/", protect, authorize("owner"), async (req, res) => {
  try {
    const { date, totalAmount, splitMethod, note, distributions } = req.body;

    if (!date || !totalAmount) {
      return res.status(400).json({ success: false, message: "Date and total amount are required" });
    }

    let finalDistributions = distributions || [];

    // Auto-calculate equal split if no manual distributions
    if (splitMethod === "equal" && (!distributions || distributions.length === 0)) {
      const employees = await User.find({ role: "employee" }).select("_id");
      const share = parseFloat((totalAmount / employees.length).toFixed(2));
      finalDistributions = employees.map((e) => ({ employee: e._id, amount: share }));
    }

    const tip = await Tip.create({
      date,
      totalAmount,
      splitMethod: splitMethod || "equal",
      note: note || "",
      recordedBy: req.user._id,
      distributions: finalDistributions,
    });

    await tip.populate("distributions.employee", "firstName lastName name");

    // Notify each employee
    const notifs = finalDistributions.map((d) => ({
      recipient: d.employee,
      type: "SHIFT_ALERT",
      title: "💰 Tips Distributed",
      message: `You received $${Number(d.amount).toFixed(2)} in tips for ${new Date(date).toLocaleDateString("en", { month: "short", day: "numeric" })}`,
    }));
    if (notifs.length) await Notification.insertMany(notifs);

    res.status(201).json({ success: true, tip });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

// ── DELETE /api/tips/:id – Delete tip record (owner only)
router.delete("/:id", protect, authorize("owner"), async (req, res) => {
  try {
    await Tip.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Tip record deleted" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;