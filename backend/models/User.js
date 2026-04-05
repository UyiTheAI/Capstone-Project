const mongoose = require("mongoose");
const bcrypt   = require("bcryptjs");

const userSchema = new mongoose.Schema({
  firstName: { type: String, required: [true, "First name is required"], trim: true },
  lastName:  { type: String, required: [true, "Last name is required"],  trim: true },
  email:     { type: String, required: [true, "Email is required"], unique: true, lowercase: true, trim: true, match: [/^\S+@\S+\.\S+$/, "Please enter a valid email"] },
  password:  { type: String, required: [true, "Password is required"], minlength: [6, "Password must be at least 6 characters"], select: false },
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
  avatar:          { type: String,  default: null  },
  googleId:        { type: String,  default: null  },

  // Who created this user (manager/owner who registered them)
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },

  // Subscription
  subscriptionStatus: { type: String, enum: ["free","active","past_due","cancelled"], default: "free" },
  subscriptionPlan:   { type: String, enum: ["free","pro"], default: "free" },
  stripeCustomerId:   { type: String, default: null },

  // Password reset
  resetPasswordToken:  { type: String },
  resetPasswordExpire: { type: Date   },
}, { timestamps: true });

// Hash password before saving
userSchema.pre("save", async function(next) {
  if (!this.isModified("password")) return next();
  const salt    = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Virtual full name
userSchema.virtual("name").get(function() {
  return `${this.firstName} ${this.lastName}`;
});
userSchema.set("toJSON", { virtuals: true });

module.exports = mongoose.model("User", userSchema);