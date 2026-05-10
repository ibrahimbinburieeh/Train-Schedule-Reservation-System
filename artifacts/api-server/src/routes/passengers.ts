import { Router, type IRouter } from "express";
import { db, passengersTable, reservationsTable, ticketsTable, schedulesTable } from "@workspace/db";
import { eq, or, ilike, sql } from "drizzle-orm";

const router: IRouter = Router();

function mapPassenger(p: any) {
  return { passengerId: p.passengerId, fullName: p.fullName, phoneNumber: p.phoneNumber, identificationNumber: p.identificationNumber, email: p.email };
}

router.get("/passengers", async (req, res) => {
  const search = (req.query["search"] as string | undefined)?.trim();
  let rows;
  if (search) {
    rows = await db.select().from(passengersTable).where(
      or(ilike(passengersTable.fullName, `%${search}%`), ilike(passengersTable.phoneNumber, `%${search}%`), ilike(passengersTable.identificationNumber, `%${search}%`))
    );
  } else {
    rows = await db.select().from(passengersTable).orderBy(passengersTable.passengerId);
  }
  res.json(rows.map(mapPassenger));
});

router.post("/passengers", async (req, res) => {
  const body = req.body as { fullName: string; phoneNumber: string; identificationNumber: string; email?: string };
  const [existing] = await db.select().from(passengersTable).where(eq(passengersTable.identificationNumber, body.identificationNumber));
  if (existing) { res.status(400).json({ error: "Passenger with this ID number already exists" }); return; }
  const [p] = await db.insert(passengersTable).values({ fullName: body.fullName, phoneNumber: body.phoneNumber, identificationNumber: body.identificationNumber, email: body.email ?? null }).returning();
  res.status(201).json(mapPassenger(p));
});

router.get("/passengers/:passengerId", async (req, res) => {
  const id = parseInt(req.params["passengerId"] ?? "0");
  const [p] = await db.select().from(passengersTable).where(eq(passengersTable.passengerId, id));
  if (!p) { res.status(404).json({ error: "Passenger not found" }); return; }
  res.json(mapPassenger(p));
});

router.put("/passengers/:passengerId", async (req, res) => {
  const id = parseInt(req.params["passengerId"] ?? "0");
  const body = req.body as { fullName: string; phoneNumber: string; identificationNumber: string; email?: string };
  const [updated] = await db.update(passengersTable).set({ fullName: body.fullName, phoneNumber: body.phoneNumber, identificationNumber: body.identificationNumber, email: body.email ?? null }).where(eq(passengersTable.passengerId, id)).returning();
  if (!updated) { res.status(404).json({ error: "Passenger not found" }); return; }
  res.json(mapPassenger(updated));
});

router.delete("/passengers/:passengerId", async (req, res) => {
  const id = parseInt(req.params["passengerId"] ?? "0");
  const force = req.query["force"] === "true";

  const [passenger] = await db.select().from(passengersTable).where(eq(passengersTable.passengerId, id));
  if (!passenger) { res.status(404).json({ error: "Passenger not found" }); return; }

  // Check for existing reservations in Supabase
  const existing = await db
    .select({ reservationId: reservationsTable.reservationId, scheduleId: reservationsTable.scheduleId, status: reservationsTable.status })
    .from(reservationsTable)
    .where(eq(reservationsTable.passengerId, id));

  if (existing.length > 0 && !force) {
    // Return 409 so the frontend knows to show the force-delete warning modal
    res.status(409).json({
      error: "Passenger has existing reservations.",
      hasReservations: true,
      reservationCount: existing.length,
    });
    return;
  }

  if (existing.length > 0 && force) {
    // Cascade delete:
    // 1. Restore available seats for every CONFIRMED reservation
    const confirmed = existing.filter(r => r.status === "confirmed");
    for (const r of confirmed) {
      await db.update(schedulesTable)
        .set({ availableSeats: sql`${schedulesTable.availableSeats} + 1` })
        .where(eq(schedulesTable.scheduleId, r.scheduleId));
    }

    // 2. Delete tickets linked to these reservations
    for (const r of existing) {
      await db.delete(ticketsTable).where(eq(ticketsTable.reservationId, r.reservationId));
    }

    // 3. Delete all reservations
    await db.delete(reservationsTable).where(eq(reservationsTable.passengerId, id));
  }

  // 4. Delete the passenger
  await db.delete(passengersTable).where(eq(passengersTable.passengerId, id));
  res.json({ message: "Passenger and related reservations deleted successfully." });
});

export default router;
