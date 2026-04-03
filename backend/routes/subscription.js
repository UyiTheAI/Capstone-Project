const express  = require("express");
const router   = express.Router();
const stripe   = require("stripe")(process.env.STRIPE_SECRET_KEY);
const User     = require("../models/User");
const { protect, authorize } = require("../middleware/auth");

const PLAN = {
  name:    "SHIFT-UP Pro",
  priceId: process.env.STRIPE_PRICE_ID,
  amount:  500,
  trial:   7, // 7-day free trial
};

async function generateOrgCode() {
  let code, exists;
  do {
    code   = Math.floor(100000 + Math.random() * 900000).toString();
    exists = await User.findOne({ orgCode: code });
  } while (exists);
  return code;
}

// GET /api/subscription/plan
router.get("/plan", (req, res) => res.json({ success: true, plan: PLAN }));

// GET /api/subscription/status
router.get("/status", protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.json({ success: true, active: false, trial: false, subscription: null, orgCode: null });

    const subs = await stripe.subscriptions.list({
      customer: user.stripeCustomerId,
      limit:    1,
      expand:   ["data.default_payment_method"],
    });

    if (!subs.data.length)
      return res.json({ success: true, active: false, trial: false, subscription: null, orgCode: user.orgCode });

    const sub       = subs.data[0];
    const isTrial   = sub.status === "trialing";
    const isActive  = sub.status === "active" || isTrial;

    res.json({
      success:  true,
      active:   isActive,
      trial:    isTrial,
      orgCode:  user.orgCode,
      subscription: {
        id:               sub.id,
        status:           sub.status,
        trialEnd:         sub.trial_end   ? new Date(sub.trial_end   * 1000) : null,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtEnd:      sub.cancel_at_period_end,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/checkout — with 7-day trial
router.post("/checkout", protect, authorize("owner","manager"), async (req, res) => {
  try {
    if (!PLAN.priceId)
      return res.status(400).json({ success: false, message: "Stripe price ID not configured" });

    const user = await User.findById(req.user._id);

    // Check if user already had a trial
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email, name: user.name,
        metadata: { userId: user._id.toString() },
      });
      customerId = customer.id;
      user.stripeCustomerId = customerId;
      await user.save();
    }

    // Check if customer already used a trial
    const existingSubs = await stripe.subscriptions.list({ customer: customerId, limit: 10 });
    const hadTrial = existingSubs.data.some(s => s.trial_start);

    const sessionConfig = {
      customer:             customerId,
      payment_method_types: ["card"],
      mode:                 "subscription",
      line_items:           [{ price: PLAN.priceId, quantity: 1 }],
      success_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url:  `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription/cancel`,
      metadata:    { userId: user._id.toString() },
    };

    // Add trial only for first-time subscribers
    if (!hadTrial) {
      sessionConfig.subscription_data = { trial_period_days: PLAN.trial };
    }

    const session = await stripe.checkout.sessions.create(sessionConfig);
    res.json({ success: true, url: session.url, hasTrial: !hadTrial });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/portal
router.post("/portal", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.status(400).json({ success: false, message: "No subscription found" });
    const session = await stripe.billingPortal.sessions.create({
      customer:   user.stripeCustomerId,
      return_url: `${process.env.FRONTEND_URL || "http://localhost:3000"}/subscription`,
    });
    res.json({ success: true, url: session.url });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/cancel
router.post("/cancel", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.status(400).json({ success: false, message: "No subscription found" });

    const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active", limit: 1 });
    // Also check trialing
    const trialSubs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "trialing", limit: 1 });
    const sub = subs.data[0] || trialSubs.data[0];

    if (!sub) return res.status(400).json({ success: false, message: "No active subscription" });

    const updated = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    res.json({
      success:    true,
      cancelDate: new Date(updated.current_period_end * 1000),
      wasTrial:   updated.status === "trialing",
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// GET /api/subscription/orgcode
router.get("/orgcode", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    res.json({ success: true, orgCode: user.orgCode });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// POST /api/subscription/verify-code
router.post("/verify-code", async (req, res) => {
  try {
    const { code } = req.body;
    if (!code) return res.status(400).json({ success: false, message: "Code required" });
    const owner = await User.findOne({ orgCode: code, subscriptionStatus: "active" });
    if (!owner)
      return res.status(404).json({ success: false, message: "Invalid or expired code. Ask your manager for the code." });
    res.json({ success: true, message: "Valid code", ownerName: owner.name });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

module.exports = router;