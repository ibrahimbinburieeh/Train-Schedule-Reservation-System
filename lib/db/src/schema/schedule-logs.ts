import { pgTable, serial, integer, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const scheduleLogsTable = pgTable("schedule_logs", {
  logId: serial("log_id").primaryKey(),
  scheduleId: integer("schedule_id").notNull(),
  trainName: varchar("train_name", { length: 255 }).notNull(),
  action: varchar("action", { length: 20 }).notNull(),
  updatedBy: varchar("updated_by", { length: 255 }).notNull().default("Unknown"),
  timestamp: varchar("timestamp", { length: 20 }).notNull(),
});

export const insertScheduleLogSchema = createInsertSchema(scheduleLogsTable).omit({ logId: true });
export type InsertScheduleLog = z.infer<typeof insertScheduleLogSchema>;
export type ScheduleLog = typeof scheduleLogsTable.$inferSelect;
