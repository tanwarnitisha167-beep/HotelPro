
const express = require("express");
const router = express.Router();
const crypto = require("crypto");

const Booking = require("../models/Booking");
const Room = require("../models/Room");
const authMiddleware = require("../middleware/authMiddleware");

// Create a pending booking before demo payment
router.post("/add", authMiddleware, async (req, res) => {
  try {
    const { room, checkIn, checkOut, guests } = req.body;
    console.log("REQ BODY:", JSON.stringify(req.body));
console.log("MISSING CHECK:", {
  room: !!req.body.room,
  checkIn: !!req.body.checkIn,
  checkOut: !!req.body.checkOut,
  guests: req.body.guests,
});
    console.log("Booking request received:", req.body);
if (
  !room ||
  !checkIn ||
  !checkOut ||
  guests === undefined ||
  guests === null ||
  guests === ""
) {
  return res.status(400).json({
    message: "Please fill in all booking details.",
  });
}
    

    const roomDetails = await Room.findById(room);

    if (!roomDetails) {
      return res.status(404).json({ message: "Room not found." });
    }

    const arrival = new Date(checkIn);
    const departure = new Date(checkOut);
    const guestCount = Number(guests);

    if (
      Number.isNaN(arrival.getTime()) ||
      Number.isNaN(departure.getTime()) ||
      departure <= arrival
    ) {
      return res.status(400).json({
        message: "Check-out must be after check-in.",
      });
    }

    if (
      !Number.isInteger(guestCount) ||
      guestCount < 1 ||
      guestCount > roomDetails.capacity
    ) {
      return res.status(400).json({
        message: "Please enter a valid number of guests.",
      });
    }

    const existingBooking = await Booking.findOne({
      room,
      status: { $ne: "Cancelled" },
      checkIn: { $lt: departure },
      checkOut: { $gt: arrival },
    });

    if (existingBooking) {
      return res.status(409).json({
        message: "This room is not available for those dates.",
      });
    }

    const nights = Math.ceil(
      (departure - arrival) / (1000 * 60 * 60 * 24)
    );

    const booking = await Booking.create({
      room,
      guestName: req.user.name,
      guestEmail: req.user.email,
      checkIn: arrival,
      checkOut: departure,
      guests: guestCount,
      totalPrice: nights * roomDetails.price,
      status: "Pending",
      paymentStatus: "Pending",
      paymentMethod: "Demo Payment",
      transactionId: "",
    });

    return res.status(201).json({
      message: "Booking created. Please complete demo payment.",
      booking,
    });
  } catch (error) {
    console.error("Booking error:", error);
    return res.status(500).json({
      message: "Could not create booking.",
    });
  }
});

// Simulate a successful demo payment
router.post("/:id/demo-payment", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (
      req.user.role !== "admin" &&
      booking.guestEmail !== req.user.email
    ) {
      return res.status(403).json({
        message: "You cannot pay for another customer's booking.",
      });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({
        message: "This booking has been cancelled.",
      });
    }

    if (booking.paymentStatus === "Paid") {
      return res.status(400).json({
        message: "Demo payment has already been completed.",
      });
    }

    // Recheck room availability before confirming payment.
    const overlappingBooking = await Booking.findOne({
      _id: { $ne: booking._id },
      room: booking.room,
      status: "Confirmed",
      checkIn: { $lt: booking.checkOut },
      checkOut: { $gt: booking.checkIn },
    });

    if (overlappingBooking) {
      return res.status(409).json({
        message: "This room is no longer available. Please contact the hotel.",
      });
    }

    // This is a simulation, not a real payment.
    booking.paymentStatus = "Paid";
    booking.paymentMethod = "Demo Payment";
    booking.transactionId = "DEMO-" + crypto.randomUUID();
    booking.status = "Confirmed";

    await booking.save();

    return res.status(200).json({
      message: "Demo payment successful! Booking confirmed.",
      booking,
    });
  } catch (error) {
    console.error("Demo payment error:", error);
    return res.status(500).json({
      message: "Could not complete demo payment.",
    });
  }
});

// Get bookings: Admin sees all; customer sees their own
router.get("/", authMiddleware, async (req, res) => {
  try {
    const filter =
      req.user.role === "admin"
        ? {}
        : { guestEmail: req.user.email };

    const bookings = await Booking.find(filter)
      .populate("room")
      .sort({ createdAt: -1 });

    return res.status(200).json(bookings);
  } catch (error) {
    console.error("Fetch bookings error:", error);
    return res.status(500).json({
      message: "Could not fetch bookings.",
    });
  }
});

// Cancel a booking
router.put("/cancel/:id", authMiddleware, async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);

    if (!booking) {
      return res.status(404).json({ message: "Booking not found." });
    }

    if (
      req.user.role !== "admin" &&
      booking.guestEmail !== req.user.email
    ) {
      return res.status(403).json({
        message: "You cannot cancel another customer's booking.",
      });
    }

    if (booking.status === "Cancelled") {
      return res.status(400).json({
        message: "This booking is already cancelled.",
      });
    }

    booking.status = "Cancelled";
    await booking.save();

    return res.status(200).json({
      message: "Booking cancelled successfully!",
      booking,
    });
  } catch (error) {
    console.error("Cancel booking error:", error);
    return res.status(500).json({
      message: "Could not cancel booking.",
    });
  }
});

module.exports = router;
