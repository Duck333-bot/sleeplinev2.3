/**
 * Sleepline — Task Router
 * tRPC procedures for task-specific operations (update, delete)
 * Uses patch-based updates to prevent task overwrites
 */

import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { updateTaskById, deleteTaskById, validatePlanTaskIds } from "./db-task-ops";
import { TaskSchema } from "../client/src/lib/schemas";

export const taskRouter = router({
  /**
   * Update a single task within a plan (patch-based)
   * Only the provided fields are updated; all other task fields are preserved
   */
  updateTask: protectedProcedure
    .input(z.object({
      planId: z.string(),
      taskId: z.string(),
      patch: z.object({
        title: z.string().optional(),
        startMin: z.number().int().min(0).max(1439).optional(),
        endMin: z.number().int().min(1).max(1440).optional(),
        status: z.enum(["pending", "active", "completed", "skipped", "snoozed"]).optional(),
        priority: z.enum(["low", "med", "high"]).optional(),
        notes: z.string().optional(),
      }),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await updateTaskById(input.planId, input.taskId, input.patch);
      if (!result.success) {
        throw new Error(result.error || "Failed to update task");
      }

      // Validate the plan after update
      const validation = await validatePlanTaskIds(input.planId);
      if (!validation.valid) {
        console.warn("[TaskRouter] Plan validation issues after update:", validation.errors);
      }

      return { success: true };
    }),

  /**
   * Delete a single task from a plan
   */
  deleteTask: protectedProcedure
    .input(z.object({
      planId: z.string(),
      taskId: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const result = await deleteTaskById(input.planId, input.taskId);
      if (!result.success) {
        throw new Error(result.error || "Failed to delete task");
      }

      // Validate the plan after delete
      const validation = await validatePlanTaskIds(input.planId);
      if (!validation.valid) {
        console.warn("[TaskRouter] Plan validation issues after delete:", validation.errors);
      }

      return { success: true };
    }),

  /**
   * Validate all tasks in a plan
   */
  validatePlan: protectedProcedure
    .input(z.object({
      planId: z.string(),
    }))
    .query(async ({ ctx, input }) => {
      return validatePlanTaskIds(input.planId);
    }),
});
