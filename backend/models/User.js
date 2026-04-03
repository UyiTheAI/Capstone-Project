const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName:  { type: String, required: true, trim: true },
  email: {
    type: String, required: true, unique: true,
    lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, "Invalid email"],
  },
  password:     { type: String, minlength: 6, select: false },
  role:         { type: String, enum: ["employee","manager","owner"], default: "employee" },
  position:     { type: String, default: "" },
  availability: { type: String, enum: ["Full-Time","Part-Time","On-Call"], default: "Full-Time" },
  availabilitySchedule: {
    Mon: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Tue: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Wed: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Thu: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Fri: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Sat: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Sun: { morning: Boolean, afternoon: Boolean, evening: Boolean },
  },
  isActive:        { type: Boolean, default: true },
  lastAttendance:  { type: Date,    default: null  },
  noShows:         { type: Number,  default: 0     },
  coveragePercent: { type: Number,  default: 100   },

  // ── Profile photo ────────────────────────────────────────────────────────
  avatar:        { type: String, default: null }, // base64 or URL
  googleId:      { type: String, default: null, sparse: true },
  oauthProvider: { type: String, enum: ["google","local",null], default: null },

  // ── Organisation code (set on owner after subscription) ──────────────────
  orgCode:       { type: String, default: null },   // owner's 6-digit code
  orgOwner:      { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null }, // employee → owner

  // ── Stripe subscription ──────────────────────────────────────────────────
  stripeCustomerId:   { type: String, default: null },
  subscriptionStatus: { type: String, enum: ["free","active","past_due","cancelled"], default: "free" },
  subscriptionPlan:   { type: String, enum: ["free","pro"], default: "free" },

  // ── Password reset ───────────────────────────────────────────────────────
  resetPasswordToken:   { type: String, default: null },
  resetPasswordExpire:  { type: Date,   default: null },

}, { timestamps: true });

userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false;
  return bcrypt.compare(entered, this.password);
};

userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);