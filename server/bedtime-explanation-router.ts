/**
 * Bedtime Explanation Router
 * 
 * tRPC endpoint for generating bedtime explanations
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { generateBedtimeExplanation, FALLBACK_EXPLANATION } from "./bedtime-explanation";

export const bedtimeExplanationRouter = router({
  /**
   * Generate a bedtime explanation
   */
  generate: publicProcedure
    .input(z.object({
      recommendedBedtime: z.number().int().min(0).max(1439),
      wakeTime: z.number().int().min(0).max(1439),
      tasks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        priority: z.string().optional(),
      })),
      sleepGoal: z.number().min(4).max(14),
    }))
    .mutation(async ({ input }) => {
      const result = await generateBedtimeExplanation({
        recommendedBedtime: input.recommendedBedtime,
        wakeTime: input.wakeTime,
        tasks: input.tasks,
        sleepGoal: input.sleepGoal,
      });

      if (!result.success) {
        // Return fallback on error
        return {
          success: true,
          explanation: FALLBACK_EXPLANATION,
        };
      }

      return {
        success: true,
        explanation: result.explanation || FALLBACK_EXPLANATION,
      };
    }),
});
