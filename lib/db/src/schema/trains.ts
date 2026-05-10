import { pgTable, serial, varchar, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const trainsTable = pgTable("trains", {
  trainId: serial("train_id").primaryKey(),
  trainName: varchar("train_name", { length: 255 }).notNull(),
  seatCapacity: integer("seat_capacity").notNull().default(100),
});

export const insertTrainSchema = createInsertSchema(trainsTable).omit({ trainId: true });
export type InsertTrain = z.infer<typeof insertTrainSchema>;
export type Train = typeof trainsTable.$inferSelect;
