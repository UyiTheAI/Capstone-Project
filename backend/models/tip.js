const mongoose = require("mongoose");

const tipSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    totalAmount: { type: Number, required: true, min: 0 },
    splitMethod: {
      type: String,
      enum: ["equal", "hours", "manual"],
      default: "equal",
    },
    note: { type: String, default: "" },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    distributions: [
      {
        employee: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        amount: { type: Number, required: true },
        hours: { type: Number, default: 0 },
      },
    ],
  },
  { timestamps: true }
);

module.exports = mongoose.model("Tip", tipSchema);