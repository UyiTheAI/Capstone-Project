const express  = require("express");
const router   = express.Router();
const User     = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

// Only init Stripe if key exists
const stripe = process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY)
  : null;

// ── GET /api/subscription/plan ────────────────────────────────────────────
router.get("/plan", (req, res) => {
  res.json({
    success: true,
    plan: {
      name:    "SHIFT-UP Pro",
      priceId: process.env.STRIPE_PRICE_ID,
      amount:  500,
      trial:   7,
    },
  });
});

// ── GET /api/subscription/status ─────────────────────────────────────────
router.get("/status", protect, async (req, res) => {
  try {
    if (!stripe) return res.json({ success: true, active: false, trial: false, subscription: null, orgCode: null });

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.json({ success: true, active: false, trial: false, subscription: null, orgCode: user.orgCode || null });

    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit:    1,
    });

    if (!subs.data.length)
      return res.json({ success: true, active: false, trial: false, subscription: null, orgCode: user.orgCode || null });

    const sub      = subs.data[0];
    const isTrial  = sub.status === "trialing";
    const isActive = sub.status === "active" || isTrial;

    res.json({
      success: true,
      active:  isActive,
      trial:   isTrial,
      orgCode: user.orgCode || null,
      subscription: {
        id:               sub.id,
        status:           sub.status,
        trialEnd:         sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtEnd:      sub.cancel_at_period_end,
      },
    });
  } catch (err) {
    console.error("Subscription status error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/checkout ──────────────────────────────────────
router.post("/checkout", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    if (!stripe)
      return res.status(400).json({ success: false, message: "Stripe not configured" });

    if (!process.env.STRIPE_PRICE_ID)
      return res.status(400).json({ success: false, message: "STRIPE_PRICE_ID not set in environment" });

    const user = await User.findById(req.user._id);

    // Create Stripe customer if not exists
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

    // Check if customer already had a trial
    const existingSubs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    const hadTrial = existingSubs.data.some(s => s.trial_start);

    const sessionConfig = {
      customer:             customerId,
      payment_method_types: ["card"],
      mode:                 "subscription",
      line_items:           [{ price: process.env.STRIPE_PRICE_ID, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/cancel`,
      metadata:    { userId: user._id.toString() },
    };

    // Add 7-day trial for first-time subscribers
    if (!hadTrial) {
      sessionConfig.subscription_data = { trial_period_days: 7 };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ success: true, url: session.url, hasTrial: !hadTrial });
  } catch (err) {
    console.error("Checkout error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/portal ────────────────────────────────────────
router.post("/portal", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.status(400).json({ success: false, message: "No subscription found" });

    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription`,
    });
    res.json({ success: true, url: session.url });
  } catch (err) {
    console.error("Portal error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/cancel ────────────────────────────────────────
router.post("/cancel", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.status(400).json({ success: false, message: "No subscription found" });

    // Check active or trialing
    const [activeSubs, trialSubs] = await Promise.all([
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active",   limit: 1 }),
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "trialing", limit: 1 }),
    ]);
    const sub = activeSubs.data[0] || trialSubs.data[0];
    if (!sub) return res.status(400).json({ success: false, message: "No active subscription" });

    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    res.json({
      success:    true,
      cancelDate: new Date(updated.current_period_end * 1000),
      wasTrial:   updated.status === "trialing",
    });
  } catch (err) {
    console.error("Cancel error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/subscription/orgcode ────────────────────────────────────────
router.get("/orgcode", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, orgCode: user.orgCode || null });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/verify-code ───────────────────────────────────
router.post("/verify-code", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code required" });
    const owner = await User.findOne({ orgCode: code, subscriptionStatus: "active" });
    if (!owner)
      return res.status(404).json({ success: false, message: "Invalid or expired organisation code. Ask your manager." });
    res.json({ success: true, message: "Valid code", ownerName: `${owner.firstName} ${owner.lastName}` });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

// ── POST /api/subscription/create-intent — for embedded Stripe Elements ──
router.post("/create-intent", protect, authorize("owner", "manager"), async (req, res) => {
  try {
    if (!stripe)
      return res.status(400).json({ success: false, message: "Stripe not configured" });
    if (!process.env.STRIPE_PRICE_ID)
      return res.status(400).json({ success: false, message: "STRIPE_PRICE_ID not set" });

    const user = await User.findById(req.user._id);

    // Create Stripe customer if not exists
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

    // Check if already had trial
    const existingSubs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    const hadTrial     = existingSubs.data.some(s => s.trial_start);

    // Create subscription with trial — returns client_secret for Elements
    const subscription = await stripe.subscriptions.create({
      customer: customerId,
      items:    [{ price: process.env.STRIPE_PRICE_ID }],
      payment_behavior:       "default_incomplete",
      payment_settings:       { save_default_payment_method: "on_subscription" },
      expand:                 ["latest_invoice.payment_intent"],
      trial_period_days:      hadTrial ? undefined : 7,
      metadata:               { userId: user._id.toString() },
    });

    const paymentIntent = subscription.latest_invoice?.payment_intent;
    const clientSecret  = paymentIntent?.client_secret;

    res.json({
      success:      true,
      clientSecret,
      subscriptionId: subscription.id,
      hasTrial:     !hadTrial,
    });
  } catch (err) {
    console.error("Create intent error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/activate — called after payment confirmed ──────
router.post("/activate", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.status(400).json({ success: false, message: "No customer found" });

    // Generate unique 6-digit org code
    let orgCode, exists;
    do {
      orgCode = Math.floor(100000 + Math.random() * 900000).toString();
      exists  = await User.findOne({ orgCode });
    } while (exists);

    await User.findByIdAndUpdate(req.user._id, {
      subscriptionStatus: "active",
      subscriptionPlan:   "pro",
      orgCode,
    });

    res.json({ success: true, orgCode });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});