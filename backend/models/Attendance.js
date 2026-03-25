const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    shift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      required: true,
    },
    date: {
      type: Date,
      required: true,
    },
    status: {
      type: String,
      enum: ["present", "absent", "late", "no-show"],
      default: "present",
    },
    clockIn: {
      type: String,
      default: null,
    },
    clockOut: {
      type: String,
      default: null,
    },
    hoursWorked: {
      type: Number,
      default: 0,
    },
    notes: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

attendanceSchema.index({ employee: 1, date: 1 });

module.exports = mongoose.model("Attendance", attendanceSchema);