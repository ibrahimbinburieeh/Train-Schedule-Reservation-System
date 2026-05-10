import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { TrainLogo } from "@/components/train-logo";

function EyeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

function EyeOffIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" />
      <path d="M14.12 14.12a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

type ForgotStep = "email" | "code" | "newpass" | "done";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [, setLocation] = useLocation();
  const { login } = useAuth();
  const [rememberMe, setRememberMe] = useState(false);

  const [showForgot, setShowForgot] = useState(false);
  const [forgotStep, setForgotStep] = useState<ForgotStep>("email");
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotCode, setForgotCode] = useState("");
  const [forgotDemoCode, setForgotDemoCode] = useState("");
  const [forgotNewPass, setForgotNewPass] = useState("");
  const [forgotConfirmPass, setForgotConfirmPass] = useState("");
  const [showNewPass, setShowNewPass] = useState(false);
  const [forgotError, setForgotError] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => { if (cooldownRef.current) clearInterval(cooldownRef.current); };
  }, []);

  const startCooldown = () => {
    setResendCooldown(60);
    if (cooldownRef.current) clearInterval(cooldownRef.current);
    cooldownRef.current = setInterval(() => {
      setResendCooldown((s) => {
        if (s <= 1) { clearInterval(cooldownRef.current!); return 0; }
        return s - 1;
      });
    }, 1000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid email or password. Please try again.");
        return;
      }
      login(data.token, data.user, rememberMe);
      if (data.user.role === "staff") {
        setLocation("/staff");
      } else {
        setLocation("/admin");
      }
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || "Failed. Please try again."); return; }
      setForgotDemoCode(data.code || "");
      setForgotStep("code");
      startCooldown();
    } catch {
      setForgotError("An error occurred. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/verify-reset-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: forgotCode }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || "Incorrect code."); return; }
      setForgotStep("newpass");
    } catch {
      setForgotError("An error occurred. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const handleForgotReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotError("");
    if (forgotNewPass !== forgotConfirmPass) {
      setForgotError("Passwords do not match.");
      return;
    }
    if (forgotNewPass.length < 6) {
      setForgotError("Password must be at least 6 characters.");
      return;
    }
    setForgotLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: forgotEmail, code: forgotCode, newPassword: forgotNewPass }),
      });
      const data = await res.json();
      if (!res.ok) { setForgotError(data.error || "Failed to reset password."); return; }
      setForgotStep("done");
    } catch {
      setForgotError("An error occurred. Please try again.");
    } finally {
      setForgotLoading(false);
    }
  };

  const resetForgot = () => {
    setShowForgot(false);
    setForgotStep("email");
    setForgotEmail("");
    setForgotCode("");
    setForgotDemoCode("");
    setForgotNewPass("");
    setForgotConfirmPass("");
    setForgotError("");
  };

  const subtitle = !showForgot
    ? "Sign in to your account"
    : forgotStep === "email" ? "Reset your password"
    : forgotStep === "code" ? "Enter security code"
    : forgotStep === "newpass" ? "Set new password"
    : "Password reset";

  return (
    <div style={{ minHeight: "100vh", background: "#E8EDF2", display: "flex", alignItems: "center", justifyContent: "center", padding: "1.5rem" }}>
      <div className="auth-card" style={{ width: "100%", maxWidth: "420px", padding: "2.5rem 2rem" }}>
        <div style={{ textAlign: "center", marginBottom: "1.75rem" }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: "0.85rem" }}>
            <TrainLogo size={72} />
          </div>
          <h1 style={{ color: "#2C3947", fontSize: "1.35rem", fontWeight: "bold", lineHeight: 1.3, margin: 0 }}>
            Train Schedule &amp; Reservation System
          </h1>
          <p style={{ color: "#547A95", fontSize: "0.85rem", marginTop: "0.3rem" }}>
            {subtitle}
          </p>
        </div>

        {!showForgot ? (
          <>
            {error && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.6rem 0.85rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>
                {error}
              </div>
            )}
            <form onSubmit={handleSubmit}>
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
              <div style={{ marginBottom: "1.5rem" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: "0.35rem" }}>
                  <label style={{ color: "#2C3947", fontWeight: "600", fontSize: "0.9rem" }} htmlFor="password">
                    Password
                  </label>
                  <button
                    type="button"
                    onClick={() => { setShowForgot(true); setError(""); }}
                    style={{ background: "none", border: "none", color: "#547A95", fontSize: "0.8rem", cursor: "pointer", textDecoration: "underline", padding: 0, lineHeight: 1 }}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div style={{ position: "relative" }}>
                  <input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    className="auth-input"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    data-testid="input-password"
                    placeholder="Enter your password"
                    style={{ paddingRight: "2.75rem" }}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7a95a8", padding: "0.1rem", display: "flex", alignItems: "center" }}
                  >
                    {showPassword ? <EyeIcon /> : <EyeOffIcon />}
                  </button>
                </div>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "1.25rem" }}>
                <input
                  id="remember-me"
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  style={{ width: "15px", height: "15px", accentColor: "#547A95", cursor: "pointer", flexShrink: 0 }}
                />
                <label htmlFor="remember-me" style={{ color: "#547A95", fontSize: "0.875rem", cursor: "pointer", userSelect: "none" }}>
                  Remember me
                </label>
              </div>
              <button type="submit" className="auth-btn" disabled={loading} data-testid="button-login">
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>
          </>
        ) : (
          <>
            {forgotError && (
              <div style={{ background: "#fef2f2", border: "1px solid #fca5a5", color: "#b91c1c", padding: "0.6rem 0.85rem", borderRadius: "4px", marginBottom: "1rem", fontSize: "0.9rem" }}>
                {forgotError}
              </div>
            )}

            {forgotStep === "email" && (
              <form onSubmit={handleForgotEmail}>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="forgot-email">
                    Email address
                  </label>
                  <input
                    id="forgot-email"
                    type="email"
                    className="auth-input"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    required
                    placeholder="Enter your account email"
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={forgotLoading}>
                  {forgotLoading ? "Sending..." : "Send Security Code"}
                </button>
              </form>
            )}

            {forgotStep === "code" && (
              <form onSubmit={handleForgotCode}>
                {forgotDemoCode && (
                  <div style={{ background: "#f0fdf4", border: "1px solid #86efac", borderRadius: "6px", padding: "0.75rem 1rem", marginBottom: "1.25rem" }}>
                    <p style={{ margin: 0, fontSize: "0.875rem", color: "#166534", fontWeight: "600" }}>
                      ✓ A security code has been sent to your email. Please check your inbox and enter the code below.
                    </p>
                  </div>
                )}
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="forgot-code">
                    6-digit security code
                  </label>
                  <input
                    id="forgot-code"
                    type="text"
                    inputMode="numeric"
                    className="auth-input"
                    value={forgotCode}
                    onChange={(e) => setForgotCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    required
                    placeholder="Enter 6-digit code"
                    style={{ letterSpacing: "0.2em", fontSize: "1.1rem", textAlign: "center" }}
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={forgotLoading || forgotCode.length !== 6}>
                  {forgotLoading ? "Verifying..." : "Verify Code"}
                </button>
                <p style={{ textAlign: "center", marginTop: "0.75rem", fontSize: "0.82rem", color: "#547A95" }}>
                  Didn't receive it?{" "}
                  {resendCooldown > 0 ? (
                    <span style={{ color: "#94a3b8", fontWeight: "600" }}>
                      Resend in 0:{String(resendCooldown).padStart(2, "0")}
                    </span>
                  ) : (
                    <button type="button" onClick={() => { setForgotStep("email"); setForgotCode(""); setForgotDemoCode(""); setForgotError(""); }}
                      style={{ background: "none", border: "none", color: "#547A95", fontSize: "0.82rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                      Resend
                    </button>
                  )}
                </p>
              </form>
            )}

            {forgotStep === "newpass" && (
              <form onSubmit={handleForgotReset}>
                <div style={{ marginBottom: "1rem" }}>
                  <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="new-pass">
                    New password
                  </label>
                  <div style={{ position: "relative" }}>
                    <input
                      id="new-pass"
                      type={showNewPass ? "text" : "password"}
                      className="auth-input"
                      value={forgotNewPass}
                      onChange={(e) => setForgotNewPass(e.target.value)}
                      required
                      placeholder="At least 6 characters"
                      style={{ paddingRight: "2.75rem" }}
                    />
                    <button type="button" onClick={() => setShowNewPass((v) => !v)}
                      style={{ position: "absolute", right: "0.65rem", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "#7a95a8", padding: "0.1rem", display: "flex", alignItems: "center" }}>
                      {showNewPass ? <EyeIcon /> : <EyeOffIcon />}
                    </button>
                  </div>
                </div>
                <div style={{ marginBottom: "1.25rem" }}>
                  <label style={{ display: "block", color: "#2C3947", fontWeight: "600", marginBottom: "0.35rem", fontSize: "0.9rem" }} htmlFor="confirm-pass">
                    Confirm new password
                  </label>
                  <input
                    id="confirm-pass"
                    type={showNewPass ? "text" : "password"}
                    className="auth-input"
                    value={forgotConfirmPass}
                    onChange={(e) => setForgotConfirmPass(e.target.value)}
                    required
                    placeholder="Repeat new password"
                  />
                </div>
                <button type="submit" className="auth-btn" disabled={forgotLoading}>
                  {forgotLoading ? "Updating..." : "Set New Password"}
                </button>
              </form>
            )}

            {forgotStep === "done" && (
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>✓</div>
                <p style={{ color: "#166534", fontWeight: "600", fontSize: "1rem", marginBottom: "0.4rem" }}>Password updated!</p>
                <p style={{ color: "#547A95", fontSize: "0.875rem", marginBottom: "1.5rem" }}>You can now sign in with your new password.</p>
                <button type="button" className="auth-btn" onClick={resetForgot}>
                  Back to Login
                </button>
              </div>
            )}

            {forgotStep !== "done" && (
              <p style={{ textAlign: "center", marginTop: "1.25rem", fontSize: "0.875rem" }}>
                <button type="button" onClick={resetForgot}
                  style={{ background: "none", border: "none", color: "#547A95", fontSize: "0.875rem", cursor: "pointer", textDecoration: "underline", padding: 0 }}>
                  ← Back to Login
                </button>
              </p>
            )}
          </>
        )}
      </div>
    </div>
  );
}
