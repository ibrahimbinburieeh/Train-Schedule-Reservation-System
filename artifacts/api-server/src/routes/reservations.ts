import { Router, type IRouter } from "express";
import { db, reservationsTable, passengersTable, schedulesTable, ticketsTable } from "@workspace/db";
import { eq, and, sql } from "drizzle-orm";

const router: IRouter = Router();

function generateTicketNumber(reservationId: number): string {
  const date = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  return `TKT-${date}-${String(reservationId).padStart(4, "0")}`;
}

function mapReservation(r: any, ticket?: { ticketNumber: string; issuedAt: string; ticketStatus: string } | null) {
  return {
    reservationId: r.reservationId,
    passengerId: r.passengerId,
    passengerName: r.passengerName,
    scheduleId: r.scheduleId,
    trainName: r.trainName,
    origin: r.origin,
    destination: r.destination,
    date: r.date,
    seatNumber: r.seatNumber,
    status: r.status,
    reservationDate: r.reservationDate,
    ticketPrice: parseFloat(r.ticketPrice),
    ...(ticket ? { ticketNumber: ticket.ticketNumber, ticketIssuedAt: ticket.issuedAt, ticketStatus: ticket.ticketStatus } : {}),
  };
}

router.get("/reservations", async (_req, res) => {
  const rows = await db.select().from(reservationsTable).orderBy(reservationsTable.reservationId);

  // Fetch all tickets in one query and map by reservationId
  const tickets = await db.select().from(ticketsTable);
  const ticketMap = new Map(tickets.map(t => [t.reservationId, t]));

  res.json(rows.map(r => {
    const t = ticketMap.get(r.reservationId);
    return mapReservation(r, t ? { ticketNumber: t.ticketNumber, issuedAt: String(t.issuedAt), ticketStatus: t.status } : null);
  }));
});

router.post("/reservations", async (req, res) => {
  const { passengerId, scheduleId } = req.body as { passengerId: number; scheduleId: number };

  const [passenger] = await db.select().from(passengersTable).where(eq(passengersTable.passengerId, passengerId));
  if (!passenger) { res.status(404).json({ error: "Passenger not found" }); return; }

  const [schedule] = await db.select().from(schedulesTable).where(eq(schedulesTable.scheduleId, scheduleId));
  if (!schedule) { res.status(404).json({ error: "Schedule not found" }); return; }
  if (schedule.availableSeats <= 0) { res.status(400).json({ error: "No seats available for this schedule" }); return; }

  // Find lowest unused seat number
  const confirmed = await db.select({ seatNumber: reservationsTable.seatNumber })
    .from(reservationsTable)
    .where(and(eq(reservationsTable.scheduleId, scheduleId), eq(reservationsTable.status, "confirmed")));
  const usedSeats = new Set(confirmed.map(r => r.seatNumber));
  let seatNumber = 1;
  while (usedSeats.has(seatNumber)) seatNumber++;

  // Decrement available seats atomically
  await db.update(schedulesTable)
    .set({ availableSeats: sql`${schedulesTable.availableSeats} - 1` })
    .where(eq(schedulesTable.scheduleId, scheduleId));

  const today = new Date().toISOString().split("T")[0]!;
  const [reservation] = await db.insert(reservationsTable).values({
    passengerId,
    passengerName: passenger.fullName,
    scheduleId,
    trainName: schedule.trainName,
    origin: schedule.origin,
    destination: schedule.destination,
    date: schedule.date,
    seatNumber,
    status: "confirmed",
    reservationDate: today,
    ticketPrice: schedule.ticketPrice,
  }).returning();

  // Auto-generate ticket for the new reservation
  const ticketNumber = generateTicketNumber(reservation!.reservationId);
  const [ticket] = await db.insert(ticketsTable).values({
    reservationId: reservation!.reservationId,
    ticketNumber,
    status: "active",
  }).returning();

  res.status(201).json(mapReservation(reservation, {
    ticketNumber: ticket!.ticketNumber,
    issuedAt: String(ticket!.issuedAt),
    ticketStatus: ticket!.status,
  }));
});

router.get("/reservations/:reservationId", async (req, res) => {
  const id = parseInt(req.params["reservationId"] ?? "0");
  const [r] = await db.select().from(reservationsTable).where(eq(reservationsTable.reservationId, id));
  if (!r) { res.status(404).json({ error: "Reservation not found" }); return; }
  const [t] = await db.select().from(ticketsTable).where(eq(ticketsTable.reservationId, id));
  res.json(mapReservation(r, t ? { ticketNumber: t.ticketNumber, issuedAt: String(t.issuedAt), ticketStatus: t.status } : null));
});

router.post("/reservations/:reservationId/cancel", async (req, res) => {
  const id = parseInt(req.params["reservationId"] ?? "0");
  const [r] = await db.select().from(reservationsTable).where(eq(reservationsTable.reservationId, id));
  if (!r) { res.status(404).json({ error: "Reservation not found" }); return; }
  if (r.status === "cancelled") { res.status(400).json({ error: "Reservation already cancelled" }); return; }

  const [updated] = await db.update(reservationsTable)
    .set({ status: "cancelled" })
    .where(eq(reservationsTable.reservationId, id))
    .returning();

  // Cancel the associated ticket
  await db.update(ticketsTable)
    .set({ status: "cancelled" })
    .where(eq(ticketsTable.reservationId, id));

  // Return seat to pool
  await db.update(schedulesTable)
    .set({ availableSeats: sql`${schedulesTable.availableSeats} + 1` })
    .where(eq(schedulesTable.scheduleId, r.scheduleId));

  const [t] = await db.select().from(ticketsTable).where(eq(ticketsTable.reservationId, id));
  res.json(mapReservation(updated, t ? { ticketNumber: t.ticketNumber, issuedAt: String(t.issuedAt), ticketStatus: t.status } : null));
});

export default router;
