import { Router, type IRouter } from "express";
import { db, ticketsTable, reservationsTable } from "@workspace/db";
import { eq } from "drizzle-orm";

const router: IRouter = Router();

router.get("/tickets", async (_req, res) => {
  const rows = await db
    .select({
      id: ticketsTable.id,
      reservationId: ticketsTable.reservationId,
      ticketNumber: ticketsTable.ticketNumber,
      issuedAt: ticketsTable.issuedAt,
      status: ticketsTable.status,
      passengerName: reservationsTable.passengerName,
      trainName: reservationsTable.trainName,
      origin: reservationsTable.origin,
      destination: reservationsTable.destination,
      date: reservationsTable.date,
      seatNumber: reservationsTable.seatNumber,
    })
    .from(ticketsTable)
    .innerJoin(reservationsTable, eq(ticketsTable.reservationId, reservationsTable.reservationId))
    .orderBy(ticketsTable.id);

  res.json(rows.map(t => ({
    id: t.id,
    reservationId: t.reservationId,
    ticketNumber: t.ticketNumber,
    issuedAt: t.issuedAt,
    status: t.status,
    passengerName: t.passengerName,
    trainName: t.trainName,
    origin: t.origin,
    destination: t.destination,
    date: t.date,
    seatNumber: t.seatNumber,
  })));
});

router.get("/tickets/:id", async (req, res) => {
  const id = parseInt(req.params["id"] ?? "0");
  const [row] = await db
    .select({
      id: ticketsTable.id,
      reservationId: ticketsTable.reservationId,
      ticketNumber: ticketsTable.ticketNumber,
      issuedAt: ticketsTable.issuedAt,
      status: ticketsTable.status,
      passengerName: reservationsTable.passengerName,
      trainName: reservationsTable.trainName,
      origin: reservationsTable.origin,
      destination: reservationsTable.destination,
      date: reservationsTable.date,
      seatNumber: reservationsTable.seatNumber,
    })
    .from(ticketsTable)
    .innerJoin(reservationsTable, eq(ticketsTable.reservationId, reservationsTable.reservationId))
    .where(eq(ticketsTable.id, id));

  if (!row) { res.status(404).json({ error: "Ticket not found" }); return; }
  res.json(row);
});

export default router;
