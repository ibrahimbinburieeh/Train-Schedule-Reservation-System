import { pgTable, serial, integer, varchar, date, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { trainsTable } from "./trains";

export const schedulesTable = pgTable("schedules", {
  scheduleId: serial("schedule_id").primaryKey(),
  trainId: integer("train_id").notNull().references(() => trainsTable.trainId),
  trainName: varchar("train_name", { length: 255 }).notNull(),
  origin: varchar("origin", { length: 255 }).notNull(),
  destination: varchar("destination", { length: 255 }).notNull(),
  departureTime: varchar("departure_time", { length: 10 }).notNull(),
  arrivalTime: varchar("arrival_time", { length: 10 }).notNull(),
  date: date("date").notNull(),
  seatCapacity: integer("seat_capacity").notNull().default(100),
  availableSeats: integer("available_seats").notNull().default(100),
  ticketPrice: numeric("ticket_price", { precision: 10, scale: 2 }).notNull().default("4.00"),
  createdAt: date("created_at").notNull().default("now()"),
  updatedAt: date("updated_at").notNull().default("now()"),
});

export const insertScheduleSchema = createInsertSchema(schedulesTable).omit({ scheduleId: true });
export type InsertSchedule = z.infer<typeof insertScheduleSchema>;
export type Schedule = typeof schedulesTable.$inferSelect;
