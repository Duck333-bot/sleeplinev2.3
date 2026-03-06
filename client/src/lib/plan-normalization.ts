/**
 * Plan Normalization & Deduplication
 * 
 * Ensures plans are clean, consistent, and free of duplicates
 * before being applied or saved.
 */

import type { DayPlan, Task, SystemBlock } from "./schemas";

/**
 * Deduplicate tasks by ID
 * Keeps the first occurrence, removes subsequent duplicates
 */
export function deduplicateTasks(tasks: Task[]): Task[] {
  const seen = new Set<string>();
  return tasks.filter(task => {
    if (seen.has(task.id)) {
      console.warn(`[Normalization] Removing duplicate task: ${task.id}`);
      return false;
    }
    seen.add(task.id);
    return true;
  });
}

/**
 * Deduplicate system blocks by ID
 */
export function deduplicateBlocks(blocks: SystemBlock[]): SystemBlock[] {
  const seen = new Set<string>();
  return blocks.filter(block => {
    if (seen.has(block.id)) {
      console.warn(`[Normalization] Removing duplicate block: ${block.id}`);
      return false;
    }
    seen.add(block.id);
    return true;
  });
}

/**
 * Normalize a plan before applying
 * - Deduplicates tasks and blocks
 * - Ensures all items have valid times
 * - Validates plan consistency
 */
export function normalizePlan(plan: DayPlan): DayPlan {
  const normalized = {
    ...plan,
    tasks: deduplicateTasks(plan.tasks),
    systemBlocks: deduplicateBlocks(plan.systemBlocks),
  };

  // Validate all tasks have valid time ranges
  normalized.tasks = normalized.tasks.filter(task => {
    if (task.startMin < 0 || task.startMin >= 1440) {
      console.warn(`[Normalization] Invalid task start time: ${task.id}`);
      return false;
    }
    if (task.endMin <= task.startMin || task.endMin > 1440) {
      console.warn(`[Normalization] Invalid task end time: ${task.id}`);
      return false;
    }
    return true;
  });

  // Validate all blocks have valid time ranges
  normalized.systemBlocks = normalized.systemBlocks.filter(block => {
    if (block.startMin < 0 || block.startMin >= 1440) {
      console.warn(`[Normalization] Invalid block start time: ${block.id}`);
      return false;
    }
    if (block.endMin <= block.startMin || block.endMin > 1440) {
      console.warn(`[Normalization] Invalid block end time: ${block.id}`);
      return false;
    }
    return true;
  });

  return normalized;
}

/**
 * Check if applying a new plan would create duplicates with existing plan
 * Returns list of duplicate task IDs
 */
export function findDuplicateTaskIds(
  newPlan: DayPlan,
  existingPlan: DayPlan | undefined
): string[] {
  if (!existingPlan) return [];

  const existingIds = new Set(existingPlan.tasks.map(t => t.id));
  const duplicates = newPlan.tasks
    .filter(t => existingIds.has(t.id))
    .map(t => t.id);

  return duplicates;
}

/**
 * Merge two plans intelligently:
 * - Keeps tasks from both plans
 * - Deduplicates by ID (newer plan wins)
 * - Maintains chronological order
 */
export function mergePlans(
  existingPlan: DayPlan,
  newPlan: DayPlan
): DayPlan {
  // Create a map of tasks by ID, with new plan tasks overwriting existing
  const taskMap = new Map<string, Task>();
  
  existingPlan.tasks.forEach(t => taskMap.set(t.id, t));
  newPlan.tasks.forEach(t => taskMap.set(t.id, t)); // Overwrites duplicates

  const mergedTasks = Array.from(taskMap.values());

  // Do the same for blocks
  const blockMap = new Map<string, SystemBlock>();
  
  existingPlan.systemBlocks.forEach(b => blockMap.set(b.id, b));
  newPlan.systemBlocks.forEach(b => blockMap.set(b.id, b));

  const mergedBlocks = Array.from(blockMap.values());

  return {
    ...newPlan,
    tasks: mergedTasks,
    systemBlocks: mergedBlocks,
  };
}

/**
 * Validate plan before applying
 * Returns validation result with any issues found
 */
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validatePlan(plan: DayPlan): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for empty plan
  if (plan.tasks.length === 0 && plan.systemBlocks.length === 0) {
    warnings.push("Plan has no tasks or blocks");
  }

  // Check for tasks with invalid times
  plan.tasks.forEach(task => {
    if (task.startMin < 0 || task.startMin >= 1440) {
      errors.push(`Task "${task.title}" has invalid start time`);
    }
    if (task.endMin <= task.startMin || task.endMin > 1440) {
      errors.push(`Task "${task.title}" has invalid end time`);
    }
  });

  // Check for overlapping tasks (warning, not error)
  const taskIntervals = plan.tasks
    .filter(t => t.startMin > 0) // Ignore unscheduled
    .map((t, i) => ({ ...t, index: i }));

  for (let i = 0; i < taskIntervals.length; i++) {
    for (let j = i + 1; j < taskIntervals.length; j++) {
      const a = taskIntervals[i];
      const b = taskIntervals[j];
      
      // Check if intervals overlap
      if (a.startMin < b.endMin && b.startMin < a.endMin) {
        warnings.push(`Tasks "${a.title}" and "${b.title}" overlap in time`);
      }
    }
  }

  // Check for unscheduled tasks
  const unscheduled = plan.tasks.filter(t => t.startMin === 0 && t.endMin === 0);
  if (unscheduled.length > 0) {
    warnings.push(`${unscheduled.length} task(s) are unscheduled`);
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
