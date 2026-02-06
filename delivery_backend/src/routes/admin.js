const express = require("express");
const DeliveryConfirmation = require("../models/DeliveryConfirmation");
const DeliveryItem = require("../models/DeliveryItem");
const { authenticate, authorizeRole } = require("../middleware/auth");

const router = express.Router();

router.get("/confirmations", authenticate, authorizeRole("admin"), async (_req, res) => {
  const confirmations = await DeliveryConfirmation.find()
    .populate("deliveredBy", "name email")
    .sort({ deliveredAt: -1 });
  return res.json(confirmations);
});

router.get("/items", authenticate, authorizeRole("admin"), async (_req, res) => {
  const items = await DeliveryItem.find().sort({ createdAt: -1 });
  return res.json(items);
});

router.post("/items", authenticate, authorizeRole("admin"), async (req, res) => {
  try {
    const { name, description, etaMinutes, active = true } = req.body;

    if (!name || !description || !etaMinutes) {
      return res.status(400).json({ message: "Missing delivery item details" });
    }

    const item = await DeliveryItem.create({
      name,
      description,
      etaMinutes,
      active: Boolean(active)
    });

    return res.status(201).json(item);
  } catch (error) {
    return res.status(500).json({ message: "Failed to create delivery item" });
  }
});

router.put("/items/:id", authenticate, authorizeRole("admin"), async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, etaMinutes, active } = req.body;

    const updates = {};
    if (name !== undefined) updates.name = name;
    if (description !== undefined) updates.description = description;
    if (etaMinutes !== undefined) updates.etaMinutes = etaMinutes;
    if (typeof active === "boolean") updates.active = active;

    const updated = await DeliveryItem.findByIdAndUpdate(id, updates, { new: true });

    if (!updated) {
      return res.status(404).json({ message: "Delivery item not found" });
    }

    return res.json(updated);
  } catch (error) {
    return res.status(500).json({ message: "Failed to update delivery item" });
  }
});

module.exports = router;
