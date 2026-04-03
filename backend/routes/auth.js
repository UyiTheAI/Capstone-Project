const express       = require("express");
const router        = express.Router();
const passport      = require("passport");
const crypto        = require("crypto");
const nodemailer    = require("nodemailer");
const User          = require("../models/User");
const { protect, generateToken } = require("../middleware/auth");

// ── OAuth success helper ──────────────────────────────────────────────────
function oauthSuccess(user, res) {
  const token = generateToken(user._id);
  const data  = encodeURIComponent(JSON.stringify({
    token,
    user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, availability: user.availability, avatar: user.avatar || null },
  }));
  res.redirect(`${process.env.FRONTEND_URL || "http://localhost:3000"}/oauth/callback?data=${data}`);
}

// ── Register ──────────────────────────────────────────────────────────────
router.post("/register", async (req, res) => {
  try {
    const { firstName, lastName, email, password, role, position, availability, orgCode } = req.body;
    if (!firstName || !lastName || !email || !password || !role)
      return res.status(400).json({ success: false, message: "All fields required" });
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered" });

    // Employees and managers must provide a valid org code
    let orgOwner = null;
    if (role !== "owner") {
      if (!orgCode)
        return res.status(400).json({ success: false, message: "Organisation code is required" });
      const owner = await User.findOne({ orgCode, subscriptionStatus: "active" });
      if (!owner)
        return res.status(400).json({ success: false, message: "Invalid or expired organisation code" });
      orgOwner = owner._id;
    }

    const user  = await User.create({ firstName, lastName, email, password, role, position: position||"", availability: availability||"Full-Time", orgOwner });
    const token = generateToken(user._id);
    res.status(201).json({ success: true, token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, availability: user.availability } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Login ─────────────────────────────────────────────────────────────────
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ success: false, message: "Email and password required" });
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.matchPassword(password)))
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    const token = generateToken(user._id);
    res.json({ success: true, token, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, availability: user.availability, avatar: user.avatar } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Me ────────────────────────────────────────────────────────────────────
router.get("/me", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, position: user.position, availability: user.availability, availabilitySchedule: user.availabilitySchedule, noShows: user.noShows, coveragePercent: user.coveragePercent, lastAttendance: user.lastAttendance, avatar: user.avatar, orgCode: user.orgCode, subscriptionStatus: user.subscriptionStatus } });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

router.put("/me", protect, async (req, res) => {
  try {
    const { firstName, lastName, position, availability, availabilitySchedule, avatar } = req.body;
    const user = await User.findByIdAndUpdate(req.user._id, { firstName, lastName, position, availability, availabilitySchedule, avatar }, { new: true });
    res.json({ success: true, user });
  } catch (err) { res.status(400).json({ success: false, message: err.message }); }
});

// ── Forgot Password ───────────────────────────────────────────────────────
router.post("/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });
    if (!user)
      return res.status(404).json({ success: false, message: "No account found with that email" });

    // Generate reset token
    const resetToken  = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken  = crypto.createHash("sha256").update(resetToken).digest("hex");
    user.resetPasswordExpire = Date.now() + 30 * 60 * 1000; // 30 min
    await user.save({ validateBeforeSave: false });

    const resetUrl = `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password/${resetToken}`;

    // Send email
    try {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
      });
      await transporter.sendMail({
        from:    `"SHIFT-UP" <${process.env.EMAIL_USER}>`,
        to:      user.email,
        subject: "Password Reset Request — SHIFT-UP",
        html: `
          <div style="font-family:sans-serif;max-width:480px;margin:auto;padding:32px">
            <h2 style="color:#f5b800">SHIFT-UP</h2>
            <h3>Reset your password</h3>
            <p>Click the button below to reset your password. This link expires in 30 minutes.</p>
            <a href="${resetUrl}" style="display:inline-block;padding:12px 28px;background:#f5b800;color:#1a1a1a;border-radius:8px;font-weight:700;text-decoration:none;margin:16px 0">
              Reset Password
            </a>
            <p style="color:#999;font-size:12px">If you didn't request this, ignore this email.</p>
          </div>
        `,
      });
      res.json({ success: true, message: "Reset email sent" });
    } catch (emailErr) {
      user.resetPasswordToken  = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });
      res.status(500).json({ success: false, message: "Email could not be sent. Check EMAIL_USER and EMAIL_PASS in .env" });
    }
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Reset Password ────────────────────────────────────────────────────────
router.post("/reset-password/:token", async (req, res) => {
  try {
    const hashed = crypto.createHash("sha256").update(req.params.token).digest("hex");
    const user   = await User.findOne({
      resetPasswordToken:  hashed,
      resetPasswordExpire: { $gt: Date.now() },
    });
    if (!user)
      return res.status(400).json({ success: false, message: "Invalid or expired reset token" });

    user.password            = req.body.password;
    user.resetPasswordToken  = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    const token = generateToken(user._id);
    res.json({ success: true, message: "Password reset successful", token });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── Google OAuth ──────────────────────────────────────────────────────────
router.get("/google", (req, res, next) => {
  const role = ["employee","manager","owner"].includes(req.query.role) ? req.query.role : "employee";
  passport.authenticate("google", { scope: ["profile","email"], session: false, state: role })(req, res, next);
});

router.get("/google/callback", (req, res, next) => {
  if (req.query.state) req.query.role = req.query.state;
  passport.authenticate("google", { session: false, failureRedirect: `${process.env.FRONTEND_URL || "http://localhost:3000"}/login?error=google_failed` })(req, res, next);
}, (req, res) => oauthSuccess(req.user, res));

module.exports = router;