const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["APPROVED", "REJECTED", "SCHEDULE_PUBLISHED", "SWAP_REQUEST", "SHIFT_ALERT"],
      required: true,
    },
    title: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    read: {
      type: Boolean,
      default: false,
    },
    relatedSwap: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "SwapRequest",
      default: null,
    },
    relatedShift: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Shift",
      default: null,
    },
  },
  { timestamps: true }
);

notificationSchema.index({ recipient: 1, read: 1 });

module.exports = mongoose.model("Notification", notificationSchema);