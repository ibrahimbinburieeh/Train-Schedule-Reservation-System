import { pgTable, serial, integer, varchar, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { reservationsTable } from "./reservations";

export const ticketsTable = pgTable("tickets", {
  id: serial("id").primaryKey(),
  reservationId: integer("reservation_id").notNull().references(() => reservationsTable.reservationId, { onDelete: "cascade" }),
  ticketNumber: varchar("ticket_number", { length: 30 }).notNull().unique(),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  status: varchar("status", { length: 20 }).notNull().default("active"),
});

export const insertTicketSchema = createInsertSchema(ticketsTable).omit({ id: true });
export type InsertTicket = z.infer<typeof insertTicketSchema>;
export type Ticket = typeof ticketsTable.$inferSelect;
