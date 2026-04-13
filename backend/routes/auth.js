const express = require("express");
const router = express.Router();
const User = require("../models/User");
const { protect, generateToken } = require("../middleware/auth");

// ── POST /api/auth/register ───────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, position, availability } = req.body;

    if (!firstName || !lastName || !email || !password || !role) {
      return res.status(400).json({ success: false, message: "All fields are required" });
    }

    const existing = await User.findOne({ email });
    if (existing) {
      return res.status(400).json({ success: false, message: "Email already registered" });
    }

    const user = await User.create({
      firstName,
      lastName,
      email,
      password,
      role,
      position: position || "",
      availability: availability || "Full-Time",
    });

    const token = generateToken(user._id);

    res.status(201).json({
      success: true,
      message: "Registration successful",
      token,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        position: user.position,
        availability: user.availability,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/auth/login ──────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    const user = await User.findOne({ email }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(401).json({ success: false, message: "Account deactivated. Contact admin." });
    }

    const token = generateToken(user._id);

    res.json({
      success: true,
      token,
      user: {
        id: user._id,
        name: user.name,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        position: user.position,
        availability: user.availability,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  const user = await User.findById(req.user._id);
  res.json({
    success: true,
    user: {
      id: user._id,
      name: user.name,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      role: user.role,
      position: user.position,
      availability: user.availability,
      availabilitySchedule: user.availabilitySchedule,
      noShows: user.noShows,
      coveragePercent: user.coveragePercent,
      lastAttendance: user.lastAttendance,
    },
  });
});

// ── PUT /api/auth/me ──────────────────────────────────────────────────────
router.put("/me", protect, async (req, res) => {
  try {
    const { firstName, lastName, position, availability, availabilitySchedule } = req.body;
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { firstName, lastName, position, availability, availabilitySchedule },
      { new: true, runValidators: true }
    );
    res.json({ success: true, user });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
});

module.exports = router;
// ── POST /api/auth/forgot-password ────────────────────────────────────────
// Sends a reset email (or silently succeeds to prevent enumeration)
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ success:false, message:"Email required" });

    const user = await User.findOne({ email: email.toLowerCase() });

    if (user) {
      // In production: generate a token, save to DB, send email with reset link
      // For now: send a simple email with their existing credentials info
      const { sendEmail, emailWrapper } = require("../utils/sendEmail");
      await sendEmail({
        to: user.email,
        subject: "SHIFT-UP — Password Reset Request",
        html: emailWrapper(`
          <h2 style="margin:0 0 12px;font-size:22px;color:#1a1a1a">Password Reset</h2>
          <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 20px">
            Hi ${user.firstName}, we received a request to reset your password for your SHIFT-UP account.
          </p>
          <div style="background:#f9f9f7;border-radius:12px;padding:18px;margin-bottom:20px;font-size:13px;color:#555;line-height:1.8">
            Your account email: <strong style="color:#1a1a1a">${user.email}</strong><br/>
            To reset your password, please contact your organization administrator, or reply to this email for support.
          </div>
          <p style="font-size:13px;color:#aaa;">
            If you didn't request this, you can safely ignore this email.
          </p>
        `),
      });
    }

    // Always return success (prevents email enumeration)
    res.json({ success:true, message:"If an account exists, a reset email has been sent." });
  } catch (err) {
    console.error("Forgot password error:", err.message);
    res.json({ success:true, message:"If an account exists, a reset email has been sent." });
  }
});