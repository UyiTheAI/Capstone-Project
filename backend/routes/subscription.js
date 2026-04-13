const express = require("express");
const router  = express.Router();
const User    = require("../models/User");
const { protect, authorize, generateToken } = require("../middleware/auth");
const { sendEmail, emailWrapper } = require("../utils/sendEmail");

const getStripe = () => process.env.STRIPE_SECRET_KEY
  ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;

const fmtDate = (d) => new Date(d).toLocaleDateString("en-CA", { year:"numeric", month:"long", day:"numeric" });
const randomId = () => Math.floor(Math.random()*9000+1000);

// ── GET /api/subscription/plan ────────────────────────────────────────────
router.get("/plan", (req, res) => {
  res.json({ success:true, plan:{ name:"SHIFT-UP Pro", priceId:process.env.STRIPE_PRICE_ID, amount:500, trial:7 } });
});

// ── POST /api/subscription/setup-intent ──────────────────────────────────
router.post("/setup-intent", async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success:false, message:"Stripe not configured" });
    const { email, firstName, lastName } = req.body;
    if (!email) return res.status(400).json({ success:false, message:"Email required" });

    // Find or create customer
    let customer;
    const existing = await stripe.customers.list({ email, limit:1 });
    customer = existing.data.length > 0
      ? existing.data[0]
      : await stripe.customers.create({ email, name:`${firstName||""} ${lastName||""}`.trim() });

    // Cancel stale incomplete SetupIntents
    try {
      const old = await stripe.setupIntents.list({ customer:customer.id, limit:5 });
      for (const si of old.data) {
        if (["requires_payment_method","requires_confirmation"].includes(si.status)) {
          await stripe.setupIntents.cancel(si.id);
        }
      }
    } catch(e) { console.log("Could not cancel old SetupIntents:", e.message); }

    // Fresh SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer:             customer.id,
      payment_method_types: ["card"],
      usage:                "off_session",
    });

    res.json({ success:true, clientSecret:setupIntent.client_secret, customerId:customer.id, setupIntentId:setupIntent.id });
  } catch(err) {
    console.error("Setup intent error:", err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ── POST /api/subscription/register-and-activate ──────────────────────────
router.post("/register-and-activate", async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success:false, message:"Stripe not configured" });
    if (!process.env.STRIPE_PRICE_ID) return res.status(400).json({ success:false, message:"STRIPE_PRICE_ID not set" });

    const { firstName, lastName, email, password, customerId, paymentMethodId, setupIntentId } = req.body;
    if (!firstName || !lastName || !email || !password)
      return res.status(400).json({ success:false, message:"All fields required" });
    if (!customerId)
      return res.status(400).json({ success:false, message:"Customer ID required" });
    if (await User.findOne({ email }))
      return res.status(400).json({ success:false, message:"Email already registered. Please sign in." });

    // Get actual PM from SetupIntent (most reliable in live mode)
    let finalPMId = paymentMethodId;
    if (setupIntentId) {
      try {
        const si = await stripe.setupIntents.retrieve(setupIntentId);
        if (si.payment_method) finalPMId = si.payment_method;
      } catch(e) { console.log("Could not retrieve setupIntent:", e.message); }
    }

    // Attach PM to customer
    if (finalPMId) {
      try {
        await stripe.paymentMethods.attach(finalPMId, { customer:customerId });
        console.log(`✅ PM ${finalPMId} attached to ${customerId}`);
      } catch(e) {
        if (!e.message?.includes("already been attached")) console.error("Attach error:", e.message);
      }
      await stripe.customers.update(customerId, {
        invoice_settings: { default_payment_method:finalPMId },
      });
    }

    // Create subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer:          customerId,
      items:             [{ price:process.env.STRIPE_PRICE_ID }],
      trial_period_days: 7,
    });

    const trialEnd = new Date(subscription.trial_end * 1000);
    const now      = new Date();
    const receiptNo= `SU-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${randomId()}`;

    // Create owner in DB
    const user = await User.create({
      firstName, lastName, email, password,
      role:"owner", position:"Owner", availability:"Full-Time",
      subscriptionStatus:"active", subscriptionPlan:"pro",
      stripeCustomerId:customerId,
    });

    // Set orgOwner to self — so status checks work for all org members
    await User.findByIdAndUpdate(user._id, { orgOwner: user._id });

    // ── Send receipt + welcome email ──────────────────────────────────────
    const FRONT = process.env.FRONTEND_URL || "http://localhost:3000";

    await sendEmail({
      to:      email,
      subject: `🧾 Receipt #${receiptNo} — SHIFT-UP Trial Started`,
      html: emailWrapper(`
        <!-- Receipt heading -->
        <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:24px">
          <div>
            <h2 style="margin:0 0 4px;font-size:22px;color:#1a1a1a">Payment Receipt</h2>
            <div style="font-size:12px;color:#aaa">Receipt #${receiptNo}</div>
          </div>
          <div style="text-align:right">
            <div style="font-size:11px;color:#aaa;text-transform:uppercase;letter-spacing:.5px">Date</div>
            <div style="font-size:13px;font-weight:700;color:#1a1a1a">${fmtDate(now)}</div>
          </div>
        </div>

        <!-- Amount charged today -->
        <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;padding:24px;margin-bottom:24px;text-align:center">
          <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Amount Charged Today</div>
          <div style="font-size:52px;font-weight:900;color:#16a34a;line-height:1">$0.00</div>
          <div style="font-size:13px;color:#16a34a;margin-top:6px">CAD · 7-Day Free Trial</div>
        </div>

        <!-- Order details -->
        <div style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Order Details</div>
          <table style="width:100%;border-collapse:collapse">
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Plan</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">SHIFT-UP Pro</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Billing Cycle</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">Monthly</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Trial Period</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#16a34a;text-align:right">7 Days Free</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Trial Start</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${fmtDate(now)}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Trial Ends</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${fmtDate(trialEnd)}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">First Charge</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">$5.00 CAD on ${fmtDate(trialEnd)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#888">Billed To</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${email}</td>
            </tr>
          </table>
          <div style="border-top:2px solid #eee;margin-top:14px;padding-top:14px;display:flex;justify-content:space-between;align-items:center">
            <span style="font-size:15px;font-weight:800;color:#1a1a1a">Total Charged Today</span>
            <span style="font-size:22px;font-weight:900;color:#16a34a">$0.00 CAD</span>
          </div>
        </div>

        <!-- Login credentials -->
        <div style="background:#1a1a1a;border-radius:12px;padding:20px;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#f5b800;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">🔐 Your Login Credentials</div>
          <table style="width:100%;border-collapse:collapse">
            <tr>
              <td style="padding:7px 0;font-size:13px;color:#888;width:110px">Name</td>
              <td style="padding:7px 0;font-size:13px;font-weight:700;color:#fff">${firstName} ${lastName}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;font-size:13px;color:#888">Email</td>
              <td style="padding:7px 0;font-size:13px;font-weight:700;color:#fff">${email}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;font-size:13px;color:#888">Password</td>
              <td style="padding:7px 0;font-size:13px;font-weight:700;color:#fff">${password}</td>
            </tr>
            <tr>
              <td style="padding:7px 0;font-size:13px;color:#888">Role</td>
              <td style="padding:7px 0;font-size:13px;font-weight:700;color:#f5b800">Owner</td>
            </tr>
          </table>
          <div style="margin-top:12px;padding:10px 14px;background:rgba(245,184,0,.12);border-radius:8px;font-size:12px;color:#f5b800;line-height:1.6">
            ⚠️ Save this email — it contains your login credentials.<br/>
            Change your password after first login from Profile → Password tab.
          </div>
        </div>

        <!-- Get started steps -->
        <div style="margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Get Started in 3 Steps</div>
          ${[
            ["1","Log in via the Owner portal",          "Use your email and password above"],
            ["2","Register your team",                   "Go to Register Staff to add managers and employees"],
            ["3","Build and publish your schedule",      "Create shifts and publish to notify your team instantly"],
          ].map(([n,title,desc]) => `
            <div style="display:flex;gap:14px;align-items:flex-start;margin-bottom:14px">
              <div style="width:28px;height:28px;border-radius:50%;background:#f5b800;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px;color:#1a1a1a;flex-shrink:0">${n}</div>
              <div>
                <div style="font-size:14px;font-weight:700;color:#1a1a1a">${title}</div>
                <div style="font-size:12px;color:#888;margin-top:2px">${desc}</div>
              </div>
            </div>
          `).join("")}
        </div>

        <!-- CTA button -->
        <a href="${FRONT}" style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:16px 24px;border-radius:12px;text-decoration:none;margin-bottom:20px">
          Log In to SHIFT-UP →
        </a>

        <!-- Cancel note -->
        <div style="text-align:center;font-size:12px;color:#aaa;line-height:1.9">
          You can cancel anytime before <strong>${fmtDate(trialEnd)}</strong> from <strong>Profile → Subscription</strong>.<br/>
          No charge will be made if cancelled before the trial ends.<br/>
          Questions? Reply to this email or contact support.
        </div>
      `),
    });

    res.json({
      success: true,
      message: "Account created and trial started. Check your email for your receipt and login details.",
      token:   generateToken(user._id),
      user:    { id:user._id, firstName:user.firstName, lastName:user.lastName, email:user.email, role:user.role, subscriptionStatus:user.subscriptionStatus },
    });
  } catch(err) {
    console.error("Register and activate error:", err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ── GET /api/subscription/status ──────────────────────────────────────────
router.get("/status", protect, async (req, res) => {
  try {
    const stripe = getStripe();
    let   user   = await User.findById(req.user._id);

    // For managers and employees — look up their org owner
    if (user.role !== "owner") {
      const ownerId = user.orgOwner || user.createdBy;
      if (!ownerId) return res.json({ success:true, active:true, trial:false, subscription:null });
      user = await User.findById(ownerId);
      if (!user) return res.json({ success:true, active:true, trial:false, subscription:null });
    }

    if (!stripe || !user.stripeCustomerId)
      return res.json({ success:true, active:false, trial:false, subscription:null });

    const subs = await stripe.subscriptions.list({ customer:user.stripeCustomerId, limit:1 });
    if (!subs.data.length)
      return res.json({ success:true, active:false, trial:false, subscription:null });

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
  } catch(err) { res.status(500).json({ success:false, message:err.message }); }
});

// ── POST /api/subscription/cancel ─────────────────────────────────────────
router.post("/cancel", protect, authorize("owner","manager"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success:false, message:"Stripe not configured" });

    const user = await User.findById(req.user._id);
    if (!user.stripeCustomerId)
      return res.status(400).json({ success:false, message:"No subscription found" });

    const [active, trialing] = await Promise.all([
      stripe.subscriptions.list({ customer:user.stripeCustomerId, status:"active",   limit:1 }),
      stripe.subscriptions.list({ customer:user.stripeCustomerId, status:"trialing", limit:1 }),
    ]);
    const sub = active.data[0] || trialing.data[0];
    if (!sub) return res.status(400).json({ success:false, message:"No active subscription found" });

    const updated  = await stripe.subscriptions.update(sub.id, { cancel_at_period_end:true });
    const endDate  = new Date(updated.current_period_end * 1000);
    const wasTrial = updated.status === "trialing";

    await User.findByIdAndUpdate(req.user._id, { subscriptionStatus:"cancelled" });

    // ── Send cancellation confirmation email ──────────────────────────────
    await sendEmail({
      to:      user.email,
      subject: "Your SHIFT-UP Subscription Has Been Cancelled",
      html: emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">Subscription Cancelled</h2>
        <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 24px">
          Hi ${user.firstName}, we've confirmed your SHIFT-UP subscription cancellation.
        </p>

        <!-- Status banner -->
        <div style="background:#fff8e1;border:1.5px solid #ffe082;border-radius:12px;padding:18px 20px;margin-bottom:24px">
          <div style="font-weight:800;font-size:15px;color:#92400e;margin-bottom:6px">
            ⏰ Access Continues Until ${fmtDate(endDate)}
          </div>
          <div style="font-size:13px;color:#92400e;line-height:1.7">
            ${wasTrial
              ? "Your trial has been cancelled. No charge has been made to your card."
              : `You have full access to SHIFT-UP until <strong>${fmtDate(endDate)}</strong>. No further charges will be made.`}
          </div>
        </div>

        <!-- Details -->
        <div style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Cancellation Details</div>
          <table style="width:100%;border-collapse:collapse">
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Account</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${user.email}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Cancellation Date</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${fmtDate(new Date())}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Access Until</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${fmtDate(endDate)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#888">Further Charges</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#16a34a;text-align:right">None</td>
            </tr>
          </table>
        </div>

        <!-- What happens next -->
        <div style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:12px">What Happens Next</div>
          ${[
            ["📅", "Full access until " + fmtDate(endDate)],
            ["👥", "Your team's data remains intact until the subscription ends"],
            ["🔒", "Staff will lose portal access after the subscription period"],
            ["↩️",  "You can reactivate by signing up again anytime"],
          ].map(([icon,text]) => `
            <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px;font-size:13px;color:#555">
              <span>${icon}</span><span>${text}</span>
            </div>
          `).join("")}
        </div>

        <div style="text-align:center;font-size:12px;color:#aaa;line-height:1.8">
          Changed your mind? You can sign up again at any time.<br/>
          Questions? Reply to this email.
        </div>
      `),
    });

    res.json({
      success:    true,
      message:    `Subscription cancelled. Access continues until ${fmtDate(endDate)}.`,
      cancelDate: endDate,
      wasTrial,
    });
  } catch(err) {
    console.error("Cancel subscription error:", err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ── POST /api/subscription/webhook ────────────────────────────────────────
router.post("/webhook", async (req, res) => {
  const stripe = getStripe();
  if (!stripe) return res.status(400).json({ message:"Stripe not configured" });

  let event;
  try {
    event = stripe.webhooks.constructEvent(
      req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch(err) { return res.status(400).send(`Webhook Error: ${err.message}`); }

  try {
    if (event.type === "invoice.payment_succeeded") {
      const user = await User.findOneAndUpdate(
        { stripeCustomerId:event.data.object.customer },
        { subscriptionStatus:"active" }, { new:true }
      );
      if (user) {
        // Send payment success email
        await sendEmail({
          to:      user.email,
          subject: "✅ SHIFT-UP — Payment Successful",
          html: emailWrapper(`
            <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">Payment Successful</h2>
            <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 20px">
              Hi ${user.firstName}, your SHIFT-UP subscription has been renewed.
            </p>
            <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:12px;padding:18px;margin-bottom:20px;text-align:center">
              <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;margin-bottom:6px">Amount Charged</div>
              <div style="font-size:40px;font-weight:900;color:#16a34a">$5.00 CAD</div>
            </div>
            <div style="background:#f9f9f7;border-radius:12px;padding:16px;font-size:13px;color:#555;line-height:1.8">
              Your SHIFT-UP Pro plan is active. Your team has full access to all features.
            </div>
          `),
        });
      }
    }
    if (event.type === "customer.subscription.deleted") {
      await User.findOneAndUpdate(
        { stripeCustomerId:event.data.object.customer },
        { subscriptionStatus:"cancelled", subscriptionPlan:"free" }
      );
    }
    if (event.type === "invoice.payment_failed") {
      const user = await User.findOne({ stripeCustomerId:event.data.object.customer });
      if (user) {
        await sendEmail({
          to:      user.email,
          subject: "⚠️ SHIFT-UP — Payment Failed",
          html: emailWrapper(`
            <h2 style="margin:0 0 8px;font-size:22px;color:#dc2626">Payment Failed</h2>
            <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 20px">
              Hi ${user.firstName}, we were unable to process your SHIFT-UP subscription payment.
            </p>
            <div style="background:#fee2e2;border:1.5px solid #fca5a5;border-radius:12px;padding:18px;margin-bottom:20px;font-size:13px;color:#dc2626;line-height:1.7">
              Please update your payment method to avoid losing access to your account and your team's data.
            </div>
            <a href="${process.env.FRONTEND_URL||"https://shift-up.netlify.app"}" style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:14px;border-radius:12px;text-decoration:none">
              Update Payment Method →
            </a>
          `),
        });
      }
    }
  } catch(err) { console.error("Webhook handler error:", err.message); }

  res.json({ received:true });
});

// ── POST /api/subscription/resubscribe ────────────────────────────────────
// Called when an owner with an inactive subscription wants to resubscribe.
// Creates a new SetupIntent so they can enter card details again.
router.post("/resubscribe", protect, authorize("owner"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success:false, message:"Stripe not configured" });
    if (!process.env.STRIPE_PRICE_ID) return res.status(400).json({ success:false, message:"STRIPE_PRICE_ID not set" });

    const user = await User.findById(req.user._id);

    // Get or create Stripe customer
    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripe.customers.create({
        email: user.email,
        name:  `${user.firstName||""} ${user.lastName||""}`.trim(),
      });
      customerId = customer.id;
      await User.findByIdAndUpdate(user._id, { stripeCustomerId: customerId });
    }

    // Cancel any stale SetupIntents
    try {
      const old = await stripe.setupIntents.list({ customer:customerId, limit:5 });
      for (const si of old.data) {
        if (["requires_payment_method","requires_confirmation"].includes(si.status)) {
          await stripe.setupIntents.cancel(si.id);
        }
      }
    } catch(e) { console.log("Could not cancel old SetupIntents:", e.message); }

    // Create a new SetupIntent
    const setupIntent = await stripe.setupIntents.create({
      customer:             customerId,
      payment_method_types: ["card"],
      usage:                "off_session",
    });

    res.json({
      success:       true,
      clientSecret:  setupIntent.client_secret,
      customerId,
      setupIntentId: setupIntent.id,
    });
  } catch(err) {
    console.error("Resubscribe setup-intent error:", err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});

// ── POST /api/subscription/activate ───────────────────────────────────────
// Completes resubscription after Stripe card confirmed.
router.post("/activate", protect, authorize("owner"), async (req, res) => {
  try {
    const stripe = getStripe();
    if (!stripe) return res.status(400).json({ success:false, message:"Stripe not configured" });

    const { customerId, paymentMethodId, setupIntentId } = req.body;
    const user = await User.findById(req.user._id);
    const cid  = customerId || user.stripeCustomerId;

    // Get actual PM from SetupIntent
    let finalPMId = paymentMethodId;
    if (setupIntentId) {
      try {
        const si = await stripe.setupIntents.retrieve(setupIntentId);
        if (si.payment_method) finalPMId = si.payment_method;
      } catch(e) { console.log("Could not retrieve setupIntent:", e.message); }
    }

    // Attach PM and set as default
    if (finalPMId) {
      try {
        await stripe.paymentMethods.attach(finalPMId, { customer:cid });
      } catch(e) {
        if (!e.message?.includes("already been attached")) throw e;
      }
      await stripe.customers.update(cid, {
        invoice_settings: { default_payment_method: finalPMId },
      });
    }

    // Create new subscription with 7-day trial
    const subscription = await stripe.subscriptions.create({
      customer:          cid,
      items:             [{ price: process.env.STRIPE_PRICE_ID }],
      trial_period_days: 7,
    });

    const trialEnd  = new Date(subscription.trial_end * 1000);
    const now       = new Date();
    const receiptNo = `SU-RE-${now.getFullYear()}${String(now.getMonth()+1).padStart(2,"0")}${String(now.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9000+1000)}`;

    // Update user subscription status
    await User.findByIdAndUpdate(user._id, {
      subscriptionStatus: "active",
      subscriptionPlan:   "pro",
      stripeCustomerId:   cid,
    });

    // ── Send resubscription confirmation email ────────────────────────────
    await sendEmail({
      to:      user.email,
      subject: `✅ SHIFT-UP Subscription Reactivated — ${receiptNo}`,
      html: emailWrapper(`
        <h2 style="margin:0 0 8px;font-size:22px;color:#1a1a1a">Subscription Reactivated!</h2>
        <p style="color:#666;font-size:14px;line-height:1.7;margin:0 0 20px">
          Hi ${user.firstName}, your SHIFT-UP subscription has been successfully reactivated.
          Your team now has full access to all features.
        </p>

        <!-- Amount today -->
        <div style="background:#f0fdf4;border:1.5px solid #86efac;border-radius:14px;padding:24px;margin-bottom:24px;text-align:center">
          <div style="font-size:11px;font-weight:700;color:#16a34a;text-transform:uppercase;letter-spacing:1px;margin-bottom:8px">Charged Today</div>
          <div style="font-size:52px;font-weight:900;color:#16a34a;line-height:1">$0.00</div>
          <div style="font-size:13px;color:#16a34a;margin-top:6px">CAD · 7-Day Free Trial</div>
        </div>

        <!-- Details -->
        <div style="background:#f9f9f7;border-radius:12px;padding:20px;margin-bottom:24px">
          <div style="font-size:11px;font-weight:700;color:#aaa;text-transform:uppercase;letter-spacing:1px;margin-bottom:14px">Subscription Details</div>
          <table style="width:100%;border-collapse:collapse">
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Receipt</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${receiptNo}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Account</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${user.email}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Plan</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">SHIFT-UP Pro</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Trial Start</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${fmtDate(now)}</td>
            </tr>
            <tr style="border-bottom:1px solid #eee">
              <td style="padding:8px 0;font-size:13px;color:#888">Trial Ends</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">${fmtDate(trialEnd)}</td>
            </tr>
            <tr>
              <td style="padding:8px 0;font-size:13px;color:#888">First Charge</td>
              <td style="padding:8px 0;font-size:13px;font-weight:700;color:#1a1a1a;text-align:right">$5.00 CAD on ${fmtDate(trialEnd)}</td>
            </tr>
          </table>
        </div>

        <!-- CTA -->
        <a href="${process.env.FRONTEND_URL||"https://shift-up.netlify.app"}"
           style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:16px;border-radius:12px;text-decoration:none;margin-bottom:20px">
          Go to SHIFT-UP →
        </a>

        <div style="text-align:center;font-size:12px;color:#aaa;line-height:1.9">
          Cancel anytime before <strong>${fmtDate(trialEnd)}</strong> from Profile → Subscription.<br/>
          No charge if cancelled before trial ends.
        </div>
      `),
    });

    res.json({
      success: true,
      message: "Subscription reactivated! A confirmation email has been sent.",
    });
  } catch(err) {
    console.error("Activate subscription error:", err.message);
    res.status(500).json({ success:false, message:err.message });
  }
});


module.exports = router;