import { Router, type IRouter } from "express";
import { db, schedulesTable, trainsTable, scheduleLogsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { sessions } from "./auth.js";

const router: IRouter = Router();

function resolveUserName(authHeader: string | undefined): string {
  const token = authHeader?.replace("Bearer ", "") ?? "";
  return (sessions as Map<string, any>).has(token) ? `user-${sessions.get(token)}` : "Unknown";
}

function nowStr(): string {
  return new Date().toISOString().replace("T", " ").substring(0, 16);
}

// Map DB row to API shape
function mapSchedule(s: any) {
  return {
    scheduleId: s.scheduleId,
    trainId: s.trainId,
    trainName: s.trainName,
    origin: s.origin,
    destination: s.destination,
    departureTime: s.departureTime,
    arrivalTime: s.arrivalTime,
    date: s.date,
    seatCapacity: s.seatCapacity,
    availableSeats: s.availableSeats,
    ticketPrice: parseFloat(s.ticketPrice),
    createdAt: s.createdAt,
    updatedAt: s.updatedAt,
  };
}

// GET /schedules/history — must be before /:scheduleId
router.get("/schedules/history", async (_req, res) => {
  const logs = await db.select().from(scheduleLogsTable).orderBy(desc(scheduleLogsTable.logId));
  res.json(logs.map(l => ({
    logId: l.logId, scheduleId: l.scheduleId, trainName: l.trainName,
    action: l.action, updatedBy: l.updatedBy, timestamp: l.timestamp,
  })));
});

router.get("/schedules", async (_req, res) => {
  const rows = await db.select().from(schedulesTable).orderBy(schedulesTable.scheduleId);
  res.json(rows.map(mapSchedule));
});

router.post("/schedules", async (req, res) => {
  const body = req.body as { trainId: number; origin: string; destination: string; departureTime: string; arrivalTime: string; date: string; ticketPrice: number; seatCapacity?: number };
  const [train] = await db.select().from(trainsTable).where(eq(trainsTable.trainId, body.trainId));
  if (!train) { res.status(404).json({ error: "Train not found" }); return; }

  const capacity = body.seatCapacity ?? train.seatCapacity;
  const today = new Date().toISOString().split("T")[0]!;

  const [schedule] = await db.insert(schedulesTable).values({
    trainId: body.trainId, trainName: train.trainName,
    origin: body.origin, destination: body.destination,
    departureTime: body.departureTime, arrivalTime: body.arrivalTime,
    date: body.date, seatCapacity: capacity, availableSeats: capacity,
    ticketPrice: String(body.ticketPrice), createdAt: today, updatedAt: today,
  }).returning();

  await db.insert(scheduleLogsTable).values({
    scheduleId: schedule!.scheduleId, trainName: train.trainName,
    action: "Created", updatedBy: resolveUserName(req.headers.authorization), timestamp: nowStr(),
  });

  res.status(201).json(mapSchedule(schedule));
});

router.put("/schedules/:scheduleId", async (req, res) => {
  const id = parseInt(req.params["scheduleId"] ?? "0");
  const body = req.body as { trainId: number; origin: string; destination: string; departureTime: string; arrivalTime: string; date: string; ticketPrice: number; seatCapacity?: number };

  const [existing] = await db.select().from(schedulesTable).where(eq(schedulesTable.scheduleId, id));
  if (!existing) { res.status(404).json({ error: "Schedule not found" }); return; }

  const [train] = await db.select().from(trainsTable).where(eq(trainsTable.trainId, body.trainId));
  if (!train) { res.status(404).json({ error: "Train not found" }); return; }

  const capacity = body.seatCapacity ?? existing.seatCapacity;
  const today = new Date().toISOString().split("T")[0]!;

  const [updated] = await db.update(schedulesTable).set({
    trainId: body.trainId, trainName: train.trainName,
    origin: body.origin, destination: body.destination,
    departureTime: body.departureTime, arrivalTime: body.arrivalTime,
    date: body.date, seatCapacity: capacity,
    ticketPrice: String(body.ticketPrice), updatedAt: today,
  }).where(eq(schedulesTable.scheduleId, id)).returning();

  await db.insert(scheduleLogsTable).values({
    scheduleId: id, trainName: train.trainName,
    action: "Updated", updatedBy: resolveUserName(req.headers.authorization), timestamp: nowStr(),
  });

  res.json(mapSchedule(updated));
});

router.delete("/schedules/:scheduleId", async (req, res) => {
  const id = parseInt(req.params["scheduleId"] ?? "0");
  const [deleted] = await db.delete(schedulesTable).where(eq(schedulesTable.scheduleId, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Schedule not found" }); return; }

  await db.insert(scheduleLogsTable).values({
    scheduleId: id, trainName: deleted.trainName,
    action: "Deleted", updatedBy: resolveUserName(req.headers.authorization), timestamp: nowStr(),
  });

  res.json({ message: "Schedule deleted" });
});

export default router;
