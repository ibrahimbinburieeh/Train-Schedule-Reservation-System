import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { sessions } from "./auth.js";

const router: IRouter = Router();

async function getRequestingUser(authHeader: string | undefined) {
  const token = authHeader?.replace("Bearer ", "") || "";
  const userId = sessions.get(token);
  if (!userId) return null;
  const [user] = await db.select().from(usersTable).where(eq(usersTable.userId, userId));
  return user || null;
}

router.get("/users", async (req, res) => {
  const requester = await getRequestingUser(req.headers.authorization);
  if (!requester) { res.status(401).json({ error: "Not authenticated." }); return; }
  if (requester.role === "staff") { res.status(403).json({ error: "Access denied." }); return; }
  const rows = await db
    .select({ userId: usersTable.userId, name: usersTable.name, email: usersTable.email, role: usersTable.role })
    .from(usersTable)
    .orderBy(usersTable.userId);
  res.json(rows);
});

router.post("/users", async (req, res) => {
  const requester = await getRequestingUser(req.headers.authorization);
  if (!requester) { res.status(401).json({ error: "Not authenticated." }); return; }
  if (requester.role === "staff") { res.status(403).json({ error: "Access denied." }); return; }

  const { name, email, password, role } = req.body as { name: string; email: string; password: string; role: string };
  if (!name || !email || !password || !role) { res.status(400).json({ error: "All fields are required." }); return; }

  if (requester.role === "admin") {
    if (role !== "staff") {
      res.status(403).json({ error: "Administrators can create Staff accounts only." });
      return;
    }
  }

  if (requester.role === "super_administrator") {
    if (!["admin", "staff"].includes(role)) {
      res.status(400).json({ error: "Role must be 'admin' or 'staff'." });
      return;
    }
  }

  const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
  if (existing) { res.status(400).json({ error: "An account with this email already exists." }); return; }

  const [user] = await db.insert(usersTable).values({ name, email, password, role }).returning();
  res.status(201).json({ userId: user!.userId, name: user!.name, email: user!.email, role: user!.role });
});

router.put("/users/:userId", async (req, res) => {
  const requester = await getRequestingUser(req.headers.authorization);
  if (!requester) { res.status(401).json({ error: "Not authenticated." }); return; }
  if (requester.role === "staff") { res.status(403).json({ error: "Access denied." }); return; }

  const id = parseInt(req.params["userId"] ?? "0");
  const [target] = await db.select().from(usersTable).where(eq(usersTable.userId, id));
  if (!target) { res.status(404).json({ error: "User not found." }); return; }

  if (target.role === "super_administrator") {
    res.status(403).json({ error: "Super Administrator cannot be modified." }); return;
  }
  if (requester.role === "admin" && target.role !== "staff") {
    res.status(403).json({ error: "Administrators can only edit Staff accounts." }); return;
  }

  const { name, email, password } = req.body as { name?: string; email?: string; password?: string };
  if (!name && !email && !password) { res.status(400).json({ error: "Nothing to update." }); return; }

  if (email && email !== target.email) {
    const [existing] = await db.select().from(usersTable).where(eq(usersTable.email, email));
    if (existing) { res.status(400).json({ error: "Email is already in use." }); return; }
  }

  const updates: Partial<{ name: string; email: string; password: string }> = {};
  if (name) updates.name = name;
  if (email) updates.email = email;
  if (password) updates.password = password;

  const [updated] = await db.update(usersTable).set(updates).where(eq(usersTable.userId, id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found." }); return; }
  res.json({ userId: updated.userId, name: updated.name, email: updated.email, role: updated.role });
});

router.put("/users/:userId/role", async (req, res) => {
  const requester = await getRequestingUser(req.headers.authorization);
  if (!requester) { res.status(401).json({ error: "Not authenticated." }); return; }
  if (requester.role === "staff" || requester.role === "admin") {
    res.status(403).json({ error: "Only Super Administrators can change user roles." });
    return;
  }

  const id = parseInt(req.params["userId"] ?? "0");
  const [target] = await db.select().from(usersTable).where(eq(usersTable.userId, id));
  if (!target) { res.status(404).json({ error: "User not found." }); return; }

  if (target.role === "super_administrator") {
    res.status(403).json({ error: "Super Administrator cannot be modified." });
    return;
  }

  const { role } = req.body as { role: string };
  if (!["admin", "staff"].includes(role)) { res.status(400).json({ error: "Invalid role." }); return; }

  const [updated] = await db.update(usersTable).set({ role }).where(eq(usersTable.userId, id)).returning();
  if (!updated) { res.status(404).json({ error: "User not found." }); return; }
  res.json({ userId: updated.userId, name: updated.name, email: updated.email, role: updated.role });
});

router.delete("/users/:userId", async (req, res) => {
  const requester = await getRequestingUser(req.headers.authorization);
  if (!requester) { res.status(401).json({ error: "Not authenticated." }); return; }
  if (requester.role === "staff") { res.status(403).json({ error: "Access denied." }); return; }

  const id = parseInt(req.params["userId"] ?? "0");
  const [target] = await db.select().from(usersTable).where(eq(usersTable.userId, id));
  if (!target) { res.status(404).json({ error: "User not found." }); return; }

  if (target.role === "super_administrator") {
    res.status(403).json({ error: "Super Administrator cannot be deleted." });
    return;
  }

  if (requester.role === "admin" && target.role !== "staff") {
    res.status(403).json({ error: "Administrators can only delete Staff accounts." });
    return;
  }

  const [deleted] = await db.delete(usersTable).where(eq(usersTable.userId, id)).returning();
  if (!deleted) { res.status(404).json({ error: "User not found." }); return; }

  for (const [token, uid] of sessions.entries()) {
    if (uid === id) sessions.delete(token);
  }
  res.json({ message: "User deleted successfully." });
});

export default router;
