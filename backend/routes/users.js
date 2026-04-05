const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// GET /api/users — only staff created by current user
router.get("/", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({
      createdBy: req.user._id,
      role: { $in: ["employee","manager"] },
    }).select("-password").sort({ createdAt: -1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/employees — employees created by current user
router.get("/employees", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({
      createdBy: req.user._id,
      role: "employee",
    }).select("-password").sort({ firstName: 1 });
    res.json({ success: true, users, employees: users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/managers — managers created by current user (owner only)
router.get("/managers", protect, authorize("owner"), async (req, res) => {
  try {
    const users = await User.find({
      createdBy: req.user._id,
      role: "manager",
    }).select("-password").sort({ firstName: 1 });
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/reports
router.get("/reports", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const users = await User.find({
      createdBy: req.user._id,
      role: "employee",
    }).select("-password");
    res.json({ success: true, users });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/users/create-employee
router.post("/create-employee", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const { firstName, lastName, email, password, position, availability, role } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });

    // Managers can only create employees
    if (req.user.role === "manager" && role === "manager")
      return res.status(403).json({ success: false, message: "Only owners can create manager accounts" });

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered" });

    const user = await User.create({
      firstName, lastName, email, password,
      role:         role === "manager" ? "manager" : "employee",
      position:     position     || "",
      availability: availability || "Full-Time",
      createdBy:    req.user._id,  // track who created this user
    });

    res.status(201).json({
      success: true,
      message: `${role === "manager" ? "Manager" : "Employee"} account created successfully`,
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/users/:id
router.get("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findOne({ _id: req.params.id, createdBy: req.user._id }).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// PUT /api/users/:id
router.put("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findOneAndUpdate(
      { _id: req.params.id, createdBy: req.user._id },
      req.body,
      { new: true }
    ).select("-password");
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// DELETE /api/users/:id — only delete staff you created
router.delete("/:id", protect, authorize("manager","owner"), async (req, res) => {
  try {
    const user = await User.findOneAndDelete({
      _id:       req.params.id,
      createdBy: req.user._id,
    });
    if (!user) return res.status(404).json({ success: false, message: "User not found or not authorized" });
    res.json({ success: true, message: "Staff member removed" });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;