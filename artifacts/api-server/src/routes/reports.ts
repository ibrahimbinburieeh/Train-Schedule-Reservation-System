import { Router, type IRouter } from "express";
import { db, trainsTable, schedulesTable, passengersTable, reservationsTable } from "@workspace/db";
import { eq, sql } from "drizzle-orm";

const router: IRouter = Router();

router.get("/reports/summary", async (_req, res) => {
  const [trains, schedules, passengers, reservations] = await Promise.all([
    db.select().from(trainsTable),
    db.select().from(schedulesTable),
    db.select().from(passengersTable),
    db.select().from(reservationsTable),
  ]);
  const confirmed = reservations.filter(r => r.status === "confirmed");
  const cancelled = reservations.filter(r => r.status === "cancelled");
  const totalRevenue = confirmed.reduce((s, r) => s + parseFloat(r.ticketPrice), 0);
  res.json({
    totalTrains: trains.length, totalSchedules: schedules.length,
    totalPassengers: passengers.length, totalReservations: reservations.length,
    confirmedReservations: confirmed.length, cancelledReservations: cancelled.length, totalRevenue,
  });
});

router.get("/reports/daily", async (_req, res) => {
  const today = new Date().toISOString().split("T")[0]!;
  const reservations = await db.select().from(reservationsTable).where(eq(reservationsTable.reservationDate, today));
  const confirmed = reservations.filter(r => r.status === "confirmed");
  res.json({
    date: today, totalBookings: reservations.length,
    confirmedBookings: confirmed.length,
    cancelledBookings: reservations.filter(r => r.status === "cancelled").length,
    revenue: confirmed.reduce((s, r) => s + parseFloat(r.ticketPrice), 0),
  });
});

router.get("/reports/weekly", async (_req, res) => {
  const all = await db.select().from(reservationsTable);
  const now = new Date();
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now); d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split("T")[0]!;
    const dayRes = all.filter(r => r.reservationDate === dateStr);
    const revenue = dayRes.filter(r => r.status === "confirmed").reduce((s, r) => s + parseFloat(r.ticketPrice), 0);
    days.push({ date: dateStr, bookings: dayRes.length, revenue });
  }
  res.json(days);
});

router.get("/reports/monthly", async (_req, res) => {
  const all = await db.select().from(reservationsTable);
  const map: Record<string, { bookings: number; revenue: number }> = {};
  for (const r of all) {
    const month = r.reservationDate.substring(0, 7);
    if (!map[month]) map[month] = { bookings: 0, revenue: 0 };
    map[month].bookings++;
    if (r.status === "confirmed") map[month].revenue += parseFloat(r.ticketPrice);
  }
  res.json(Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).map(([month, d]) => ({ month, ...d })));
});

router.get("/reports/trends", async (_req, res) => {
  const all = await db.select().from(reservationsTable);
  const map: Record<string, { confirmed: number; cancelled: number }> = {};
  for (const r of all) {
    const month = r.reservationDate.substring(0, 7);
    if (!map[month]) map[month] = { confirmed: 0, cancelled: 0 };
    if (r.status === "confirmed") map[month].confirmed++;
    else map[month].cancelled++;
  }
  res.json(Object.entries(map).sort(([a],[b]) => a.localeCompare(b)).map(([month, d]) => ({ month, ...d })));
});

router.get("/reports/utilization", async (_req, res) => {
  const schedules = await db.select().from(schedulesTable).orderBy(schedulesTable.scheduleId);
  res.json(schedules.map(s => {
    const booked = s.seatCapacity - s.availableSeats;
    return { scheduleId: s.scheduleId, trainName: s.trainName, route: `${s.origin} → ${s.destination}`, date: s.date, seatCapacity: s.seatCapacity, bookedSeats: booked, availableSeats: s.availableSeats, utilizationPct: s.seatCapacity > 0 ? Math.round((booked / s.seatCapacity) * 100) : 0 };
  }));
});

router.get("/reports/occupancy", async (_req, res) => {
  const schedules = await db.select().from(schedulesTable);
  const totalSeats = schedules.reduce((s, sc) => s + sc.seatCapacity, 0);
  const bookedSeats = schedules.reduce((s, sc) => s + (sc.seatCapacity - sc.availableSeats), 0);
  const availableSeats = totalSeats - bookedSeats;
  res.json({ totalSeats, bookedSeats, availableSeats, occupancyPct: totalSeats > 0 ? Math.round((bookedSeats / totalSeats) * 100) : 0 });
});

export default router;
