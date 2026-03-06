/**
 * Day Review Router
 * 
 * tRPC endpoints for the "AI Day Review" feature
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { generateDayReview } from "./ai-day-review";

export const dayReviewRouter = router({
  /**
   * Generate a review for today's performance
   */
  generateReview: publicProcedure
    .input(z.object({
      tasks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        startMin: z.number(),
        type: z.string(),
        priority: z.string(),
        status: z.string(),
      })),
      completedTasks: z.number(),
      sleepGoal: z.number(),
      actualBedtime: z.number().optional(),
      wakeTime: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await generateDayReview({
        tasks: input.tasks,
        completedTasks: input.completedTasks,
        sleepGoal: input.sleepGoal,
        actualBedtime: input.actualBedtime,
        wakeTime: input.wakeTime,
      });

      return {
        success: result.success,
        review: result.review || null,
        error: result.error || null,
      };
    }),
});
