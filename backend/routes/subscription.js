const express  = require("express");
const router   = express.Router();
const stripe   = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User     = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const PLAN = {
  name:        "SHIFT-UP Pro",
  priceId:     process.env.STRIPE_PRICE_ID,
  amount:      500,   // $5 CAD in cents
  currency:    "CAD",
  description: "Full access to all features — unlimited employees",
  features: [
    "Schedule management",
    "Shift swap requests",
    "Staff reports & analytics",
    "Employee overview",
    "Tip manager",
    "Google / Apple login",
    "Notifications",
    "CSV export",
    "9 language support",
  ],
};

// ── GET /api/subscription/plan ────────────────────────────────────────────
router.get("/plan", (req, res) => {
  res.json({ success: true, plan: PLAN });
});

// ── GET /api/subscription/status ─────────────────────────────────────────
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) {
      return res.json({ success: true, active: false, subscription: null });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status:   "active",
      limit:    1,
    });

    if (!subscriptions.data.length) {
      return res.json({ success: true, active: false, subscription: null });
    }

    const sub = subscriptions.data[0];
    res.json({
      success: true,
      active: true,
      subscription: {
        id:               sub.id,
        status:           sub.status,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtEnd:      sub.cancel_at_period_end,
      },
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/checkout ──────────────────────────────────────
router.post("/checkout", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    if (!PLAN.priceId) {
      return res.status(400).json({ success: false, message: "Stripe price ID not configured. Add STRIPE_PRICE_ID to .env" });
    }

    const user = await User.findById(req.user._id);

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email:    user.email,
        name:     `${user.firstName} ${user.lastName}`,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    const session = await stripe.checkout.sessions.create({
      customer:             customerId,
      payment_method_types: ["card"],
      mode:                 "subscription",
      line_items: [{ price: PLAN.priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/cancel`,
      metadata:    { userId: user._id.toString() },
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/portal ────────────────────────────────────────
router.post("/portal", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ success: false, message: "No active subscription found" });
    }

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription`,
    });

    res.json({ success: true, url: session.url });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/cancel ────────────────────────────────────────
router.post("/cancel", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId) {
      return res.status(400).json({ success: false, message: "No subscription found" });
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      status:   "active",
      limit:    1,
    });

    if (!subscriptions.data.length) {
      return res.status(400).json({ success: false, message: "No active subscription" });
    }

    const updated = await stripe.subscriptions.update(subscriptions.data[0].id, {
      cancel_at_period_end: true,
    });

    res.json({
      success:    true,
      message:    "Subscription will cancel at end of billing period",
      cancelDate: new Date(updated.current_period_end * 1000),
    });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;