import { useState } from "react";
import { API_BASE } from "./constants";

function Login({ onLogin }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [mode, setMode] = useState("login");

  const handleLogin = (e) => {
    e.preventDefault();
    const body = new URLSearchParams({ username, password });
    fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    })
      .then((res) => {
        if (!res.ok) throw new Error("Invalid credentials");
        return res.json();
      })
      .then((data) => {
        localStorage.setItem("token", data.access_token);
        onLogin();
      })
      .catch(() => setError("Invalid username or password"));
  };

  const handleRegister = (e) => {
    e.preventDefault();
    fetch(`${API_BASE}/auth/register?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`, {
      method: "POST",
    })
      .then((res) => {
        if (!res.ok) throw new Error("Registration failed");
        return res.json();
      })
      .then(() => {
        setError("");
        setMode("login");
        setUsername("");
        setPassword("");
      })
      .catch(() => setError("Username already exists"));
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-brand">DOBER</h1>
        <p className="login-subtitle">AI Surveillance System</p>
        <form onSubmit={mode === "login" ? handleLogin : handleRegister}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          {error && <p className="login-error">{error}</p>}
          <button type="submit" className="login-btn">
            {mode === "login" ? "Login" : "Register"}
          </button>
        </form>
        <p className="login-toggle" onClick={() => { setMode(mode === "login" ? "register" : "login"); setUsername(""); setPassword(""); setError(""); }}>
          {mode === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
        </p>
      </div>
    </div>
  );
}

export default Login;
