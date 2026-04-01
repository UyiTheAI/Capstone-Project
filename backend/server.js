require("dotenv").config();
const express    = require("express");
const cors       = require("cors");
const session    = require("express-session");
const passport   = require("./config/passport");
const connectDB  = require("./config/db");
const errorHandler = require("./middleware/errorHandler");
const logger     = require("./middleware/logger");

connectDB();

const app = express();

// ── Core Middleware ────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.NODE_ENV === "production"
    ? [process.env.FRONTEND_URL || "https://yourdomain.com"]
    : ["http://localhost:3000", "http://localhost:3001"],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(logger);

// ── Session (required by passport for OAuth flow only — not used for JWT) ──
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

app.get("/api/health", (req, res) => res.json({ status: "OK", env: process.env.NODE_ENV }));

app.use((req, res) => res.status(404).json({ success: false, message: `Route ${req.originalUrl} not found` }));
app.use(errorHandler);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`🚀 ShiftUp API running on port ${PORT} [${process.env.NODE_ENV}]`);
});

process.on("unhandledRejection", (err) => {
  console.error("❌ Unhandled Rejection:", err.message);
  server.close(() => process.exit(1));
});