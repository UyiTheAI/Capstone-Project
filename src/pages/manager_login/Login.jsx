import React, { useState } from "react";
import "./Login.css";
import logo from "../../assets/up-text-icon.jpg";

const Login = ({ onLogin }) => {
  const [email, setEmail] = useState("");

  const handleLogin = () => {
    if (!email) return;

    // Simple role detection
    const role = email.includes("manager") ? "manager" : "employee";

    const userData = {
      name: email.split("@")[0],
      role,
    };

    onLogin(userData); // 🔥 This sends user to Dashboard
  };

  return (
    <div className="login-page">
      {/* Header */}
      <header className="login-header">
        <div className="logo">
          <img src={logo} alt="Logo" />
          <span className="logo-text">SHIFT-UP</span>
        </div>

        <div className="portal-links">
          <button className="portal-btn active">Manager Portal</button>
          <button className="portal-btn">Employee Portal</button>
          <button className="portal-btn">Owner Portal</button>
        </div>
      </header>

      {/* Form */}
      <div className="login-container">
        <h1>Welcome back!</h1>
        <p>Enter your Credentials to access your account</p>

        <label>Email address</label>
        <input
          type="email"
          placeholder="Enter your email"
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-row">
          <label>Password</label>
          <a href="/">forgot password</a>
        </div>
        <input type="password" placeholder="Name" />

        <div className="remember">
          <input type="checkbox" />
          <span>Remember for 30 days</span>
        </div>

        <button className="login-btn" onClick={handleLogin}>
          Login
        </button>

        <div className="socials">
          <button className="social-btn">Sign in with Google</button>
          <button className="social-btn">Sign in with Apple</button>
        </div>

        <p className="signup">
          Don’t have an account? <span>Sign Up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
