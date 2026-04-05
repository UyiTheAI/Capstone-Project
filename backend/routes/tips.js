const express      = require("express");
const router       = express.Router();
const Tip          = require("../models/Tip");
const Notification = require("../models/Notification");
const { protect, authorize } = require("../middleware/auth");
const { getMyEmployeeIds } = require("../utils/getMyEmployees");

// GET /api/tips — org tip history (owner/manager)
router.get("/", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    const tips   = await Tip.find({ "distributions.employee":{ $in:empIds } })
      .populate("distributions.employee","firstName lastName name position")
      .populate("recordedBy","firstName lastName name")
      .sort({ date:-1 }).limit(50);
    res.json({ success:true, tips });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/tips/mine — employee tip history
router.get("/mine", protect, async (req, res) => {
  try {
    const tips = await Tip.find({ "distributions.employee":req.user._id })
      .populate("recordedBy","firstName lastName name")
      .sort({ date:-1 });

    const myTips = tips.map(t => {
      const dist = t.distributions.find(d => d.employee.toString() === req.user._id.toString());
      return {
        _id:t._id, date:t.date,
        totalAmount: t.totalAmount,
        myAmount:    dist?.amount || 0,
        note:        t.note,
        splitMethod: t.splitMethod,
        recordedBy:  t.recordedBy,
      };
    });
    res.json({ success:true, tips:myTips });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/tips — distribute tips
router.post("/", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const { date, totalAmount, splitMethod, note, distributions } = req.body;
    if (!date || !totalAmount)
      return res.status(400).json({ success:false, message:"Date and totalAmount required" });

    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    let finalDist = [];

    if (splitMethod === "equal") {
      const share = parseFloat(totalAmount) / empIds.length;
      finalDist   = empIds.map(id => ({ employee:id, amount:parseFloat(share.toFixed(2)), hours:0 }));
    } else if (splitMethod === "manual" && distributions?.length) {
      // Only allow distributions to own org employees
      const allowed = empIds.map(id=>id.toString());
      finalDist = distributions
        .filter(d => allowed.includes(d.employee?.toString()))
        .map(d => ({ employee:d.employee, amount:parseFloat(d.amount)||0, hours:d.hours||0 }));
    } else {
      finalDist = (distributions||[]).map(d => ({ employee:d.employee, amount:parseFloat(d.amount)||0, hours:d.hours||0 }));
    }

    const tip = await Tip.create({
      date, totalAmount:parseFloat(totalAmount), splitMethod:splitMethod||"equal",
      note:note||"", recordedBy:req.user._id, distributions:finalDist,
    });

    // Notify each employee
    await Notification.insertMany(finalDist.map(d => ({
      recipient: d.employee,
      type:      "APPROVED",
      title:     "💰 Tips Distributed",
      message:   `You received $${d.amount.toFixed(2)} in tips for ${new Date(date).toLocaleDateString()}`,
    })));

    await tip.populate([
      { path:"distributions.employee", select:"firstName lastName name" },
      { path:"recordedBy", select:"firstName lastName name" },
    ]);

    res.status(201).json({ success:true, tip });
  } catch(err) { res.status(400).json({ success:false, message:err.message }); }
});

module.exports = router;