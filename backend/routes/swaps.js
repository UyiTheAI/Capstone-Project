const express      = require("express");
const router       = express.Router();
const SwapRequest  = require("../models/SwapRequest");
const Notification = require("../models/Notification");
const Shift        = require("../models/Shift");
const User         = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const { getMyOrgUserIds, getMyEmployeeIds } = require("../utils/getMyEmployees");

// GET /api/swaps
router.get("/", protect, async (req, res) => {
  try {
    let query = {};
    if (req.user.role === "employee") {
      query = { $or:[{ requester:req.user._id }, { proposedEmployee:req.user._id }] };
    } else {
      // Manager/Owner — only swaps from their org employees
      const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
      query.requester = { $in: empIds };
    }
    if (req.query.status) query.status = req.query.status;

    const swaps = await SwapRequest.find(query)
      .populate("requester",        "firstName lastName name position")
      .populate("proposedEmployee", "firstName lastName name position")
      .populate("shift",            "date startTime endTime role area timeLabel")
      .populate("reviewedBy",       "firstName lastName name")
      .sort({ createdAt:-1 });

    res.json({ success:true, count:swaps.length, swaps });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/swaps — employee submits swap request
router.post("/", protect, authorize("employee"), async (req, res) => {
  try {
    const { proposedEmployeeId, shiftId, shiftDate, shiftTime, shiftRole, reason, coverageNote } = req.body;

    if (!proposedEmployeeId || !reason)
      return res.status(400).json({ success:false, message:"proposedEmployeeId and reason are required" });
    if (!shiftDate || !shiftTime || !shiftRole)
      return res.status(400).json({ success:false, message:"shiftDate, shiftTime, and shiftRole are required" });

    // Verify proposed employee is in same org
    const { getOrgEmployeeIds } = require("../utils/getMyEmployees");
    const orgEmpIds = await getOrgEmployeeIds(req.user._id);
    const inOrg = orgEmpIds.map(id=>id.toString()).includes(proposedEmployeeId.toString());
    if (!inOrg)
      return res.status(403).json({ success:false, message:"Cannot swap with an employee outside your organization" });

    // Check for duplicate pending swap
    if (shiftId && shiftId.match(/^[0-9a-fA-F]{24}$/)) {
      const existing = await SwapRequest.findOne({ shift:shiftId, status:"pending" });
      if (existing) return res.status(400).json({ success:false, message:"A pending swap already exists for this shift" });
    }

    const swap = await SwapRequest.create({
      requester:        req.user._id,
      proposedEmployee: proposedEmployeeId,
      shift:            shiftId && shiftId.match(/^[0-9a-fA-F]{24}$/) ? shiftId : undefined,
      shiftDate, shiftTime, shiftRole,
      reason,
      coverageNote: coverageNote || "",
    });

    await swap.populate([
      { path:"requester",        select:"firstName lastName name" },
      { path:"proposedEmployee", select:"firstName lastName name" },
    ]);

    const requesterName = `${req.user.firstName} ${req.user.lastName}`;

    // Notify proposed employee
    await Notification.create({
      recipient: proposedEmployeeId,
      type:      "SWAP_REQUEST",
      title:     "Shift Swap Request",
      message:   `${requesterName} wants you to cover their ${shiftRole} shift on ${shiftDate}`,
      relatedSwap: swap._id,
    });

    // Notify org managers/owner only
    const orgUserIds = await getOrgEmployeeIds(req.user._id);
    const managers = await User.find({ role:{ $in:["manager","owner"] } }).select("_id orgOwner createdBy");
    // Filter to managers in same org
    const { findRootOwner } = require("../utils/getMyEmployees");
    const myRoot = await findRootOwner(req.user._id);
    const orgManagers = managers.filter(m =>
      m.role === "owner" ? m._id.toString() === (myRoot||"").toString()
      : m.orgOwner?.toString() === (myRoot||"").toString() || m.createdBy?.toString() === (myRoot||"").toString()
    );

    if (orgManagers.length) {
      await Notification.insertMany(orgManagers.map(m => ({
        recipient:   m._id,
        type:        "SWAP_REQUEST",
        title:       "New Swap Request",
        message:     `${requesterName} submitted a swap request for ${shiftDate}`,
        relatedSwap: swap._id,
      })));
    }

    res.status(201).json({ success:true, swap });
  } catch(err) { res.status(400).json({ success:false, message:err.message }); }
});

// PUT /api/swaps/:id/approve
router.put("/:id/approve", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate("requester",        "_id firstName lastName name")
      .populate("proposedEmployee", "_id firstName lastName name")
      .populate("shift");

    if (!swap) return res.status(404).json({ success:false, message:"Swap not found" });
    if (swap.status !== "pending") return res.status(400).json({ success:false, message:"Already resolved" });

    swap.status         = "approved";
    swap.managerComment = req.body.comment || "";
    swap.reviewedBy     = req.user._id;
    swap.reviewedAt     = new Date();
    await swap.save();

    // Reassign shift to new employee
    if (swap.shift) {
      await Shift.findByIdAndUpdate(swap.shift._id, { employee:swap.proposedEmployee._id, status:"swapped" });
    }

    const reviewerName = `${req.user.firstName} ${req.user.lastName}`;
    await Notification.create({
      recipient:swap.requester._id, type:"APPROVED", title:"Swap Approved",
      message:`Your swap request for ${swap.shiftDate} was APPROVED by ${reviewerName}. ${swap.managerComment||""}`,
      relatedSwap:swap._id,
    });
    await Notification.create({
      recipient:swap.proposedEmployee._id, type:"APPROVED", title:"You Received a Shift",
      message:`You now have a ${swap.shiftRole} shift on ${swap.shiftDate}`,
      relatedSwap:swap._id,
    });

    res.json({ success:true, swap });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/swaps/:id/reject
router.put("/:id/reject", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const swap = await SwapRequest.findById(req.params.id)
      .populate("requester","_id firstName lastName name");

    if (!swap) return res.status(404).json({ success:false, message:"Swap not found" });
    if (swap.status !== "pending") return res.status(400).json({ success:false, message:"Already resolved" });

    swap.status         = "rejected";
    swap.managerComment = req.body.comment || "";
    swap.reviewedBy     = req.user._id;
    swap.reviewedAt     = new Date();
    await swap.save();

    const reviewerName = `${req.user.firstName} ${req.user.lastName}`;
    await Notification.create({
      recipient:swap.requester._id, type:"REJECTED", title:"Swap Rejected",
      message:`Your swap request for ${swap.shiftDate} was rejected by ${reviewerName}. ${swap.managerComment||""}`,
      relatedSwap:swap._id,
    });

    res.json({ success:true, swap });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;