
const express = require("express");
const router = express.Router();
const Room = require("../models/Room");

// Get all rooms
router.get("/", async (req, res) => {
  try {
    const rooms = await Room.find();
    res.status(200).json(rooms);
  } catch (error) {
    res.status(500).json({ message: "Error fetching rooms" });
  }
});

router.post("/add", async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    const savedRoom = await newRoom.save();

    res.status(201).json(savedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
