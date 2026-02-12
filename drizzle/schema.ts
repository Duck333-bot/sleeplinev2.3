import { int, mysqlEnum, mysqlTable, text, timestamp, varchar, boolean, float, json } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 */
export const users = mysqlTable("users", {
  id: int("id").autoincrement().primaryKey(),
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Onboarding data — stores user sleep preferences and goals.
 */
export const onboardings = mysqlTable("onboardings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  sleepGoalHrs: float("sleepGoalHrs").notNull().default(8),
  preferredBedtime: varchar("preferredBedtime", { length: 10 }).notNull().default("22:30"),
  preferredWakeTime: varchar("preferredWakeTime", { length: 10 }).notNull().default("06:30"),
  chronotype: varchar("chronotype", { length: 20 }).notNull().default("flexible"),
  caffeineAfter3pm: boolean("caffeineAfter3pm").notNull().default(false),
  breakFrequency: varchar("breakFrequency", { length: 20 }).notNull().default("every-60m"),
  snackWindows: boolean("snackWindows").notNull().default(true),
  goals: json("goals").$type<string[]>(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Onboarding = typeof onboardings.$inferSelect;
export type InsertOnboarding = typeof onboardings.$inferInsert;

/**
 * Daily check-ins — records sleep quality, energy, stress for each day.
 */
export const checkIns = mysqlTable("checkIns", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  sleepHours: float("sleepHours").notNull(),
  sleepQuality: int("sleepQuality").notNull(),
  morningEnergy: int("morningEnergy").notNull(),
  caffeineToday: boolean("caffeineToday").notNull().default(false),
  stressLevel: int("stressLevel").notNull(),
  workload: varchar("workload", { length: 20 }).notNull().default("moderate"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type CheckIn = typeof checkIns.$inferSelect;
export type InsertCheckIn = typeof checkIns.$inferInsert;

/**
 * Day plans — stores the full plan for a given day including tasks and system blocks.
 */
export const dayPlans = mysqlTable("dayPlans", {
  id: int("id").autoincrement().primaryKey(),
  planId: varchar("planId", { length: 64 }).notNull(), // nanoid
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(), // YYYY-MM-DD
  tasks: json("tasks").$type<any[]>().notNull(),
  systemBlocks: json("systemBlocks").$type<any[]>().notNull(),
  sleepOptions: json("sleepOptions").$type<any[]>().notNull(),
  selectedSleepOptionId: varchar("selectedSleepOptionId", { length: 64 }),
  warnings: json("warnings").$type<string[]>(),
  appliedAt: timestamp("appliedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DayPlan = typeof dayPlans.$inferSelect;
export type InsertDayPlan = typeof dayPlans.$inferInsert;

/**
 * Reminder settings — per-user notification preferences.
 */
export const reminderSettings = mysqlTable("reminderSettings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  windDownReminder: boolean("windDownReminder").notNull().default(true),
  windDownMinsBefore: int("windDownMinsBefore").notNull().default(30),
  bedtimeReminder: boolean("bedtimeReminder").notNull().default(true),
  nextTaskReminder: boolean("nextTaskReminder").notNull().default(false),
  nextTaskMinsBefore: int("nextTaskMinsBefore").notNull().default(5),
  quietHoursStart: int("quietHoursStart").notNull().default(1380),
  quietHoursEnd: int("quietHoursEnd").notNull().default(420),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type ReminderSetting = typeof reminderSettings.$inferSelect;
export type InsertReminderSetting = typeof reminderSettings.$inferInsert;
