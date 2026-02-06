const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DeliveryItem = require("./models/DeliveryItem");
const authRoutes = require("./routes/auth");
const deliveryRoutes = require("./routes/deliveries");
const adminRoutes = require("./routes/admin");

dotenv.config();

const app = express();

const port = process.env.PORT || 8081;


app.use(cors());
app.use(express.json());

app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

app.use("/api/auth", authRoutes);
app.use("/api/deliveries", deliveryRoutes);
app.use("/api/admin", adminRoutes);

const seedMenu = async () => {
  const count = await DeliveryItem.countDocuments();
  if (count === 0) {
    await DeliveryItem.insertMany([
      {
        name: "Express Delivery",
        description: "Deliver within 30 minutes inside the city.",
        etaMinutes: 30
      },
      {
        name: "Standard Delivery",
        description: "Affordable delivery within 60 minutes.",
        etaMinutes: 60
      },
      {
        name: "Scheduled Delivery",
        description: "Book a delivery slot up to 24 hours ahead.",
        etaMinutes: 120
      }
    ]);
  }
};

const start = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    await seedMenu();
    app.listen(port, () => {
      // eslint-disable-next-line no-console
      console.log(`Delivery backend running on port ${port}`);
    });
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error("Failed to start delivery backend", error);
    process.exit(1);
  }
};

start();
