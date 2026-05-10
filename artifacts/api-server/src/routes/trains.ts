import { Router, type IRouter } from "express";
import { db, trainsTable, schedulesTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/trains", async (_req, res) => {
  const rows = await db.select().from(trainsTable).orderBy(trainsTable.trainId);
  res.json(rows.map(t => ({ trainId: t.trainId, trainName: t.trainName, seatCapacity: t.seatCapacity })));
});

router.post("/trains", async (req, res) => {
  const { trainName, seatCapacity } = req.body as { trainName: string; seatCapacity: number };
  const [train] = await db.insert(trainsTable).values({ trainName, seatCapacity }).returning();
  res.status(201).json({ trainId: train!.trainId, trainName: train!.trainName, seatCapacity: train!.seatCapacity });
});

router.put("/trains/:trainId", async (req, res) => {
  const id = parseInt(req.params["trainId"] ?? "0");
  const { trainName, seatCapacity } = req.body as { trainName: string; seatCapacity: number };
  const [updated] = await db.update(trainsTable).set({ trainName, seatCapacity }).where(eq(trainsTable.trainId, id)).returning();
  if (!updated) { res.status(404).json({ error: "Train not found" }); return; }
  // Keep schedule train names in sync
  await db.update(schedulesTable).set({ trainName }).where(eq(schedulesTable.trainId, id));
  res.json({ trainId: updated.trainId, trainName: updated.trainName, seatCapacity: updated.seatCapacity });
});

router.delete("/trains/:trainId", async (req, res) => {
  const id = parseInt(req.params["trainId"] ?? "0");
  const [deleted] = await db.delete(trainsTable).where(eq(trainsTable.trainId, id)).returning();
  if (!deleted) { res.status(404).json({ error: "Train not found" }); return; }
  res.json({ message: "Train deleted" });
});

export default router;
