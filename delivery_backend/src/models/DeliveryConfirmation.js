const mongoose = require("mongoose");

const deliveryConfirmationSchema = new mongoose.Schema(
  {
    orderId: { type: String, required: true },
    customerName: { type: String, required: true },
    address: { type: String, required: true },
    status: { type: String, enum: ["pending", "delivered"], default: "pending" },
    deliveredAt: { type: Date },
    deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: "DeliveryUser" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryConfirmation", deliveryConfirmationSchema);
