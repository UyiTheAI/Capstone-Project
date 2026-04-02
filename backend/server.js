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

app.use(cors({ origin: ["http://localhost:3000", "http://localhost:3001"], credentials: true }));

// Stripe webhook — raw body BEFORE express.json()
if (process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET) {
  const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
  app.post("/api/subscription/webhook", express.raw({ type:"application/json" }), async (req, res) => {
    try {
      const event = stripe.webhooks.constructEvent(req.body, req.headers["stripe-signature"], process.env.STRIPE_WEBHOOK_SECRET);
      const User  = require("./models/User");
      if (event.type === "checkout.session.completed" && event.data.object.metadata?.userId)
        await User.findByIdAndUpdate(event.data.object.metadata.userId, { subscriptionStatus:"active", subscriptionPlan:"pro" });
      if (event.type === "customer.subscription.deleted")
        await User.findOneAndUpdate({ stripeCustomerId: event.data.object.customer }, { subscriptionStatus:"cancelled", subscriptionPlan:"free" });
      res.json({ received: true });
    } catch (err) { res.status(400).send(`Webhook Error: ${err.message}`); }
  });
}

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

app.use(session({
  secret: process.env.SESSION_SECRET || process.env.JWT_SECRET || "secret",
  resave: false, saveUninitialized: false,
  cookie: { secure: false, maxAge: 10 * 60 * 1000 },
}));
app.use(passport.initialize());

// Routes
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

app.get("/api/health", (req, res) => res.json({ status:"OK" }));
app.use((req, res) => res.status(404).json({ success:false, message:`Route ${req.originalUrl} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 ShiftUp API running on port ${PORT} [${process.env.NODE_ENV}]`));