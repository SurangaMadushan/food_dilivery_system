const express = require("express");
const DeliveryConfirmation = require("../models/DeliveryConfirmation");
const { authenticate, authorizeRole } = require("../middleware/auth");

const router = express.Router();

router.get("/confirmations", authenticate, authorizeRole("admin"), async (_req, res) => {
  const confirmations = await DeliveryConfirmation.find()
    .populate("deliveredBy", "name email")
    .sort({ deliveredAt: -1 });
  return res.json(confirmations);
});

module.exports = router;
