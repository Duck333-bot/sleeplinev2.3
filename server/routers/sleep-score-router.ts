/**
 * Sleepline — Sleep Score tRPC Router
 * 
 * Procedures for calculating sleep score based on planned vs actual sleep times.
 */

import { protectedProcedure } from "../_core/trpc";
import { z } from "zod";
import { calculateSleepScore } from "../lib/sleep-score";
import { getDayPlanByDate, getCheckInByDate } from "../db";

/**
 * Calculate sleep score for a given date
 * 
 * Inputs:
 * - date: YYYY-MM-DD string
 * 
 * Returns:
 * - score: 0-100
 * - feedback: array of 1-2 messages
 * - issues: object with boolean flags for each issue
 * - plannedBedtime: planned bedtime in HH:MM format
 * - plannedWakeTime: planned wake time in HH:MM format
 * - actualBedtime: actual bedtime in HH:MM format (or null if not available)
 * - actualWakeTime: actual wake time in HH:MM format (or null if not available)
 */
export const sleepScoreRouter = {
  /**
   * Get sleep score for today or a specific date
   */
  getScore: protectedProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    }))
    .query(async ({ ctx, input }) => {
      const date = input.date || new Date().toISOString().split("T")[0];
      const userId = ctx.user.id;

      // Get day plan for this date
      const plan = await getDayPlanByDate(userId, date);

      if (!plan) {
        return {
          score: null,
          feedback: ["No sleep plan found for this date. Create a plan to track your sleep."],
          issues: null,
          plannedBedtime: null,
          plannedWakeTime: null,
          actualBedtime: null,
          actualWakeTime: null,
        };
      }

      // Get check-in for this date
      const checkIn = await getCheckInByDate(userId, date);

      // Extract planned sleep times from day plan
      const sleepBlock = plan.systemBlocks?.find((block: any) => block.type === "sleep");
      if (!sleepBlock) {
        return {
          score: null,
          feedback: ["No sleep block found in your plan."],
          issues: null,
          plannedBedtime: null,
          plannedWakeTime: null,
          actualBedtime: null,
          actualWakeTime: null,
        };
      }

      const plannedBedtimeMin = sleepBlock.startMin;
      const plannedWakeMin = sleepBlock.endMin;

      // If no check-in, return planned times only
      if (!checkIn) {
        return {
          score: null,
          feedback: ["Complete your daily check-in to see your sleep score."],
          issues: null,
          plannedBedtime: minToTimeString(plannedBedtimeMin),
          plannedWakeTime: minToTimeString(plannedWakeMin),
          actualBedtime: null,
          actualWakeTime: null,
        };
      }

      // Calculate actual sleep times from check-in
      // Assume user went to sleep and woke up based on sleep hours
      // This is a simplified approach - in a full implementation, 
      // you'd track actual bedtime and wake time separately
      const sleepHours = checkIn.sleepHours;
      const sleepMinutes = Math.round(sleepHours * 60);

      // Estimate actual bedtime as close to planned as possible
      // For now, we'll use the planned bedtime as a reference
      // In a production app, you'd have separate fields for actual times
      const actualBedtimeMin = plannedBedtimeMin;
      const actualWakeMin = (plannedBedtimeMin + sleepMinutes) % 1440;

      // Calculate sleep score
      const result = calculateSleepScore({
        plannedBedtimeMin,
        plannedWakeMin,
        actualBedtimeMin,
        actualWakeMin,
        sleepQuality: checkIn.sleepQuality,
      });

      return {
        score: result.score,
        feedback: result.feedback,
        issues: result.issues,
        plannedBedtime: minToTimeString(plannedBedtimeMin),
        plannedWakeTime: minToTimeString(plannedWakeMin),
        actualBedtime: minToTimeString(actualBedtimeMin),
        actualWakeTime: minToTimeString(actualWakeMin),
      };
    }),

  /**
   * Get sleep scores for the past N days
   */
  getScoresForPeriod: protectedProcedure
    .input(z.object({
      days: z.number().int().min(1).max(90).default(7),
    }))
    .query(async ({ ctx, input }) => {
      const userId = ctx.user.id;
      const scores = [];

      // Get scores for the past N days
      for (let i = 0; i < input.days; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split("T")[0];

        const plan = await getDayPlanByDate(userId, dateStr);
        if (!plan) continue;

        const checkIn = await getCheckInByDate(userId, dateStr);

        const sleepBlock = plan.systemBlocks?.find((block: any) => block.type === "sleep");
        if (!sleepBlock || !checkIn) continue;

        const plannedBedtimeMin = sleepBlock.startMin;
        const plannedWakeMin = sleepBlock.endMin;
        const sleepMinutes = Math.round(checkIn.sleepHours * 60);
        const actualBedtimeMin = plannedBedtimeMin;
        const actualWakeMin = (plannedBedtimeMin + sleepMinutes) % 1440;

        const result = calculateSleepScore({
          plannedBedtimeMin,
          plannedWakeMin,
          actualBedtimeMin,
          actualWakeMin,
          sleepQuality: checkIn.sleepQuality,
        });

        scores.push({
          date: dateStr,
          score: result.score,
          feedback: result.feedback,
        });
      }

      return scores;
    }),
};

/**
 * Convert minutes since midnight to HH:MM format
 */
function minToTimeString(min: number): string {
  const hours = Math.floor(min / 60);
  const mins = min % 60;
  return `${hours.toString().padStart(2, "0")}:${mins.toString().padStart(2, "0")}`;
}
