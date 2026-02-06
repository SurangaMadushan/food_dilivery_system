const express = require("express");
const DeliveryItem = require("../models/DeliveryItem");
const DeliveryConfirmation = require("../models/DeliveryConfirmation");
const { authenticate } = require("../middleware/auth");

const router = express.Router();

router.get("/menu", async (_req, res) => {
  const items = await DeliveryItem.find({ active: true }).sort({ name: 1 });
  return res.json(items);
});

router.post("/confirm", authenticate, async (req, res) => {
  try {
    const { orderId, customerName, address } = req.body;

    if (!orderId || !customerName || !address) {
      return res.status(400).json({ message: "Missing delivery details" });
    }

    const confirmation = await DeliveryConfirmation.create({
      orderId,
      customerName,
      address,
      status: "delivered",
      deliveredAt: new Date(),
      deliveredBy: req.user.id
    });

    return res.status(201).json(confirmation);
  } catch (error) {
    return res.status(500).json({ message: "Confirmation failed" });
  }
});

module.exports = router;
