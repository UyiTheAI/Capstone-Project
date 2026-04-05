const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize } = require("../middleware/auth");
const { getMyEmployeeIds, getMyOrgUserIds } = require("../utils/getMyEmployees");

// GET /api/users — staff created DIRECTLY by current user
router.get("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({ createdBy: req.user._id, role:{ $in:["employee","manager"] } })
      .select("-password").sort({ createdAt:-1 });
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/employees — all org employees (for schedule, swap, tips, overview)
router.get("/employees", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    const users  = await User.find({ _id:{ $in:empIds } }).select("-password").sort({ firstName:1 });
    res.json({ success:true, users, employees:users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/org-employees — all employees in same org as current employee (for swap)
router.get("/org-employees", protect, async (req, res) => {
  try {
    const { getOrgEmployeeIds } = require("../utils/getMyEmployees");
    const empIds = await getOrgEmployeeIds(req.user._id);
    // Exclude current user
    const users = await User.find({ _id:{ $in:empIds, $ne:req.user._id } })
      .select("firstName lastName name position availability").sort({ firstName:1 });
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/managers
router.get("/managers", protect, authorize("owner"), async (req, res) => {
  try {
    const users = await User.find({ createdBy:req.user._id, role:"manager" })
      .select("-password").sort({ firstName:1 });
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/reports
router.get("/reports", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const empIds = await getMyEmployeeIds(req.user._id, req.user.role);
    const users  = await User.find({ _id:{ $in:empIds } }).select("-password");
    res.json({ success:true, users });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// POST /api/users/create-employee
router.post("/create-employee", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { firstName, lastName, email, password, position, availability, role } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success:false, message:"All fields required" });
    if (req.user.role === "manager" && role === "manager")
      return res.status(403).json({ success:false, message:"Only owners can create manager accounts" });
    if (await User.findOne({ email }))
      return res.status(400).json({ success:false, message:"Email already registered" });

    // Determine orgOwner (root of the org)
    let orgOwner;
    if (req.user.role === "owner") {
      orgOwner = req.user._id;
    } else {
      // manager — use their orgOwner
      orgOwner = req.user.orgOwner || req.user.createdBy || req.user._id;
    }

    const user = await User.create({
      firstName, lastName, email, password,
      role:         role === "manager" ? "manager" : "employee",
      position:     position     || "",
      availability: availability || "Full-Time",
      createdBy:    req.user._id,
      orgOwner,
    });

    res.status(201).json({
      success:true,
      message:`${role==="manager"?"Manager":"Employee"} account created`,
      user:{ id:user._id, firstName:user.firstName, lastName:user.lastName, email:user.email, role:user.role, position:user.position },
    });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// GET /api/users/:id
router.get("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const orgIds  = await getMyOrgUserIds(req.user._id, req.user.role);
    const isInOrg = orgIds.map(id=>id.toString()).includes(req.params.id);
    if (!isInOrg) return res.status(404).json({ success:false, message:"User not found" });
    const user = await User.findById(req.params.id).select("-password");
    res.json({ success:true, user });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// PUT /api/users/:id
router.put("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id:req.params.id, createdBy:req.user._id }, req.body, { new:true }
    ).select("-password");
    if (!user) return res.status(404).json({ success:false, message:"Not found" });
    res.json({ success:true, user });
  } catch(err) { res.status(400).json({ success:false, message:err.message }); }
});

// DELETE /api/users/:id
router.delete("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({ _id:req.params.id, createdBy:req.user._id });
    if (!user) return res.status(404).json({ success:false, message:"Not authorized" });
    res.json({ success:true, message:"Staff member removed" });
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

module.exports = router;