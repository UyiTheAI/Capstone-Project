require("dotenv").config();
const express      = require("express");
const cors         = require("cors");
const connectDB    = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const logger       = require("./middleware/logger");

connectDB();
const app = express();

const allowedOrigins = process.env.NODE_ENV === "production"
  ? [process.env.FRONTEND_URL, "https://shift-up.netlify.app"].filter(Boolean)
  : ["http://localhost:3000", "http://localhost:3001"];

app.use(cors({ origin: allowedOrigins, credentials: true }));

// Stripe webhook needs raw body — register BEFORE express.json()
app.post(
  "/api/subscription/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    const stripe = process.env.STRIPE_SECRET_KEY
      ? require("stripe")(process.env.STRIPE_SECRET_KEY) : null;
    if (!stripe) return res.status(400).json({ message: "Stripe not configured" });
    let event;
    try {
      event = stripe.webhooks.constructEvent(
        req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET
      );
    } catch (e) { return res.status(400).send(`Webhook Error: ${e.message}`); }

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
    } catch(e) { console.error("Webhook handler:", e.message); }
    res.json({ received: true });
  }
);

app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(logger);

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
app.use("/api/contact",       require("./routes/contact"));
app.use("/api/translate",     require("./routes/translate"));

app.get("/api/health", (_, res) =>
  res.json({ status: "OK", env: process.env.NODE_ENV, ts: new Date() }));

app.use((req, res) =>
  res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 ShiftUp API → http://localhost:${PORT}/api  [${process.env.NODE_ENV || "development"}]`);
});