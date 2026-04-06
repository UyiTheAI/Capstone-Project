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

// ── Stripe webhook — must be BEFORE express.json() ────────────────────────
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

  app.post("/api/subscription/webhook",
    express.raw({ type: "application/json" }),
    async (req, res) => {
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

      const User = require("./models/User");
      try {
        if (event.type === "invoice.payment_succeeded") {
          await User.findOneAndUpdate(
            { stripeCustomerId: event.data.object.customer },
            { subscriptionStatus: "active" }
          );
        }
        if (event.type === "customer.subscription.deleted") {
          await User.findOneAndUpdate(
            { stripeCustomerId: event.data.object.customer },
            { subscriptionStatus: "cancelled", subscriptionPlan: "free" }
          );
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
    secure:  process.env.NODE_ENV === "production",
    maxAge:  10 * 60 * 1000,
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
app.use("/api/attendance",    require("./routes/attendance"));
app.use("/api/subscription",  require("./routes/subscription"));

// ── Health check ───────────────────────────────────────────────────────────
app.get("/api/health", (req, res) =>
  res.json({ status: "OK", env: process.env.NODE_ENV })
);

// ── 404 + Error handler ────────────────────────────────────────────────────
app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` })
);
app.use(errorHandler);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;
app.listen(PORT, () =>
  console.log(`🚀 ShiftUp API running on port ${PORT} [${process.env.NODE_ENV}]`)
);

module.exports = app;