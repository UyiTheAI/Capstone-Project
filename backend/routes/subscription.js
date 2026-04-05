const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize, generateToken } = require("../middleware/auth");

const getStripe = () => process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

// ── Email helper ───────────────────────────────────────────────────────────
const sendEmail = async ({ to, subject, html }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.log(`⚠️  Email not configured. Skipping: ${subject} → ${to}`);
    return;
  }
  const nodemailer  = require("nodemailer");
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
  });
  await transporter.sendMail({ from: `"SHIFT-UP" <${process.env.EMAIL_USER}>`, to, subject, html });
  console.log(`✅ Email sent → ${to}: ${subject}`);
};

const emailBase = (content) => `
  <div style="font-family:'DM Sans',Arial,sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;border:1px solid #eee">
    <div style="background:#1a1a1a;padding:28px 36px;text-align:center">
      <div style="font-size:26px;font-weight:900;color:#f5b800;letter-spacing:2px">SHIFT-UP</div>
      <div style="color:#888;font-size:12px;margin-top:4px">Workforce Management</div>
    </div>
    <div style="padding:36px">${content}</div>
    <div style="background:#f9f9f7;padding:16px 36px;text-align:center;font-size:11px;color:#aaa">
      © ${new Date().getFullYear()} SHIFT-UP. All rights reserved.
    </div>
  </div>`;

// ── GET /api/subscription/plan ─────────────────────────────────────────────
router.get("/plan", (req, res) => {
  res.json({ success: true, plan: { name: "SHIFT-UP Pro", priceId: process.env.STRIPE_PRICE_ID, amount: 500, trial: 7 } });
});

