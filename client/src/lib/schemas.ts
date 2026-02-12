/**
 * Sleepline — Zod Schemas & Types
 * Celestial Observatory Design System
 * 
 * Strict schemas for: Task, SystemBlock, SleepOption, DayPlan
 * All AI outputs must validate against these schemas.
 */

import { z } from "zod";

// ─── Task Types ────────────────────────────────────────────
export const TaskTypeEnum = z.enum([
  "work", "study", "class", "exercise", "commute",
  "errand", "creative", "social", "other"
]);

export const PriorityEnum = z.enum(["low", "med", "high"]);

export const TaskStatusEnum = z.enum([
  "pending", "active", "completed", "skipped", "snoozed"
]);

export const TaskSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  startMin: z.number().int().min(0).max(1439), // minutes from midnight
  endMin: z.number().int().min(1).max(1440),
  type: TaskTypeEnum,
  priority: PriorityEnum,
  status: TaskStatusEnum.default("pending"),
  locked: z.boolean().default(false), // fixed time, can't be moved
  notes: z.string().optional(),
});

export type Task = z.infer<typeof TaskSchema>;

// ─── System Block Types ────────────────────────────────────
export const SystemBlockTypeEnum = z.enum([
  "break", "snack", "wind-down", "wake-up", "sleep", "free"
]);

export const SystemBlockSchema = z.object({
  id: z.string(),
  type: SystemBlockTypeEnum,
  title: z.string(),
  startMin: z.number().int().min(0).max(1439),
  endMin: z.number().int().min(1).max(1440),
  auto: z.boolean().default(true), // system-generated
});

export type SystemBlock = z.infer<typeof SystemBlockSchema>;

// ─── Sleep Options ─────────────────────────────────────────
export const SleepModeEnum = z.enum(["performance", "balanced", "recovery"]);

export const SleepOptionSchema = z.object({
  id: z.string(),
  mode: SleepModeEnum,
  bedtimeMin: z.number().int().min(0).max(1439),
  wakeMin: z.number().int().min(0).max(1439),
  sleepDurationHrs: z.number().min(4).max(14),
  predictedEnergy: z.number().int().min(1).max(10),
  rationale: z.string(),
});

export type SleepOption = z.infer<typeof SleepOptionSchema>;

// ─── Day Plan ──────────────────────────────────────────────
export const DayPlanSchema = z.object({
  id: z.string(),
  date: z.string(), // YYYY-MM-DD
  tasks: z.array(TaskSchema),
  systemBlocks: z.array(SystemBlockSchema),
  sleepOptions: z.array(SleepOptionSchema).min(1).max(3),
  selectedSleepOptionId: z.string().nullable().default(null),
  warnings: z.array(z.string()).default([]),
  createdAt: z.string(),
  appliedAt: z.string().nullable().default(null),
});

export type DayPlan = z.infer<typeof DayPlanSchema>;

// ─── Onboarding ────────────────────────────────────────────
export const OnboardingSchema = z.object({
  sleepGoalHrs: z.number().min(4).max(14).default(8),
  preferredBedtime: z.string().default("22:30"), // HH:MM
  preferredWakeTime: z.string().default("06:30"),
  chronotype: z.enum(["early-bird", "night-owl", "flexible"]).default("flexible"),
  caffeineAfter3pm: z.boolean().default(false),
  breakFrequency: z.enum(["every-30m", "every-60m", "every-90m", "none"]).default("every-60m"),
  snackWindows: z.boolean().default(true),
  goals: z.array(z.string()).default([]),
  completedAt: z.string().nullable().default(null),
});

export type Onboarding = z.infer<typeof OnboardingSchema>;

// ─── Check-in ──────────────────────────────────────────────
export const CheckInSchema = z.object({
  id: z.string(),
  date: z.string(),
  sleepHours: z.number().min(0).max(24),
  sleepQuality: z.number().int().min(1).max(5),
  morningEnergy: z.number().int().min(1).max(5),
  caffeineToday: z.boolean().default(false),
  stressLevel: z.number().int().min(1).max(5),
  workload: z.enum(["light", "moderate", "heavy"]).default("moderate"),
  notes: z.string().optional(),
  createdAt: z.string(),
});

export type CheckIn = z.infer<typeof CheckInSchema>;

// ─── Reminder Settings ─────────────────────────────────────
export const ReminderSettingsSchema = z.object({
  windDownReminder: z.boolean().default(true),
  windDownMinsBefore: z.number().default(30),
  bedtimeReminder: z.boolean().default(true),
  nextTaskReminder: z.boolean().default(false),
  nextTaskMinsBefore: z.number().default(5),
  quietHoursStart: z.number().default(1380), // 23:00
  quietHoursEnd: z.number().default(420), // 07:00
});

export type ReminderSettings = z.infer<typeof ReminderSettingsSchema>;

// ─── User Profile ──────────────────────────────────────────
export const UserProfileSchema = z.object({
  id: z.string(),
  name: z.string().default("Sleeper"),
  timezone: z.string().default(Intl.DateTimeFormat().resolvedOptions().timeZone),
  onboarding: OnboardingSchema,
  reminderSettings: ReminderSettingsSchema,
  createdAt: z.string(),
});

export type UserProfile = z.infer<typeof UserProfileSchema>;

// ─── AI Plan Preview (what the AI returns) ─────────────────
export const AIPlanPreviewSchema = z.object({
  tasks: z.array(z.object({
    title: z.string(),
    durationMin: z.number().int().min(5).max(480),
    type: TaskTypeEnum,
    priority: PriorityEnum,
    locked: z.boolean().default(false),
    fixedStartMin: z.number().int().optional(), // if user specified exact time
    notes: z.string().optional(),
  })),
  constraints: z.object({
    wakeMin: z.number().int(),
    bedtimeMin: z.number().int(),
    breakFrequency: z.enum(["every-30m", "every-60m", "every-90m", "none"]),
    includeSnacks: z.boolean(),
  }),
  sleepOptions: z.array(SleepOptionSchema).min(1).max(3),
  warnings: z.array(z.string()).default([]),
});

export type AIPlanPreview = z.infer<typeof AIPlanPreviewSchema>;

// ─── Helpers ───────────────────────────────────────────────
export function minToTime(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`;
}

export function timeToMin(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

export function minToDisplay(min: number): string {
  const h = Math.floor(min / 60);
  const m = min % 60;
  const period = h >= 12 ? "PM" : "AM";
  const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
}

export function durationDisplay(mins: number): string {
  if (mins < 60) return `${mins}m`;
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return m > 0 ? `${h}h ${m}m` : `${h}h`;
}
