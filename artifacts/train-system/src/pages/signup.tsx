import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { TrainLogo } from "@/components/train-logo";

export default function Signup() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState("staff");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setError("Password must be at least 6 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: fullName, email, password, role }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Could not create account. Please try again.");
        return;
      }
      login(data.token, data.user, false);
      if (data.user.role === "admin") {
        setLocation("/admin");
      } else {
        setLocation("/staff");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{ minHeight: "100vh", background: "#E8EDF2", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}
    >
      <div className="auth-card" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.75rem" }}>
            <TrainLogo size={72} />
          </div>
          <h1 style={{ color: "#2C3947", fontSize: "1.35rem", fontWeight: "bold", lineHeight: 1.3, margin: 0 }}>
            Train Schedule &amp; Reservation System
          </h1>
          <p style={{ color: "#547A95", fontSize: "0.85rem", marginTop: "0.3rem" }}>Create a new account</p>
        </div>

        {error && (
          <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.6rem 0.85rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="fullName">
              Full Name
            </label>
            <input
              id="fullName"
              type="text"
              className="auth-input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
              data-testid="input-fullname"
              placeholder="Enter your full name"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="email">
              Email
            </label>
            <input
              id="email"
              type="email"
              className="auth-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              data-testid="input-email"
              placeholder="Enter your email"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="auth-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              data-testid="input-password"
              placeholder="Create a password"
            />
          </div>

          <div style={{ marginBottom: "1rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="confirmPassword">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              className="auth-input"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              data-testid="input-confirm-password"
              placeholder="Repeat your password"
            />
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="role">
              Role
            </label>
            <select
              id="role"
              className="auth-select"
              value={role}
              onChange={(e) => setRole(e.target.value)}
              data-testid="select-role"
            >
              <option value="staff">Staff</option>
              <option value="admin">Administrator</option>
            </select>
          </div>

          <button
            type="submit"
            className="auth-btn"
            disabled={loading}
            data-testid="button-signup"
          >
            {loading ? "Creating account..." : "Create Account"}
          </button>
        </form>

        <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem", color: "#546070" }}>
          Already have an account?{" "}
          <a
            href="/"
            onClick={(e) => { e.preventDefault(); setLocation("/"); }}
            style={{ color: "#547A95", fontWeight: "600", textDecoration: "underline", cursor: "pointer" }}
            data-testid="link-login"
          >
            Login
          </a>
        </p>
      </div>
    </div>
  );
}
