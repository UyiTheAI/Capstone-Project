require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const session      = require("express-session");
const passport     = require("./config/passport");
const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const logger       = require("./middleware/logger");

connectDB();
const app = express();

// ── CORS ───────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:3001",
    process.env.FRONTEND_URL,
  ].filter(Boolean),
  credentials: true,
}));

// ── Stripe webhook — raw body MUST come before express.json() ─────────────
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
  const stripe     = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const nodemailer = require("nodemailer");

  const sendOrgCodeEmail = async (toEmail, orgCode, name) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`⚠️  No email config — org code for ${toEmail}: ${orgCode}`);
      return;
    }
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
    });
    await transporter.sendMail({
      from:    `"SHIFT-UP" <${process.env.EMAIL_USER}>`,
      to:      toEmail,
      subject: "🎉 Your SHIFT-UP Trial Has Started — Here's Your Org Code",
      html: `
        <div style="font-family:sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden">
          <div style="background:#1a1a1a;padding:32px 40px;text-align:center">
            <div style="font-size:28px;font-weight:900;color:#f5b800;letter-spacing:2px">SHIFT-UP</div>
          </div>
          <div style="padding:40px">
            <h2 style="font-size:22px;color:#1a1a1a">🎁 Your 7-Day Free Trial Has Started!</h2>
            <p style="color:#555;line-height:1.7">Hi ${name || "there"}! Full access for 7 days — no charge until trial ends.</p>
            <div style="background:#f9f9f7;border:2px solid #f5b800;border-radius:16px;padding:28px;text-align:center;margin:24px 0">
              <div style="font-size:12px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">🔑 Your Organisation Code</div>
              <div style="font-family:monospace;font-size:48px;font-weight:900;color:#f5b800;letter-spacing:14px">${orgCode}</div>
              <div style="font-size:13px;color:#888;margin-top:12px">Share this with your staff when they register.</div>
            </div>
            <ol style="color:#555;font-size:14px;line-height:2">
              <li>Log in to SHIFT-UP and explore your dashboard</li>
              <li>Share the code above with your staff</li>
              <li>Staff register and enter your code to join</li>
              <li>Start scheduling shifts!</li>
            </ol>
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:16px;border-radius:10px;text-decoration:none;margin:24px 0">
              Go to Dashboard →
            </a>
            <p style="font-size:12px;color:#aaa;text-align:center">Trial ends in 7 days. Cancel anytime = $0. After trial: $5 CAD/month.</p>
          </div>
        </div>
      `,
    });
    console.log(`✅ Org code email sent to ${toEmail}`);
  };

  app.post("/api/subscription/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
      const sig = req.headers["stripe-signature"];
      let event;
      try {
        event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
      } catch (err) {
        console.error("Webhook signature error:", err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
      }

      const User = require("./models/User");
      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const s      = event.data.object;
            const userId = s.metadata?.userId;
            if (userId) {
              // Generate unique 6-digit org code
              let orgCode, exists;
              do {
                orgCode = Math.floor(100000 + Math.random() * 900000).toString();
                exists  = await User.findOne({ orgCode });
              } while (exists);

              const user = await User.findByIdAndUpdate(
                userId,
                { subscriptionStatus: "active", subscriptionPlan: "pro", orgCode },
                { new: true }
              );
              if (user) {
                await sendOrgCodeEmail(user.email, orgCode, user.firstName);
              }
              console.log(`✅ Subscription activated. Org code: ${orgCode}`);
            }
            break;
          }
          case "invoice.payment_succeeded":
            await User.findOneAndUpdate(
              { stripeCustomerId: event.data.object.customer },
              { subscriptionStatus: "active" }
            );
            break;
          case "invoice.payment_failed":
            await User.findOneAndUpdate(
              { stripeCustomerId: event.data.object.customer },
              { subscriptionStatus: "past_due" }
            );
            break;
          case "customer.subscription.deleted":
            await User.findOneAndUpdate(
              { stripeCustomerId: event.data.object.customer },
              { subscriptionStatus: "cancelled", subscriptionPlan: "free", orgCode: null }
            );
            console.log("❌ Subscription cancelled");
            break;
        }
      } catch (err) {
        console.error("Webhook handler error:", err.message);
      }

      res.json({ received: true });
    }
  );
}

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Session + Passport ─────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || process.env.JWT_SECRET || "secret",
  resave:            false,
  saveUninitialized: false,
  cookie: {
    secure:   process.env.NODE_ENV === "production",
    maxAge:   10 * 60 * 1000,
  },
}));
app.use(passport.initialize());

// ── Routes ─────────────────────────────────────────────────────────────────
app.use("/api/auth",          require("./routes/auth"));
app.use("/api/shifts",        require("./routes/shifts"));
app.use("/api/swaps",         require("./routes/swaps"));
app.use("/api/notifications", require("./routes/notifications"));
app.use("/api/users",         require("./routes/users"));
app.use("/api/dashboard",     require("./routes/dashboard"));
app.use("/api/tips",          require("./routes/tips"));
app.use("/api/subscription",  require("./routes/subscription"));

// ── Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) => res.json({ status: "OK", env: process.env.NODE_ENV }));

// ── 404 + error handler ────────────────────────────────────────────────────
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

// ── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ShiftUp API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

module.exports = app;