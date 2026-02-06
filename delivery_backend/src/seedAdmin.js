const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const DeliveryUser = require("./models/DeliveryUser");

dotenv.config();

const createAdmin = async () => {
  const adminEmail = process.env.ADMIN_EMAIL;
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminEmail || !adminPassword) {
    throw new Error("ADMIN_EMAIL and ADMIN_PASSWORD must be set");
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await DeliveryUser.findOne({ email: adminEmail.toLowerCase() });
  if (existing) {
    await mongoose.disconnect();
    return;
  }

  const passwordHash = await bcrypt.hash(adminPassword, 10);
  await DeliveryUser.create({
    name: "Delivery Admin",
    email: adminEmail.toLowerCase(),
    passwordHash,
    role: "admin"
  });

  await mongoose.disconnect();
};

createAdmin().catch((error) => {
  // eslint-disable-next-line no-console
  console.error("Failed to seed admin", error);
  process.exit(1);
});
