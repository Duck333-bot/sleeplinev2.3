/**
 * AI Day Planner Router
 * 
 * tRPC endpoints for the flagship "AI Day Planning" feature
 * Allows users to describe their day in natural language
 * and get a structured, sleep-optimized plan
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { generateDayPlanFromDescription, validateDayPlan, DayPlanResponseSchema } from "./ai-day-planner";

export const aiDayPlannerRouter = router({
  /**
   * Generate a day plan from natural language description
   * 
   * Input: user's natural language description of their day
   * Output: structured plan with blocks, summary, and warnings
   */
  generateFromDescription: publicProcedure
    .input(z.object({
      description: z.string().min(1).max(2000),
      wakeTime: z.string().default("07:00"),
      bedtime: z.string().default("23:00"),
    }))
    .mutation(async ({ input }) => {
      const result = await generateDayPlanFromDescription(
        input.description,
        input.wakeTime,
        input.bedtime
      );

      if (!result.success) {
        return {
          success: false,
          error: result.error,
          plan: null,
        };
      }

      return {
        success: true,
        error: null,
        plan: result.plan,
      };
    }),

  /**
   * Validate a day plan
   * Used to check if a plan is valid before applying
   */
  validatePlan: publicProcedure
    .input(z.object({
      plan: DayPlanResponseSchema,
    }))
    .query(({ input }) => {
      const validation = validateDayPlan(input.plan);
      return {
        valid: validation.valid,
        errors: validation.errors,
      };
    }),

  /**
   * Regenerate a plan with different parameters
   * Useful for "try again" or "adjust" flows
   */
  regenerateWithAdjustments: publicProcedure
    .input(z.object({
      description: z.string().min(1).max(2000),
      wakeTime: z.string(),
      bedtime: z.string(),
      adjustments: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const adjustedPrompt = input.adjustments
        ? `${input.description}\n\nPlease adjust: ${input.adjustments}`
        : input.description;

      const result = await generateDayPlanFromDescription(
        adjustedPrompt,
        input.wakeTime,
        input.bedtime
      );

      return {
        success: result.success,
        error: result.error,
        plan: result.plan,
      };
    }),
});
