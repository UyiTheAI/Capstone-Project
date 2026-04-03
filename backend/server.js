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

app.use(cors({ origin: ["http://localhost:3000", process.env.FRONTEND_URL].filter(Boolean), credentials: true }));

// ── Stripe webhook — raw body BEFORE express.json() ───────────────────────
if (process.env.STRIPE_SECRET_KEY) {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  app.post("/api/subscription/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"];
    let event;
    try {
      event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
    } catch (err) {
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    const User   = require("./models/User");
    const crypto = require("crypto");

    try {
      if (event.type === "checkout.session.completed") {
        const session = event.data.object;
        const userId  = session.metadata?.userId;
        if (userId) {
          // Generate unique 6-digit org code after successful payment
          let orgCode, exists;
          do {
            orgCode = Math.floor(100000 + Math.random() * 900000).toString();
            exists  = await User.findOne({ orgCode });
          } while (exists);

          await User.findByIdAndUpdate(userId, {
            subscriptionStatus: "active",
            subscriptionPlan:   "pro",
            orgCode,
          });
          console.log(`✅ Subscription activated. Org code: ${orgCode} for user ${userId}`);
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
      }
    } catch (err) { console.error("Webhook handler error:", err.message); }

    res.json({ received: true });
  });
}

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json({ limit: "10mb" })); // 10mb for base64 photo uploads
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