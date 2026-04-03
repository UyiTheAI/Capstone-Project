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

app.use(cors({
  origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean),
  credentials: true,
}));

// ── Stripe webhook — raw body BEFORE express.json() ───────────────────────
if (process.env.STRIPE_SECRET_KEY) {
  const stripe     = require("stripe")(process.env.STRIPE_SECRET_KEY);
  const nodemailer = require("nodemailer");

  const sendOrgCodeEmail = async (toEmail, orgCode, name) => {
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.log(`⚠️  Email not configured. Org code for ${toEmail}: ${orgCode}`);
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
        <div style="font-family:'DM Sans',sans-serif;max-width:520px;margin:auto;background:#fff;border-radius:16px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,.08)">
          <!-- Header -->
          <div style="background:#1a1a1a;padding:32px 40px;text-align:center">
            <div style="fontFamily:sans-serif;font-size:32px;font-weight:900;color:#f5b800;letter-spacing:2px">SHIFT-UP</div>
            <div style="color:#888;font-size:13px;margin-top:4px">Workforce Management</div>
          </div>

          <!-- Body -->
          <div style="padding:40px">
            <h2 style="font-size:24px;color:#1a1a1a;margin:0 0 8px">🎁 Your 7-Day Free Trial Has Started!</h2>
            <p style="color:#555;font-size:15px;line-height:1.7;margin:0 0 32px">
              Hi ${name || "there"}, welcome to SHIFT-UP! Your trial is active — full access to every feature for 7 days, no charge until your trial ends.
            </p>

            <!-- Org Code Box -->
            <div style="background:#f9f9f7;border:2px solid #f5b800;border-radius:16px;padding:28px;text-align:center;margin-bottom:32px">
              <div style="font-size:13px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:2px;margin-bottom:12px">
                🔑 Your Organisation Code
              </div>
              <div style="font-family:monospace;font-size:52px;font-weight:900;color:#f5b800;letter-spacing:16px;margin-bottom:12px">
                ${orgCode}
              </div>
              <div style="font-size:13px;color:#888;line-height:1.6">
                Share this 6-digit code with your employees.<br/>
                They enter it when registering to join your restaurant.
              </div>
            </div>

            <!-- Steps -->
            <div style="margin-bottom:28px">
              <div style="font-weight:700;font-size:14px;color:#1a1a1a;margin-bottom:12px">What to do next:</div>
              ${["Log in to SHIFT-UP and explore your dashboard", "Share the code above with your staff", "Employees register and enter your code to join", "Start scheduling shifts for your team"].map((s, i) => `
                <div style="display:flex;gap:12px;align-items:flex-start;margin-bottom:10px">
                  <div style="width:24px;height:24px;border-radius:50%;background:#f5b800;color:#1a1a1a;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;flex-shrink:0;line-height:24px;text-align:center">${i + 1}</div>
                  <div style="font-size:14px;color:#555;padding-top:3px">${s}</div>
                </div>
              `).join("")}
            </div>

            <!-- CTA -->
            <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}" style="display:block;text-align:center;background:#f5b800;color:#1a1a1a;font-weight:800;font-size:15px;padding:16px;border-radius:10px;text-decoration:none;margin-bottom:24px">
              Go to SHIFT-UP Dashboard →
            </a>

            <div style="font-size:12px;color:#aaa;text-align:center;line-height:1.6">
              Trial ends in 7 days. Cancel anytime from your Subscription settings — no charge.<br/>
              After trial: $5 CAD/month. Questions? Reply to this email.
            </div>
          </div>

          <!-- Footer -->
          <div style="background:#f9f9f7;padding:20px 40px;text-align:center;border-top:1px solid #f0f0f0">
            <div style="font-size:11px;color:#aaa">🔒 Secured by Stripe · SHIFT-UP Workforce Management</div>
          </div>
        </div>
      `,
    });
    console.log(`✅ Org code email sent to ${toEmail}`);
  };

  app.post("/api/subscription/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      console.error("Webhook error:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const User = require("./models/User");

    try {
      // ── Trial started OR paid checkout completed ──────────────────────────
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId  = session.metadata?.userId;
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

          // Send org code email
          if (user) {
            await sendOrgCodeEmail(user.email, orgCode, user.firstName);
          }
          console.log(`✅ Trial/subscription started. Org code ${orgCode} sent to ${user?.email}`);
        }
      }

      if (event.type === "invoice.payment_succeeded") {
        await User.findOneAndUpdate(
          { stripeCustomerId: event.data.object.customer },
          { subscriptionStatus: "active" }
        );
      }

      if (event.type === "invoice.payment_failed") {
        await User.findOneAndUpdate(
          { stripeCustomerId: event.data.object.customer },
          { subscriptionStatus: "past_due" }
        );
      }

      if (event.type === "customer.subscription.deleted") {
        await User.findOneAndUpdate(
          { stripeCustomerId: event.data.object.customer },
          { subscriptionStatus: "cancelled", subscriptionPlan: "free", orgCode: null }
        );
        console.log("❌ Subscription cancelled");
      }

      // Trial ended — start billing
      if (event.type === "customer.subscription.trial_will_end") {
        const customerId = event.data.object.customer;
        const user = await User.findOne({ stripeCustomerId: customerId });
        if (user && process.env.EMAIL_USER) {
          const transporter = nodemailer.createTransport({
            service: "gmail",
            auth: { user: process.env.EMAIL_USER, pass: process.env.EMAIL_PASS },
          });
          await transporter.sendMail({
            from:    `"SHIFT-UP" <${process.env.EMAIL_USER}>`,
            to:      user.email,
            subject: "⏰ Your SHIFT-UP trial ends in 3 days",
            html: `<div style="font-family:sans-serif;padding:32px;max-width:480px;margin:auto"><h2>Your trial ends soon</h2><p>Your 7-day free trial ends in 3 days. After that, $5 CAD/month will be charged automatically.</p><p>To cancel, go to <a href="${process.env.FRONTEND_URL}/subscription">Subscription Settings</a>.</p></div>`,
          });
        }
      }

    } catch (err) { console.error("Webhook handler error:", err.message); }

    res.json({ received: true });
  });
}

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Session + Passport ─────────────────────────────────────────────────────
app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "secret",
  resave: false, saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 },
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
if (process.env.STRIPE_SECRET_KEY) {
  app.use("/api/subscription", require("./routes/subscription"));
}

app.get("/api/health", (req, res) => res.json({ status: "OK" }));
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 ShiftUp API running on port ${PORT} [${process.env.NODE_ENV}]`));