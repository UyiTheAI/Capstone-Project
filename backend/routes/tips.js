const express  = require("express");
const router   = express.Router();
const Tip      = require("../models/tip");
const User     = require("../models/User");
const Notification = require("../models/Notification");
const { protect, authorize } = require("../middleware/auth");

// GET /api/tips — all tip records (owner only)
router.get("/", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const tips = await Tip.find()
      .populate("distributions.employee", "firstName lastName avatar")
      .populate("recordedBy", "firstName lastName")
      .sort({ date: -1 });
    res.json({ success: true, tips });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/tips/mine — my own tip history
router.get("/mine", protect, async (req, res) => {
  try {
    const tips = await Tip.find({ "distributions.employee": req.user._id })
      .populate("recordedBy", "firstName lastName")
      .sort({ date: -1 });

    const myTips = tips.map(tip => ({
      _id:        tip._id,
      date:       tip.date,
      totalAmount: tip.totalAmount,
      splitMethod: tip.splitMethod,
      note:        tip.note,
      recordedBy:  tip.recordedBy,
      myAmount:    tip.distributions.find(d => d.employee.toString() === req.user._id.toString())?.amount || 0,
    }));

    res.json({ success: true, tips: myTips });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/tips — distribute tips + notify each employee
router.post("/", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const { date, totalAmount, splitMethod, note, distributions } = req.body;
    if (!date || !totalAmount || !distributions?.length)
      return res.status(400).json({ success: false, message: "date, totalAmount and distributions required" });

    const tip = await Tip.create({ date, totalAmount, splitMethod, note, recordedBy: req.user._id, distributions });

    // ── Send notification to every employee in the distribution ────────────
    const notifPromises = distributions.map(async (d) => {
      const emp = await User.findById(d.employee).select("firstName");
      if (!emp) return;
      return Notification.create({
        recipient: d.employee,
        type:      "SHIFT_ALERT",
        title:     "💰 Tips Distributed",
        message:   `You received $${d.amount.toFixed(2)} in tips for ${new Date(date).toLocaleDateString()}. ${note ? `Note: ${note}` : ""}`,
        read:      false,
      });
    });
    await Promise.all(notifPromises);

    const populated = await Tip.findById(tip._id)
      .populate("distributions.employee", "firstName lastName avatar")
      .populate("recordedBy", "firstName lastName");

    res.status(201).json({ success: true, tip: populated });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// DELETE /api/tips/:id
router.delete("/:id", protect, authorize("owner"), async (req, res) => {
  try {
    await Tip.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Tip record deleted" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;