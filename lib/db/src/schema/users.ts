import { pgTable, text, serial, integer, timestamp, date } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  coins: integer("coins").notNull().default(100),
  lives: integer("lives").notNull().default(3),
  unlockedLevel: integer("unlocked_level").notNull().default(1),
  dailyBonusDay: integer("daily_bonus_day").notNull().default(0),
  lastDailyBonusDate: date("last_daily_bonus_date", { mode: "string" }),
  lastWithdrawalDate: date("last_withdrawal_date", { mode: "string" }),
  dailyAdsWatched: integer("daily_ads_watched").notNull().default(0),
  lastAdWatchDate: date("last_ad_watch_date", { mode: "string" }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({ id: true, createdAt: true });
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;
