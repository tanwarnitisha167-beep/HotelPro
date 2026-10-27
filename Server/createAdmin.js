
require("dotenv").config();
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const User = require("./models/User");

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected!");

    const adminEmail = "hotelpro.admin@gmail.com";
    const adminPassword = "HotelProAdmin@2026";

    const existingAdmin = await User.findOne({
      email: adminEmail,
    });

    if (existingAdmin) {
      existingAdmin.role = "admin";
      existingAdmin.password = await bcrypt.hash(adminPassword, 10);
      await existingAdmin.save();

      console.log("Existing account updated to admin.");
    } else {
      const hashedPassword = await bcrypt.hash(adminPassword, 10);

      await User.create({
        name: "HotelPro Admin",
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      });

      console.log("Admin account created successfully!");
    }

    console.log("Admin email:", adminEmail);
    console.log("Admin password:", adminPassword);
  } catch (error) {
    console.error("Error creating admin:", error.message);
  } finally {
    await mongoose.disconnect();
  }
}

createAdmin();
