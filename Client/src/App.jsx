
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import Auth from "./Auth";

const API = "http://localhost:8001/api";

function App() {
  const [loggedInUser, setLoggedInUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("hotelproUser");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [loadingRooms, setLoadingRooms] = useState(false);
  const [loadingBookings, setLoadingBookings] = useState(false);

  const [roomName, setRoomName] = useState("");
  const [roomPrice, setRoomPrice] = useState("");
  const [roomImage, setRoomImage] = useState("");
  const [roomCapacity, setRoomCapacity] = useState("");
  const [roomType, setRoomType] = useState("");
  const [roomDescription, setRoomDescription] = useState("");

  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");
  const [selectedRoom, setSelectedRoom] = useState("");
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [guests, setGuests] = useState(1);

  const [paymentBooking, setPaymentBooking] = useState(null);
  const [processingPayment, setProcessingPayment] = useState(false);

  const isAdmin = loggedInUser?.role === "admin";

  const getAuthConfig = () => ({
    headers: {
      Authorization: `Bearer ${localStorage.getItem("hotelproToken")}`,
    },
  });

  // Fetch rooms.
  const fetchRooms = async () => {
    setLoadingRooms(true);

    try {
      const response = await axios.get(`${API}/rooms`);
      setRooms(response.data);
    } catch (error) {
      console.error("Error fetching rooms:", error);
      alert("Rooms could not be loaded. Please check the server.");
    } finally {
      setLoadingRooms(false);
    }
  };

  // Fetch bookings.
  const fetchBookings = async () => {
    setLoadingBookings(true);

    try {
      const response = await axios.get(
        `${API}/bookings`,
        getAuthConfig()
      );
      setBookings(response.data);
    } catch (error) {
      console.error("Error fetching bookings:", error);
      alert(
        error.response?.data?.message ||
          "Bookings could not be loaded. Please check the server."
      );
    } finally {
      setLoadingBookings(false);
    }
  };

  useEffect(() => {
    if (loggedInUser) {
      fetchRooms();
      setGuestName(loggedInUser.name || "");
      setGuestEmail(loggedInUser.email || "");
    }
  }, [loggedInUser]);

  // Show a section and scroll to it.
  const showSection = (sectionId) => {
    const section = document.getElementById(sectionId);

    if (section) {
      section.style.display = "block";
      section.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    } else {
      console.error("Section not found:", sectionId);
    }
  };

  // Log out.
  const handleLogout = () => {
    localStorage.removeItem("hotelproUser");
    localStorage.removeItem("hotelproToken");
    setLoggedInUser(null);
  };

  // Add a room.
  const handleAddRoom = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(`${API}/rooms/add`, {
        name: roomName,
        description: roomDescription,
        price: Number(roomPrice),
        image: roomImage,
        capacity: Number(roomCapacity),
        roomType,
      });

      alert(response.data.message || "Room added successfully!");

      setRoomName("");
      setRoomPrice("");
      setRoomImage("");
      setRoomCapacity("");
      setRoomType("");
      setRoomDescription("");

      await fetchRooms();
    } catch (error) {
      console.error(
        "Error adding room:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Room could not be added. Please check the server."
      );
    }
  };

  // Create a pending booking and open the payment screen.
  const handleBooking = async (e) => {
    e.preventDefault();

    if (!selectedRoom) {
      alert("Please select a room.");
      return;
    }

    if (!checkIn || !checkOut) {
      alert("Please select both check-in and check-out dates.");
      return;
    }

    if (
      new Date(checkIn) < new Date(new Date().toDateString()) ||
      new Date(checkOut) <= new Date(checkIn)
    ) {
      alert("Please select valid check-in and check-out dates.");
      return;
    }

    try {
      const response = await axios.post(
        `${API}/bookings/add`,
        {
          room: selectedRoom,
          checkIn,
          checkOut,
          guests: Number(guests),
        },
        getAuthConfig()
      );

      setPaymentBooking(response.data.booking);
      showSection("demo-payment");
    } catch (error) {
      console.log(
  "BOOKING ERROR DETAILS:",
  JSON.stringify(error.response?.data, null, 2)
);

      alert(
        error.response?.data?.message ||
          "Booking failed. Please check the server and try again."
      );
    }
  };

  // Simulate payment for the pending booking.
  const handleDemoPayment = async () => {
    if (!paymentBooking || processingPayment) return;

    setProcessingPayment(true);

    try {
      const response = await axios.post(
        `${API}/bookings/${paymentBooking._id}/demo-payment`,
        {},
        getAuthConfig()
      );

      alert(response.data.message || "Demo payment successful!");

      setPaymentBooking(null);
      setSelectedRoom("");
      setCheckIn("");
      setCheckOut("");
      setGuests(1);

      await fetchBookings();
      showSection(isAdmin ? "admin-bookings" : "bookings-list");
    } catch (error) {
      console.error(
        "Demo payment error:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Demo payment failed. Please try again."
      );
    } finally {
      setProcessingPayment(false);
    }
  };

  // Cancel a booking.
  const cancelBooking = async (bookingId) => {
    const confirmCancel = window.confirm(
      "Are you sure you want to cancel this booking?"
    );

    if (!confirmCancel) return false;

    try {
      const response = await axios.put(
        `${API}/bookings/cancel/${bookingId}`,
        {},
        getAuthConfig()
      );

      alert(response.data.message || "Booking cancelled successfully!");

      await fetchBookings();
      return true;
    } catch (error) {
      console.error(
        "Error cancelling booking:",
        error.response?.data || error.message
      );

      alert(
        error.response?.data?.message ||
          "Could not cancel booking. Please check the server."
      );

      return false;
    }
  };

  // Cancel payment and cancel the pending booking too.
  const handleCancelPayment = async () => {
    if (!paymentBooking || processingPayment) return;

    const cancelled = await cancelBooking(paymentBooking._id);

    if (cancelled) {
      setPaymentBooking(null);
      showSection("bookings-list");
    }
  };

  // Login page.
  if (!loggedInUser) {
    return (
      <Auth
        onLogin={(data) => {
          localStorage.setItem(
            "hotelproUser",
            JSON.stringify(data.user)
          );
          localStorage.setItem("hotelproToken", data.token);
          setLoggedInUser(data.user);
        }}
      />
    );
  }

  // ADMIN DASHBOARD
  if (isAdmin) {
    return (
      <div className="app">
        <nav className="navbar">
          <h2 className="logo">
            HotelPro<span>.</span>
          </h2>

          <span className="welcome-user">Admin Dashboard</span>

          <button
            type="button"
            className="nav-button"
            onClick={handleLogout}
          >
            Logout
          </button>
        </nav>

        <main className="container">
          <h1>Welcome, Admin!</h1>
          <p>Manage hotel rooms and customer bookings here.</p>

          <div className="admin-dashboard">
            <button
              type="button"
              className="nav-button"
              onClick={() => showSection("admin-rooms")}
            >
              Manage Rooms
            </button>

            <button
              type="button"
              className="nav-button"
              onClick={() => {
                showSection("admin-bookings");
                fetchBookings();
              }}
            >
              Manage Bookings
            </button>
          </div>

          <section
            id="admin-rooms"
            className="admin-section"
            style={{ display: "none" }}
          >
            <h2>Add a New Room</h2>

            <form onSubmit={handleAddRoom}>
              <input
                type="text"
                placeholder="Room Name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Price per night"
                min="1"
                value={roomPrice}
                onChange={(e) => setRoomPrice(e.target.value)}
                required
              />

              <input
                type="url"
                placeholder="Room Image URL"
                value={roomImage}
                onChange={(e) => setRoomImage(e.target.value)}
                required
              />

              <input
                type="number"
                placeholder="Room Capacity"
                min="1"
                value={roomCapacity}
                onChange={(e) => setRoomCapacity(e.target.value)}
                required
              />

              <input
                type="text"
                placeholder="Room Type"
                value={roomType}
                onChange={(e) => setRoomType(e.target.value)}
                required
              />

              <textarea
                placeholder="Room Description"
                value={roomDescription}
                onChange={(e) => setRoomDescription(e.target.value)}
                required
              />

              <button type="submit">Add Room</button>
            </form>

            <h2>Existing Rooms ({rooms.length})</h2>

            <button
              type="button"
              className="nav-button"
              onClick={fetchRooms}
            >
              Refresh Rooms
            </button>

            {loadingRooms ? (
              <p>Loading rooms...</p>
            ) : rooms.length === 0 ? (
              <p>No rooms found.</p>
            ) : (
              <div className="room-grid">
                {rooms.map((room) => (
                  <article className="room-card" key={room._id}>
                    <img
  src={room.image}
  alt={room.name}
  onError={(e) => {
    e.currentTarget.onerror = null;
    e.currentTarget.src =
      "https://placehold.co/600x400?text=Room+Photo";
  }}
/>
                    <div className="room-info">
                      <h3>{room.name}</h3>
                      <p>{room.description}</p>
                      <p>Room type: {room.roomType}</p>
                      <p>Capacity: {room.capacity} guests</p>
                      <p>₹{room.price} / night</p>
                    </div>
                  </article>
                ))}
              </div>
            )}
          </section>

          <section
            id="admin-bookings"
            className="admin-section"
            style={{ display: "none" }}
          >
            <h2>Customer Bookings ({bookings.length})</h2>

            <button
              type="button"
              className="nav-button"
              onClick={fetchBookings}
            >
              Refresh Bookings
            </button>

            {loadingBookings ? (
              <p>Loading bookings...</p>
            ) : bookings.length === 0 ? (
              <p>No bookings found.</p>
            ) : (
              <div className="room-grid">
                {bookings.map((booking) => (
                  <article className="room-card" key={booking._id}>
                    <h3>{booking.guestName}</h3>
                    <p>Email: {booking.guestEmail}</p>
                    <p>
                      Room:{" "}
                      {booking.room?.name ||
                        "Room information unavailable"}
                    </p>
                    <p>
                      Check-in:{" "}
                      {new Date(booking.checkIn).toLocaleDateString("en-IN")}
                    </p>
                    <p>
                      Check-out:{" "}
                      {new Date(booking.checkOut).toLocaleDateString("en-IN")}
                    </p>
                    <p>Guests: {booking.guests}</p>
                    <p>Total Price: ₹{booking.totalPrice}</p>
                    <p>Status: {booking.status}</p>
                    <p>
                      Payment: {booking.paymentStatus || "Not recorded"}
                    </p>
                    {booking.transactionId && (
                      <p>Transaction ID: {booking.transactionId}</p>
                    )}

                    {booking.status !== "Cancelled" && (
                      <button
                        type="button"
                        onClick={() => cancelBooking(booking._id)}
                      >
                        Cancel Booking
                      </button>
                    )}
                  </article>
                ))}
              </div>
            )}
          </section>
        </main>
      </div>
    );
  }

  // CUSTOMER PAGE
  return (
    <div className="app">
      <nav className="navbar">
        <h2 className="logo">
          HotelPro<span>.</span>
        </h2>

        <div className="nav-links">
          <a href="#home">Home</a>
          <a href="#rooms">Our Rooms</a>
          <a href="#about">About</a>
        </div>

        <button
          type="button"
          className="nav-button"
          onClick={() => showSection("booking-form")}
        >
          Book a Stay
        </button>

        <button
          type="button"
          className="nav-button"
          onClick={() => {
            showSection("bookings-list");
            fetchBookings();
          }}
        >
          My Bookings
        </button>

        <span className="welcome-user">
          Hi, {loggedInUser.name || loggedInUser.email}
        </span>

        <button
          type="button"
          className="nav-button"
          onClick={handleLogout}
        >
          Logout
        </button>
      </nav>

      {/* Customer booking form */}
      <section
        id="booking-form"
        className="admin-section"
        style={{ display: "none" }}
      >
        <h2>Book Your Room</h2>

        <form onSubmit={handleBooking}>
          <input
            type="text"
            placeholder="Guest Name"
            value={guestName}
            onChange={(e) => setGuestName(e.target.value)}
            required
          />

          <input
            type="email"
            placeholder="Email Address"
            value={guestEmail}
            onChange={(e) => setGuestEmail(e.target.value)}
            required
          />

          <select
            value={selectedRoom}
            onChange={(e) => setSelectedRoom(e.target.value)}
            required
          >
            <option value="">Select a Room</option>
            {rooms.map((room) => (
              <option key={room._id} value={room._id}>
                {room.name} - ₹{room.price}/night
              </option>
            ))}
          </select>

          <label>Check-in Date</label>
          <input
            type="date"
            min={new Date().toISOString().split("T")[0]}
            value={checkIn}
            onChange={(e) => setCheckIn(e.target.value)}
            required
          />

          <label>Check-out Date</label>
          <input
            type="date"
            min={checkIn || new Date().toISOString().split("T")[0]}
            value={checkOut}
            onChange={(e) => setCheckOut(e.target.value)}
            required
          />

          <input
            type="number"
            placeholder="Number of Guests"
            min="1"
            value={guests}
            onChange={(e) => setGuests(e.target.value)}
            required
          />

          <button type="submit">Continue to Payment</button>
        </form>
      </section>

      {/* Demo payment screen */}
      <section
        id="demo-payment"
        className="admin-section"
        style={{ display: "none" }}
      >
        <h2>Complete Your Booking</h2>

        {paymentBooking ? (
          <div className="room-card">
            <div className="room-info">
              <p>
                <strong>Room:</strong>{" "}
                {rooms.find((room) => room._id === paymentBooking.room)?.name ||
                  rooms.find((room) => room._id === paymentBooking.room?._id)?.name ||
                  "Selected Room"}
              </p>

              <p>
                <strong>Check-in:</strong>{" "}
                {new Date(paymentBooking.checkIn).toLocaleDateString("en-IN")}
              </p>

              <p>
                <strong>Check-out:</strong>{" "}
                {new Date(paymentBooking.checkOut).toLocaleDateString("en-IN")}
              </p>

              <p>
                <strong>Guests:</strong> {paymentBooking.guests}
              </p>

              <h3>
                Total Amount: ₹
                {Number(paymentBooking.totalPrice).toLocaleString("en-IN")}
              </h3>

              <p>
                <strong>Payment method:</strong> Demo Payment
              </p>

              <p>
                This is a simulated payment for your college project.
                No real money will be charged.
              </p>

              <button
                type="button"
                onClick={handleDemoPayment}
                disabled={processingPayment}
              >
                {processingPayment ? "Processing..." : "Pay Now"}
              </button>

              <button
                type="button"
                className="nav-button"
                onClick={handleCancelPayment}
                disabled={processingPayment}
              >
                Cancel Payment
              </button>
            </div>
          </div>
        ) : (
          <p>No booking is waiting for payment.</p>
        )}
      </section>

      {/* Customer bookings list */}
      <section
        id="bookings-list"
        className="admin-section"
        style={{ display: "none" }}
      >
        <h2>My Bookings</h2>

        <button
          type="button"
          className="nav-button"
          onClick={fetchBookings}
        >
          Refresh Bookings
        </button>

        {loadingBookings ? (
          <p>Loading bookings...</p>
        ) : bookings.length === 0 ? (
          <p>No bookings found.</p>
        ) : (
          <div className="room-grid">
            {bookings.map((booking) => (
              <article className="room-card" key={booking._id}>
                <h3>{booking.guestName}</h3>
                <p>
                  Room:{" "}
                  {booking.room?.name ||
                    "Room information unavailable"}
                </p>
                <p>
                  Check-in:{" "}
                  {new Date(booking.checkIn).toLocaleDateString("en-IN")}
                </p>
                <p>
                  Check-out:{" "}
                  {new Date(booking.checkOut).toLocaleDateString("en-IN")}
                </p>
                <p>Guests: {booking.guests}</p>
                <p>
                  Total Price: ₹
                  {Number(booking.totalPrice).toLocaleString("en-IN")}
                </p>
                <p>Status: {booking.status}</p>
                <p>Payment: {booking.paymentStatus || "Not recorded"}</p>

                {booking.transactionId && (
                  <p>Transaction ID: {booking.transactionId}</p>
                )}

                {booking.status !== "Cancelled" && (
                  <button
                    type="button"
                    onClick={() => cancelBooking(booking._id)}
                  >
                    Cancel Booking
                  </button>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Hero section */}
      <header className="hero" id="home">
        <div className="hero-content">
          <p className="eyebrow">WELCOME TO HOTELPRO</p>
          <h1>
            Your perfect stay
            <br />
            starts here.
          </h1>
          <p className="hero-text">
            Discover comfort, beautiful rooms and memorable experiences.
          </p>
          <a className="primary-button" href="#rooms">
            Explore Rooms →
          </a>
        </div>
      </header>

      {/* Room search section */}
      <section className="search-section">
        <h2>Find Your Stay</h2>

        <div className="search-form">
          <label>
            Check-in
            <input
              type="date"
              min={new Date().toISOString().split("T")[0]}
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
            />
          </label>

          <label>
            Check-out
            <input
              type="date"
              min={checkIn || new Date().toISOString().split("T")[0]}
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
            />
          </label>

          <label>
            Guests
            <select
              value={guests}
              onChange={(e) => setGuests(Number(e.target.value))}
            >
              <option value={1}>1 Guest</option>
              <option value={2}>2 Guests</option>
              <option value={3}>3 Guests</option>
              <option value={4}>4 Guests</option>
            </select>
          </label>

          <button
            type="button"
            onClick={() =>
              document.getElementById("rooms")?.scrollIntoView({
                behavior: "smooth",
              })
            }
          >
            Search Rooms
          </button>
        </div>
      </section>

      {/* Rooms section */}
      <section className="rooms-section" id="rooms">
        <p className="eyebrow">COMFORT & ELEGANCE</p>
        <h2>Explore Our Rooms</h2>
        <p className="section-description">
          Find the right space for your next getaway.
        </p>

        {loadingRooms ? (
          <p>Loading rooms...</p>
        ) : rooms.length === 0 ? (
          <p>No rooms available right now.</p>
        ) : (
          <div className="room-grid">
            {rooms.map((room) => (
              <article className="room-card" key={room._id}>
                <img src={room.image} alt={room.name} />

                <div className="room-info">
                  <h3>{room.name}</h3>
                 <p>{room.description}</p>
<p>Room type: {room.roomType || "Standard Room"}</p>
<p>Capacity: {room.capacity} guests</p>
                  <div className="room-bottom">
                    <p>
                      ₹{Number(room.price).toLocaleString("en-IN")}{" "}
                      <span>/ night</span>
                    </p>

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRoom(room._id);
                        showSection("booking-form");
                      }}
                    >
                      Book Now
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer id="about">
        <h2>HotelPro.</h2>
        <p>Comfort, care and a stay to remember.</p>
        <p>© 2026 HotelPro. College project.</p>
      </footer>
    </div>
  );
}

export default App;
