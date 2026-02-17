import { useState } from "react";
import "./Register.css";
import axios from "axios";

export default function Register({ onLoginClick }) {
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",      // ✅ added
    email: "",
    password: "",
    role: "",
  });

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/register", form);
      alert("Registration successful! Please log in.");
    } catch (error) {
      alert("Registration failed. Please try again.");
    }
  };

  return (
    <div className="register-container">

      <header className="register-header">
        SHIFT-UP
      </header>

      <form className="register-card" onSubmit={handleSubmit}>

        <h2>Get Started Now</h2>
        <p>Enter your credentials to access your account</p>

        {/* ✅ First Name */}
        <input
          type="text"
          name="firstName"
          placeholder="First Name"
          onChange={handleChange}
          required
        />

        {/* ✅ Last Name */}
        <input
          type="text"
          name="lastName"
          placeholder="Last Name"
          onChange={handleChange}
          required
        />

        <input
          type="email"
          name="email"
          placeholder="Email address"
          onChange={handleChange}
          required
        />

        <input
          type="password"
          name="password"
          placeholder="Password"
          onChange={handleChange}
          required
        />

        <select name="role" onChange={handleChange} required>
          <option value="">Select Role</option>
          <option value="employee">Employee</option>
          <option value="manager">Manager</option>
          <option value="owner">Owner</option>
        </select>

        <div className="terms">
          <label>
            <input type="checkbox" required />
          </label>
          <label>I agree to the Terms & Policy</label>
        </div>

        <button type="submit">Signup</button>

        <div className="divider">or</div>

        <div className="social-buttons">
          <button type="button" className="google">Sign in with Google</button>
          <button type="button" className="apple">Sign in with Apple</button>
        </div>

        <p className="signin-link">
          Have an account?
          <span onClick={onLoginClick}> Sign in</span>
        </p>

      </form>

    </div>
  );
}