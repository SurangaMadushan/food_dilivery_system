const mongoose = require("mongoose");

const deliveryUserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["delivery", "admin"], default: "delivery" }
  },
  { timestamps: true }
);

module.exports = mongoose.model("DeliveryUser", deliveryUserSchema);
