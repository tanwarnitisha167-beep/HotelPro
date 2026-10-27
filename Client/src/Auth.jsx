
import { useState } from "react";
import axios from "axios";

function Auth({ onLogin }) {
  const [isSignup, setIsSignup] = useState(false);
  const [role, setRole] = useState("customer");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    setLoading(true);

    try {
      if (isSignup) {
        if (role !== "customer") {
          setMessage(
            "Admin accounts must be created by an administrator."
          );
          return;
        }

        const response = await axios.post(
          "http://localhost:8001/api/auth/signup",
          {
            name,
            email,
            password,
          }
        );

        setMessage(response.data.message);
        setIsSignup(false);
        setPassword("");
      } else {
        const response = await axios.post(
          "http://localhost:8001/api/auth/login",
          {
            email,
            password,
            role,
          }
        );

        onLogin(response.data);
      }
    } catch (error) {
      setMessage(
        error.response?.data?.message ||
          "Something went wrong. Please check the server."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <h1>
          HotelPro<span>.</span>
        </h1>

        <p>Your perfect stay starts here.</p>

        <div className="auth-roles">
          <button
            type="button"
            className={role === "customer" ? "selected" : ""}
            onClick={() => {
              setRole("customer");
              setMessage("");
            }}
          >
            Customer Login
          </button>

          <button
            type="button"
            className={role === "admin" ? "selected" : ""}
            onClick={() => {
              setRole("admin");
              setIsSignup(false);
              setMessage("");
            }}
          >
            Admin Login
          </button>
        </div>

        <h2>
          {isSignup
            ? "Create Customer Account"
            : role === "admin"
              ? "Admin Login"
              : "Customer Login"}
        </h2>

        <p>
          {isSignup
            ? "Create your account to book a room."
            : role === "admin"
              ? "Login to access the admin dashboard."
              : "Login to explore and book hotel rooms."}
        </p>

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          )}

          <input
            type="email"
            placeholder="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />

          <input
            type="password"
            placeholder="Password (minimum 8 characters)"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            minLength={8}
            required
          />

          <button type="submit" disabled={loading}>
            {loading
              ? "Please wait..."
              : isSignup
                ? "Create Customer Account"
                : role === "admin"
                  ? "Login as Admin"
                  : "Login as Customer"}
          </button>
        </form>

        {message && (
          <p className="auth-message">{message}</p>
        )}

        {role === "customer" && (
          <p>
            {isSignup
              ? "Already have an account?"
              : "New to HotelPro?"}{" "}

            <button
              type="button"
              className="auth-switch"
              onClick={() => {
                setIsSignup(!isSignup);
                setMessage("");
                setPassword("");
              }}
            >
              {isSignup ? "Login" : "Sign Up"}
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

export default Auth;
