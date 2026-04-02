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
  origin: process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://yourdomain.com"]
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

// ── Stripe webhook — MUST come before express.json() (needs raw body) ──────
const stripe = process.env.STRIPE_SECRET_KEY ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;
app.post("/api/subscription/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  if (!stripe) return res.status(400).send("Stripe not configured");
  const sig = req.headers["stripe-signature"];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  const User = require("./models/User");
  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const s = event.data.object;
        if (s.metadata?.userId) await User.findByIdAndUpdate(s.metadata.userId, { subscriptionStatus:"active", subscriptionPlan: s.metadata.planKey || "starter" });
        break;
      }
      case "invoice.payment_succeeded":
        await User.findOneAndUpdate({ stripeCustomerId: event.data.object.customer }, { subscriptionStatus:"active" });
        break;
      case "invoice.payment_failed":
        await User.findOneAndUpdate({ stripeCustomerId: event.data.object.customer }, { subscriptionStatus:"past_due" });
        break;
      case "customer.subscription.deleted":
        await User.findOneAndUpdate({ stripeCustomerId: event.data.object.customer }, { subscriptionStatus:"cancelled", subscriptionPlan:"free" });
        break;
    }
  } catch (err) { console.error("Webhook error:", err.message); }
  res.json({ received: true });
});

// ── Body parsers ───────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Session + Passport ─────────────────────────────────────────────────────
app.use(session({
  secret:            process.env.SESSION_SECRET || process.env.JWT_SECRET,
  resave:            false,
  saveUninitialized: false,
  cookie:            { secure: process.env.NODE_ENV === "production", maxAge: 10 * 60 * 1000 },
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

app.get("/api/health", (req, res) => res.json({ status: "OK" }));
app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 ShiftUp API running on port ${PORT} [${process.env.NODE_ENV}]`));