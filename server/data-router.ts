/**
 * Sleepline — Data Router
 * tRPC procedures for persisting onboarding, check-ins, plans, and settings
 */

import { z } from "zod";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import {
  saveOnboarding, getOnboarding, updateOnboarding,
  saveCheckIn, getCheckInsByUser, getCheckInByDate,
  saveDayPlan, getDayPlanByDate, getDayPlansByUser, updateDayPlan,
  saveReminderSettings, getReminderSettings, updateReminderSettings,
} from "./db";

export const dataRouter = router({
  // ─── Onboarding ─────────────────────────────────────────
  saveOnboarding: protectedProcedure
    .input(z.object({
      sleepGoalHrs: z.number(),
      preferredBedtime: z.string(),
      preferredWakeTime: z.string(),
      chronotype: z.string(),
      caffeineAfter3pm: z.boolean(),
      breakFrequency: z.string(),
      snackWindows: z.boolean(),
      goals: z.array(z.string()),
    }))
    .mutation(async ({ ctx, input }) => {
      await saveOnboarding({
        userId: ctx.user.id,
        ...input,
        goals: input.goals,
        completedAt: new Date(),
      });
      return { success: true };
    }),

  getOnboarding: protectedProcedure
    .query(async ({ ctx }) => {
      return getOnboarding(ctx.user.id);
    }),

  updateOnboarding: protectedProcedure
    .input(z.object({
      sleepGoalHrs: z.number().optional(),
      preferredBedtime: z.string().optional(),
      preferredWakeTime: z.string().optional(),
      chronotype: z.string().optional(),
      caffeineAfter3pm: z.boolean().optional(),
      breakFrequency: z.string().optional(),
      snackWindows: z.boolean().optional(),
      goals: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await updateOnboarding(ctx.user.id, input);
      return { success: true };
    }),

  // ─── Check-ins ──────────────────────────────────────────
  saveCheckIn: protectedProcedure
    .input(z.object({
      date: z.string(),
      sleepHours: z.number(),
      sleepQuality: z.number(),
      morningEnergy: z.number(),
      caffeineToday: z.boolean(),
      stressLevel: z.number(),
      workload: z.string(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await saveCheckIn({
        userId: ctx.user.id,
        ...input,
      });
      return { success: true };
    }),

  getCheckIns: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getCheckInsByUser(ctx.user.id, input?.limit ?? 30);
    }),

  getTodayCheckIn: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      return getCheckInByDate(ctx.user.id, input.date);
    }),

  // ─── Day Plans ──────────────────────────────────────────
  saveDayPlan: protectedProcedure
    .input(z.object({
      planId: z.string(),
      date: z.string(),
      tasks: z.any(),
      systemBlocks: z.any(),
      sleepOptions: z.any(),
      selectedSleepOptionId: z.string().nullable().optional(),
      warnings: z.array(z.string()).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      await saveDayPlan({
        userId: ctx.user.id,
        planId: input.planId,
        date: input.date,
        tasks: input.tasks,
        systemBlocks: input.systemBlocks,
        sleepOptions: input.sleepOptions,
        selectedSleepOptionId: input.selectedSleepOptionId ?? null,
        warnings: input.warnings ?? [],
        appliedAt: new Date(),
      });
      return { success: true };
    }),

  getTodayPlan: protectedProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ ctx, input }) => {
      return getDayPlanByDate(ctx.user.id, input.date);
    }),

  getDayPlans: protectedProcedure
    .input(z.object({ limit: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      return getDayPlansByUser(ctx.user.id, input?.limit ?? 30);
    }),

  updateDayPlan: protectedProcedure
    .input(z.object({
      planId: z.string(),
      tasks: z.any().optional(),
      selectedSleepOptionId: z.string().nullable().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const updateData: Record<string, any> = {};
      if (input.tasks !== undefined) updateData.tasks = input.tasks;
      if (input.selectedSleepOptionId !== undefined) updateData.selectedSleepOptionId = input.selectedSleepOptionId;
      await updateDayPlan(input.planId, updateData);
      return { success: true };
    }),

  // ─── Reminder Settings ──────────────────────────────────
  getReminderSettings: protectedProcedure
    .query(async ({ ctx }) => {
      return getReminderSettings(ctx.user.id);
    }),

  saveReminderSettings: protectedProcedure
    .input(z.object({
      windDownReminder: z.boolean(),
      windDownMinsBefore: z.number(),
      bedtimeReminder: z.boolean(),
      nextTaskReminder: z.boolean(),
      nextTaskMinsBefore: z.number(),
      quietHoursStart: z.number(),
      quietHoursEnd: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const existing = await getReminderSettings(ctx.user.id);
      if (existing) {
        await updateReminderSettings(ctx.user.id, input);
      } else {
        await saveReminderSettings({ userId: ctx.user.id, ...input });
      }
      return { success: true };
    }),
});
