import { pgTable, serial, integer, varchar, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { passengersTable } from "./passengers";
import { schedulesTable } from "./schedules";

export const reservationsTable = pgTable("reservations", {
  reservationId: serial("reservation_id").primaryKey(),
  passengerId: integer("passenger_id").notNull().references(() => passengersTable.passengerId),
  passengerName: varchar("passenger_name", { length: 255 }).notNull(),
  scheduleId: integer("schedule_id").notNull().references(() => schedulesTable.scheduleId),
  trainName: varchar("train_name", { length: 255 }).notNull(),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  date: date("date").notNull(),
  seatNumber: integer("seat_number").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("confirmed"),
  reservationDate: date("reservation_date").notNull().default("now()"),
  ticketPrice: numeric("ticket_price", { precision: 10, scale: 2 }).notNull().default("4.00"),
});

export const insertReservationSchema = createInsertSchema(reservationsTable).omit({ reservationId: true });
export type InsertReservation = z.infer<typeof insertReservationSchema>;
export type Reservation = typeof reservationsTable.$inferSelect;