// ── POST /api/subscription/setup-intent (public) ──────────────────────────
// Creates Stripe customer + SetupIntent (no auth needed, no charge yet)
router.post("/setup-intent", async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });

    const { email, firstName, lastName } = req.body;
    if (!email) return res.status(400).json({ success: false, message: "Email required" });

    // Find or create Stripe customer
    let customer;
    const existing = await stripe.customers.list({ email, limit: 1 });
    customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email, name: `${firstName||""} ${lastName||""}`.trim() });

    // Create SetupIntent — saves card without charging
    const setupIntent = await stripe.setupIntents.create({
      customer:             customer.id,
      payment_method_types: ["card"],
      usage:                "off_session",
    });

    res.json({ success: true, clientSecret: setupIntent.client_secret, customerId: customer.id });
  } catch (err) {
    console.error("Setup intent error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/register-and-activate (public) ─────────────────
// Called AFTER card saved — registers owner in DB and starts trial
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

    if (await User.findOne({ email }))
      return res.status(400).json({ success: false, message: "Email already registered. Please sign in." });

    // Set default payment method on customer
    if (paymentMethodId) {
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method: paymentMethodId },
      });
    }

    // Create Stripe subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer:          customerId,
      items:             [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 7,
    });

    const trialEnd = new Date(subscription.trial_end * 1000);

    // Create owner in DB
    const user = await User.create({
      firstName, lastName, email, password,
      role: "owner", position: "Owner", availability: "Full-Time",
      subscriptionStatus: "active", subscriptionPlan: "pro",
      stripeCustomerId: customerId,
    });

    // Send welcome + credentials email
    const FRONT = process.env.FRONTEND_URL || "http://localhost:3000";
    await sendEmail({
      to:      email,
      subject: "🎉 Welcome to SHIFT-UP — Your Account & Trial Details",
      html: emailBase(`
        <h2 style="color:#1a1a1a;margin:0 0 8px">Welcome to SHIFT-UP, ${firstName}!</h2>
        <p style="color:#555;line-height:1.7;margin:0 0 20px">Your account has been created and your 7-day free trial has started. Here are your login details:</p>

        <div style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:20px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">Your Login Credentials</div>
          <table style="width:100%;border-collapse:collapse">
            <tr><td style="padding:6px 0;font-size:13px;color:#888;width:120px">Email</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1a1a">${email}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#888">Password</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1a1a">${password}</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#888">Role</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1a1a">Owner</td></tr>
            <tr><td style="padding:6px 0;font-size:13px;color:#888">Portal</td><td style="padding:6px 0;font-size:13px;font-weight:700;color:#1a1a1a">Owner Portal</td></tr>
          </table>
        </div>

        <div style="background:#f0fdf4;border:1px solid #86efac;border-radius:12px;padding:16px;margin-bottom:20px">
          <div style="font-weight:700;color:#16a34a;margin-bottom:6px">🎁 7-Day Free Trial Active</div>
          <div style="font-size:13px;color:#16a34a">Your card will be charged $5 CAD/month after <strong>${trialEnd.toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" })}</strong>. Cancel anytime in your profile.</div>
        </div>

        <div style="margin-bottom:20px">
          <div style="font-size:12px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:10px">Get Started</div>
          <div style="font-size:13px;color:#555;line-height:2">
            1. Log in at the Owner portal<br/>
            2. Go to <strong>Register Staff</strong> to add your team<br/>
            3. Add shifts in the <strong>Schedule</strong> tab<br/>
            4. Publish shifts to notify your staff
          </div>
        </div>

        <a href="${FRONT}" style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:16px;border-radius:10px;text-decoration:none">
          Log In to SHIFT-UP →
        </a>
        <p style="font-size:12px;color:#aaa;text-align:center;margin-top:16px">Keep this email safe — it contains your login credentials.</p>
      `),
    });

    res.json({
      success: true,
      message: "Account created and trial started. Check your email for login details.",
      token:   generateToken(user._id),
      user: { id: user._id, firstName: user.firstName, lastName: user.lastName, email: user.email, role: user.role, subscriptionStatus: user.subscriptionStatus },
    });
  } catch (err) {
    console.error("Register and activate error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET /api/subscription/status ──────────────────────────────────────────
router.get("/status", protect, async (req, res) => {
  try {
    const stripe = getStripe();
    const user   = await User.findById(req.user._id);
    if (!stripe || !user.stripeCustomerId)
      return res.json({ success: true, active: false, trial: false, subscription: null });

    const subs = await stripe.subscriptions.list({ customer: user.stripeCustomerId, limit: 1 });
    if (!subs.data.length)
      return res.json({ success: true, active: false, trial: false, subscription: null });

    const sub     = subs.data[0];
    const isTrial = sub.status === "trialing";
    res.json({
      success: true,
      active:  sub.status === "active" || isTrial,
      trial:   isTrial,
      subscription: {
        id:               sub.id,
        status:           sub.status,
        trialEnd:         sub.trial_end ? new Date(sub.trial_end * 1000) : null,
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
        cancelAtEnd:      sub.cancel_at_period_end,
      },
    });
  } catch (err) { res.status(500).json({ success: false, message: err.message }); }
});

// ── POST /api/subscription/cancel ─────────────────────────────────────────
router.post("/cancel", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success: false, message: "Stripe not configured" });

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.status(400).json({ success: false, message: "No subscription found" });

    // Find active or trialing subscription
    const [active, trialing] = await Promise.all([
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "active",   limit: 1 }),
      stripe.subscriptions.list({ customer: user.stripeCustomerId, status: "trialing", limit: 1 }),
    ]);
    const sub = active.data[0] || trialing.data[0];
    if (!sub) return res.status(400).json({ success: false, message: "No active subscription found" });

    // Cancel at end of period (not immediately)
    const updated    = await stripe.subscriptions.update(sub.id, { cancel_at_period_end: true });
    const cancelDate = new Date(updated.current_period_end * 1000);
    const wasTrial   = updated.status === "trialing";

    // Update user status
    await User.findByIdAndUpdate(req.user._id, { subscriptionStatus: "cancelled" });

    // Send cancellation email
    await sendEmail({
      to:      user.email,
      subject: "Your SHIFT-UP Subscription Has Been Cancelled",
      html: emailBase(`
        <h2 style="color:#1a1a1a;margin:0 0 8px">Subscription Cancelled</h2>
        <p style="color:#555;line-height:1.7;margin:0 0 20px">Hi ${user.firstName}, your SHIFT-UP subscription has been cancelled.</p>

        <div style="background:#fff8e1;border:1px solid #ffe082;border-radius:12px;padding:16px;margin-bottom:20px">
          <div style="font-weight:700;color:#92400e;margin-bottom:6px">⏰ Access Until ${cancelDate.toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" })}</div>
          <div style="font-size:13px;color:#92400e">
            ${wasTrial
              ? "Your trial has been cancelled. No charge will be made to your card."
              : `You have full access until ${cancelDate.toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" })}. No further charges will be made.`}
          </div>
        </div>

        <div style="background:#f9f9f7;border-radius:12px;padding:16px;margin-bottom:20px;font-size:13px;color:#555;line-height:1.8">
          <strong>What happens next:</strong><br/>
          • Your team's data remains intact until the end date<br/>
          • Staff will lose access after the subscription ends<br/>
          • You can reactivate at any time by contacting support
        </div>

        <p style="font-size:12px;color:#aaa;text-align:center">Changed your mind? Contact us to reactivate your subscription.</p>
      `),
    });

    res.json({
      success:    true,
      message:    `Subscription cancelled. Access continues until ${cancelDate.toLocaleDateString()}.`,
      cancelDate,
      wasTrial,
    });
  } catch (err) {
    console.error("Cancel subscription error:", err.message);
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST /api/subscription/webhook ────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(400).json({ message: "Stripe not configured" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      req.headers["stripe-signature"],
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    if (event.type === "invoice.payment_succeeded") {
      await User.findOneAndUpdate({ stripeCustomerId: event.data.object.customer }, { subscriptionStatus: "active" });
    }
    if (event.type === "customer.subscription.deleted") {
      await User.findOneAndUpdate({ stripeCustomerId: event.data.object.customer }, { subscriptionStatus: "cancelled", subscriptionPlan: "free" });
    }
  } catch (err) { console.error("Webhook handler error:", err.message); }

  res.json({ received: true });
});

module.exports = router;