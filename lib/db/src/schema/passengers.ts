import { pgTable, serial, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const passengersTable = pgTable("passengers", {
  passengerId: serial("passenger_id").primaryKey(),
  fullName: varchar("full_name", { length: 255 }).notNull(),
  phoneNumber: varchar("phone_number", { length: 50 }).notNull(),
  identificationNumber: varchar("identification_number", { length: 20 }).notNull().unique(),
  email: varchar("email", { length: 255 }),
});

export const insertPassengerSchema = createInsertSchema(passengersTable).omit({ passengerId: true });
export type InsertPassenger = z.infer<typeof insertPassengerSchema>;
export type Passenger = typeof passengersTable.$inferSelect;
