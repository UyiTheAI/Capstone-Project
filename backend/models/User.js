const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, "First name is required"], trim: true },
  lastName:  { type: String, required: [true, "Last name is required"],  trim: true },
  email: {
    type: String, required: [true, "Email is required"],
    unique: true, lowercase: true, trim: true,
    match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"],
  },
  password: { type: String, minlength: [6, "Password must be at least 6 characters"], select: false },
  role:     { type: String, enum: ["employee", "manager", "owner"], default: "employee" },
  position: { type: String, default: "" },
  availability: { type: String, enum: ["Full-Time", "Part-Time", "On-Call"], default: "Full-Time" },
  availabilitySchedule: {
    Mon: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Tue: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Wed: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Thu: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Fri: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Sat: { morning: Boolean, afternoon: Boolean, evening: Boolean },
    Sun: { morning: Boolean, afternoon: Boolean, evening: Boolean },
  },
  isActive:       { type: Boolean, default: true },
  lastAttendance: { type: Date,    default: null },
  noShows:        { type: Number,  default: 0 },
  coveragePercent:{ type: Number,  default: 100 },

  // ── OAuth fields ──────────────────────────────────────────────────────────
  googleId:      { type: String, default: null, sparse: true },
  appleId:       { type: String, default: null, sparse: true },
  avatar:        { type: String, default: null },
  oauthProvider: { type: String, enum: ["google", "apple", "local", null], default: null },
}, { timestamps: true });

// Hash password — skip if OAuth user with no password set
userSchema.pre("save", async function (next) {
  if (!this.isModified("password") || !this.password) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

userSchema.methods.matchPassword = async function (entered) {
  if (!this.password) return false; // OAuth users have no real password
  return bcrypt.compare(entered, this.password);
};

userSchema.virtual("name").get(function () {
  return `${this.firstName} ${this.lastName}`;
});

userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);