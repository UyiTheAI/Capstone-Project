const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const getStripe = () => process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

const sendTrialEmail = async (toEmail, name) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`⚠️  No email config — trial started for ${toEmail}`);
    return;
  }
  try {
    const nodemailer  = require("nodemailer");
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from:    `"SHIFT-UP" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: "🎉 Welcome to SHIFT-UP — Your 7-Day Free Trial Has Started!",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden">
          <div style="background:#1a1a1a;padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:900;color:#f5b800;letter-spacing:2px">SHIFT-UP</div>
            <div style="color:#888;font-size:13px">Workforce Management</div>
          </div>
          <div style="padding:40px">
            <h2 style="color:#1a1a1a">🎁 Your 7-Day Free Trial Has Started!</h2>
            <p style="color:#555;line-height:1.7">Hi ${name}! Welcome to SHIFT-UP. You have full access for 7 days — no charge until your trial ends.</p>
            <div style="background:#f0fdf4;border:2px solid #86efac;border-radius:12px;padding:20px;text-align:center;margin:24px 0">
              <div style="font-size:14px;color:#166534;font-weight:700">✅ Your account is ready</div>
              <div style="font-size:13px;color:#166534;margin-top:4px">Log in now and start managing your team</div>
            </div>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/login" style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:16px;border-radius:10px;text-decoration:none;margin:24px 0">
              Log In to SHIFT-UP →
            </a>
            <p style="font-size:12px;color:#aaa;text-align:center">Trial ends in 7 days. Cancel anytime = $0. After trial: $5 CAD/month.</p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Trial email sent to ${toEmail}`);
  } catch (err) {
    console.error("Email error:", err.message);
  }
};

// ============================================================
// PUBLIC ROUTES (no auth needed)
// ============================================================

// POST /api/subscription/setup-intent
// Creates a SetupIntent to collect card details WITHOUT charging.
// Works even with trial (no payment needed upfront).
router.post("/setup-intent", async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });

    const { email, firstName, lastName } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    // Create or find Stripe customer
    let customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    if (existing.data.length > 0) {
      customer = existing.data[0];
    } else {
      customer = await stripe.customers.create({
        email,
        name: `${firstName || ""} ${lastName || ""}`.trim(),
        metadata: { pendingRegistration: "true" },
      });
    }

    // Create SetupIntent — collects card, no charge
    const setupIntent = await stripe.setupIntents.create({
      customer:              customer.id,
      payment_method_types:  ["card"],
      usage:                 "off_session",
      metadata: {
        pendingEmail:     email,
        firstName:        firstName || "",
        lastName:         lastName  || "",
        customerId:       customer.id,
      },
    });

    res.json({
      success:      true,
      clientSecret: setupIntent.client_secret,
      customerId:   customer.id,
      setupIntentId: setupIntent.id,
    });
  } catch (err) {
    console.error("Setup intent error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/subscription/register-and-activate
// Called AFTER SetupIntent confirmed.
// Creates subscription with trial + registers owner in DB.
router.post("/register-and-activate", async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });
    if (!process.env.STRIPE_PRICE_ID) return res.status(400).json({ success: false, message: "STRIPE_PRICE_ID not set" });

    const { firstName, lastName, email, password, customerId, paymentMethodId } = req.body;

    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success: false, message: "All fields required" });
    if (!customerId)
      return res.status(400).json({ success: false, message: "Customer ID required" });

    // Check email not already registered
    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered. Please sign in." });

    // Set payment method as default on customer
    if (paymentMethodId) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Create subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer:          customerId,
      items:             [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 7,
      metadata:          { email, firstName, lastName },
    });

    // Register owner in DB
    const user = await User.create({
      firstName, lastName, email, password,
      role:               "owner",
      position:           "Owner",
      availability:       "Full-Time",
      subscriptionStatus: "active",
      subscriptionPlan:   "pro",
      stripeCustomerId:   customerId,
    });

    // Send welcome email
    try { await sendTrialEmail(user.email, user.firstName); } catch {}

    const { generateToken } = require("../middleware/auth");

    res.json({
      success: true,
      message: "Account created and trial started",
      token:   generateToken(user._id),
      user: {
        id: user._id, firstName: user.firstName, lastName: user.lastName,
        email: user.email, role: user.role,
        subscriptionStatus: user.subscriptionStatus,
      },
    });
  } catch (err) {
    console.error("Register and activate error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ============================================================
// AUTHENTICATED ROUTES
// ============================================================

// GET /api/subscription/plan
router.get("/plan", (req, res) => {
  res.json({ success: true, plan: { name:"SHIFT-UP Pro", priceId: process.env.STRIPE_PRICE_ID, amount: 500, trial: 7 } });
});

// GET /api/subscription/status
router.get("/status", protect, async (req, res) => {
  try {
    const stripe = getStripe();
    const user   = await User.findById(req.user._id);
    if (!stripe || !user.stripeCustomerId)
      return res.json({ success: true, active: false, trial: false, subscription: null });

    const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, limit: 1 });
    if (!subs.data.length)
      return res.json({ success: true, active: false, trial: false, subscription: null });

    const sub      = subs.data[0];
    const isTrial  = sub.status === "trialing";
    const isActive = sub.status === "active" || isTrial;
    res.json({
      success: true, active: isActive, trial: isTrial,
      subscription: {
        id: sub.id, status: sub.status,
        trialEnd:         sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtEnd:      sub.cancel_at_period_end,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/cancel
router.post("/cancel", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) return res.status(400).json({ success: false, message: "No subscription found" });

    const [a, t] = await Promise.all([
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active",   limit: 1 }),
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "trialing", limit: 1 }),
    ]);
    const sub = a.data[0] || t.data[0];
    if (!sub) return res.status(400).json({ success: false, message: "No active subscription" });

    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    res.json({
      success:    true,
      cancelDate: new Date(updated.current_period_end * 1000),
      wasTrial:   updated.status === "trialing",
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/portal
router.post("/portal", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) return res.status(400).json({ success: false, message: "No subscription found" });

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}`,
    });
    res.json({ success: true, url: session.url });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;