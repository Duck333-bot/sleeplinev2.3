/**
 * Schedule Optimizer Router
 * 
 * tRPC endpoints for the "Optimize My Day" feature
 */

import { z } from "zod";
import { publicProcedure, router } from "./_core/trpc";
import { optimizeSchedule, blocksToTasks } from "./schedule-optimizer";

export const scheduleOptimizerRouter = router({
  /**
   * Generate an optimized schedule
   */
  optimize: publicProcedure
    .input(z.object({
      tasks: z.array(z.object({
        id: z.string(),
        title: z.string(),
        startMin: z.number(),
        endMin: z.number(),
        type: z.string(),
        priority: z.string(),
        locked: z.boolean().optional(),
      })),
      wakeTime: z.number(),
      bedtime: z.number(),
      sleepDurationHrs: z.number().optional(),
    }))
    .mutation(async ({ input }) => {
      const result = await optimizeSchedule({
        tasks: input.tasks,
        wakeTime: input.wakeTime,
        bedtime: input.bedtime,
        sleepDurationHrs: input.sleepDurationHrs,
      });

      if (!result.success || !result.optimization) {
        return {
          success: false,
          optimization: null,
          error: result.error || "Failed to optimize schedule",
        };
      }

      // Convert optimized blocks back to task format
      const optimizedTasks = blocksToTasks(result.optimization.blocks, input.tasks);

      return {
        success: true,
        optimization: {
          blocks: result.optimization.blocks,
          reason: result.optimization.reason,
          improvements: result.optimization.improvements || [],
        },
        optimizedTasks,
        error: null,
      };
    }),
});
