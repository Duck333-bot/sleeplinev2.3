/**
 * Sleepline — Task-specific DB operations
 * Patch-based updates to prevent task overwrites
 */

import { eq, and } from "drizzle-orm";
import { dayPlans } from "../drizzle/schema";
import { getDb } from "./db";
import type { Task } from "../client/src/lib/schemas";

/**
 * Update a single task within a day plan by ID (patch-based, not full overwrite)
 */
export async function updateTaskById(
  planId: string,
  taskId: string,
  patch: Partial<Task>
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    // Read the current plan
    const result = await db.select().from(dayPlans)
      .where(eq(dayPlans.planId, planId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Plan not found" };
    }

    const plan = result[0];
    const tasks = (plan.tasks as any[]) || [];

    // Find the task by ID
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    if (taskIndex === -1) {
      return { success: false, error: `Task ${taskId} not found in plan` };
    }

    // Merge patch into existing task (preserve all other fields)
    const updatedTask = { ...tasks[taskIndex], ...patch };

    // Validate the updated task
    if (updatedTask.startMin >= updatedTask.endMin) {
      return { success: false, error: `Invalid time range: ${updatedTask.startMin} >= ${updatedTask.endMin}` };
    }
    if (updatedTask.startMin < 0 || updatedTask.endMin > 1440) {
      return { success: false, error: `Time out of bounds: ${updatedTask.startMin}-${updatedTask.endMin}` };
    }

    // Create new tasks array with the updated task
    const newTasks = [
      ...tasks.slice(0, taskIndex),
      updatedTask,
      ...tasks.slice(taskIndex + 1),
    ];

    // Validate no overlaps (except unscheduled tasks with startMin=0)
    const scheduledTasks = newTasks.filter((t: any) => t.startMin > 0);
    for (let i = 0; i < scheduledTasks.length; i++) {
      for (let j = i + 1; j < scheduledTasks.length; j++) {
        const t1 = scheduledTasks[i];
        const t2 = scheduledTasks[j];
        if (!(t1.endMin <= t2.startMin || t2.endMin <= t1.startMin)) {
          return { success: false, error: `Task overlap: "${t1.title}" and "${t2.title}"` };
        }
      }
    }

    // Save back only the tasks array (preserves other plan fields)
    await db.update(dayPlans)
      .set({ tasks: newTasks })
      .where(eq(dayPlans.planId, planId));

    return { success: true };
  } catch (error) {
    console.error("[DB] updateTaskById error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Delete a single task from a day plan by ID
 */
export async function deleteTaskById(
  planId: string,
  taskId: string
): Promise<{ success: boolean; error?: string }> {
  const db = await getDb();
  if (!db) return { success: false, error: "Database unavailable" };

  try {
    // Read the current plan
    const result = await db.select().from(dayPlans)
      .where(eq(dayPlans.planId, planId))
      .limit(1);

    if (result.length === 0) {
      return { success: false, error: "Plan not found" };
    }

    const plan = result[0];
    const tasks = (plan.tasks as any[]) || [];

    // Check if task exists
    const taskIndex = tasks.findIndex((t: any) => t.id === taskId);
    if (taskIndex === -1) {
      return { success: false, error: `Task ${taskId} not found in plan` };
    }

    // Create new tasks array without the deleted task
    const newTasks = [
      ...tasks.slice(0, taskIndex),
      ...tasks.slice(taskIndex + 1),
    ];

    // Save back
    await db.update(dayPlans)
      .set({ tasks: newTasks })
      .where(eq(dayPlans.planId, planId));

    return { success: true };
  } catch (error) {
    console.error("[DB] deleteTaskById error:", error);
    return { success: false, error: String(error) };
  }
}

/**
 * Validate all tasks in a plan have unique IDs and valid times
 */
export async function validatePlanTaskIds(planId: string): Promise<{ valid: boolean; errors: string[] }> {
  const db = await getDb();
  if (!db) return { valid: false, errors: ["Database unavailable"] };

  try {
    const result = await db.select().from(dayPlans)
      .where(eq(dayPlans.planId, planId))
      .limit(1);

    if (result.length === 0) {
      return { valid: false, errors: ["Plan not found"] };
    }

    const tasks = (result[0].tasks as any[]) || [];
    const errors: string[] = [];

    // Check for duplicate IDs
    const ids = new Set<string>();
    for (const task of tasks) {
      if (!task.id) {
        errors.push(`Task "${task.title}" has no ID`);
      } else if (ids.has(task.id)) {
        errors.push(`Duplicate task ID: ${task.id}`);
      } else {
        ids.add(task.id);
      }
    }

    // Check for invalid times
    for (const task of tasks) {
      if (task.startMin < 0 || task.endMin > 1440) {
        errors.push(`Task "${task.title}" out of bounds: ${task.startMin}-${task.endMin}`);
      }
      if (task.startMin >= task.endMin && task.startMin > 0) {
        errors.push(`Task "${task.title}" invalid range: ${task.startMin} >= ${task.endMin}`);
      }
    }

    return { valid: errors.length === 0, errors };
  } catch (error) {
    console.error("[DB] validatePlanTaskIds error:", error);
    return { valid: false, errors: [String(error)] };
  }
}
