import { Router, type IRouter } from "express";
import { db } from "@workspace/db";
import { usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

export const sessions: Map<string, number> = new Map();

interface ResetEntry { code: string; expires: number; }
const resetCodes: Map<string, ResetEntry> = new Map();

function roleLabel(role: string): string {
  if (role === "super_administrator") return "Super Administrator";
  if (role === "admin") return "Administrator";
  return "Staff";
}

router.post("/auth/login", async (req, res) => {
  const { email, password } = req.body as { email: string; password: string };
  if (!email || !password) {
    res.status(400).json({ error: "Email and password are required." });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user || user.password !== password) {
      res.status(401).json({ error: "Invalid email or password. Please try again." });
      return;
    }
    const token = `token-${user.userId}-${Date.now()}`;
    sessions.set(token, user.userId);
    res.cookie("session", token, { httpOnly: true });
    res.json({
      user: { userId: user.userId, name: user.name, email: user.email, role: user.role },
      message: "Login successful",
      token,
    });
  } catch {
    res.status(500).json({ error: "Login failed. Please try again." });
  }
});

router.post("/auth/logout", (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  sessions.delete(token);
  res.clearCookie("session");
  res.json({ message: "Logged out successfully" });
});

router.post("/auth/forgot-password", async (req, res) => {
  const { email } = req.body as { email: string };
  if (!email) {
    res.status(400).json({ error: "Email is required." });
    return;
  }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (!user) {
      res.json({ message: "If that email exists, a security code has been sent." });
      return;
    }
    const code = String(Math.floor(100000 + Math.random() * 900000));
    resetCodes.set(email.toLowerCase(), { code, expires: Date.now() + 10 * 60 * 1000 });
    req.log.info({ email }, "Password reset code generated");
    res.json({ message: "If that email exists, a security code has been sent.", code });
  } catch {
    res.status(500).json({ error: "Failed to process request." });
  }
});

router.post("/auth/verify-reset-code", (req, res) => {
  const { email, code } = req.body as { email: string; code: string };
  if (!email || !code) {
    res.status(400).json({ error: "Email and code are required." });
    return;
  }
  const entry = resetCodes.get(email.toLowerCase());
  if (!entry) {
    res.status(400).json({ error: "No reset code found. Please request a new one." });
    return;
  }
  if (Date.now() > entry.expires) {
    resetCodes.delete(email.toLowerCase());
    res.status(400).json({ error: "This code has expired. Please request a new one." });
    return;
  }
  if (entry.code !== code.trim()) {
    res.status(400).json({ error: "Incorrect code. Please try again." });
    return;
  }
  res.json({ message: "Code verified." });
});

router.post("/auth/reset-password", async (req, res) => {
  const { email, code, newPassword } = req.body as { email: string; code: string; newPassword: string };
  if (!email || !code || !newPassword) {
    res.status(400).json({ error: "Email, code, and new password are required." });
    return;
  }
  const entry = resetCodes.get(email.toLowerCase());
  if (!entry || entry.code !== code.trim() || Date.now() > entry.expires) {
    res.status(400).json({ error: "Invalid or expired code." });
    return;
  }
  if (newPassword.length < 6) {
    res.status(400).json({ error: "Password must be at least 6 characters." });
    return;
  }
  try {
    await db.update(usersTable).set({ password: newPassword }).where(eq(usersTable.email, email));
    resetCodes.delete(email.toLowerCase());
    res.json({ message: "Password updated successfully." });
  } catch {
    res.status(500).json({ error: "Failed to update password." });
  }
});

router.get("/auth/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "") || "";
  const userId = sessions.get(token);
  if (!userId) { res.status(401).json({ error: "Not authenticated" }); return; }
  try {
    const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, userId));
    if (!user) { res.status(401).json({ error: "User not found" }); return; }
    res.json({ userId: user.userId, name: user.name, email: user.email, role: user.role });
  } catch {
    res.status(500).json({ error: "Failed to fetch user" });
  }
});

export { roleLabel };
export default router;
