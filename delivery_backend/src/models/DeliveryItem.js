const mongoose = require("mongoose");

const deliveryItemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    etaMinutes: { type: Number, required: true },
    active: { type: Boolean, default: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryItem", deliveryItemSchema);
