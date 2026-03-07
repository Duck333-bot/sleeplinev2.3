/**
 * Optimization Validation Utility
 * 
 * Validates optimizer results before displaying in panel.
 * Ensures start/end times are valid, no overlaps, chronological order.
 */

import type { Task } from "@/lib/schemas";

export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * Validate a single optimized task
 */
function validateTask(task: any): ValidationResult {
  // Check required fields
  if (!task.title || typeof task.title !== "string") {
    return { isValid: false, error: "Task missing title" };
  }

  if (typeof task.start !== "number" || typeof task.end !== "number") {
    return { isValid: false, error: "Task missing start/end times" };
  }

  // Check time range (0-1440 minutes = 24 hours)
  if (task.start < 0 || task.start > 1440) {
    return { isValid: false, error: `Invalid start time: ${task.start}` };
  }

  if (task.end < 0 || task.end > 1440) {
    return { isValid: false, error: `Invalid end time: ${task.end}` };
  }

  // Check end > start
  if (task.end <= task.start) {
    return { isValid: false, error: `End time must be after start time for "${task.title}"` };
  }

  return { isValid: true };
}

/**
 * Validate entire optimized schedule
 */
export function validateOptimizedSchedule(tasks: any[]): ValidationResult {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return { isValid: false, error: "No tasks in optimized schedule" };
  }

  // Validate each task
  for (const task of tasks) {
    const result = validateTask(task);
    if (!result.isValid) {
      return result;
    }
  }

  // Check for overlaps
  const sorted = [...tasks].sort((a, b) => a.start - b.start);
  for (let i = 0; i < sorted.length - 1; i++) {
    const current = sorted[i];
    const next = sorted[i + 1];
    
    if (current.end > next.start) {
      return { 
        isValid: false, 
        error: `Overlap detected: "${current.title}" (${current.start}-${current.end}) overlaps with "${next.title}" (${next.start}-${next.end})` 
      };
    }
  }

  // Check chronological order
  for (let i = 0; i < tasks.length - 1; i++) {
    if (tasks[i].start > tasks[i + 1].start) {
      return { isValid: false, error: "Tasks not in chronological order" };
    }
  }

  return { isValid: true };
}

/**
 * Validate summary bullets
 */
export function validateSummary(summary: any): ValidationResult {
  if (!Array.isArray(summary)) {
    return { isValid: false, error: "Summary must be an array" };
  }

  if (summary.length === 0 || summary.length > 3) {
    return { isValid: false, error: "Summary must have 1-3 bullets" };
  }

  for (const bullet of summary) {
    if (typeof bullet !== "string" || bullet.length === 0) {
      return { isValid: false, error: "Summary bullets must be non-empty strings" };
    }
  }

  return { isValid: true };
}

/**
 * Validate reason text
 */
export function validateReason(reason: any): ValidationResult {
  if (typeof reason !== "string") {
    return { isValid: false, error: "Reason must be a string" };
  }

  if (reason.length === 0 || reason.length > 120) {
    return { isValid: false, error: "Reason must be 1-120 characters" };
  }

  return { isValid: true };
}

/**
 * Validate complete optimizer response
 */
export function validateOptimizerResponse(response: any): ValidationResult {
  if (!response || typeof response !== "object") {
    return { isValid: false, error: "Invalid response format" };
  }

  // Validate blocks/tasks
  const blockResult = validateOptimizedSchedule(response.blocks || []);
  if (!blockResult.isValid) {
    return blockResult;
  }

  // Validate summary
  const summaryResult = validateSummary(response.summary);
  if (!summaryResult.isValid) {
    return summaryResult;
  }

  // Validate reason
  const reasonResult = validateReason(response.reason);
  if (!reasonResult.isValid) {
    return reasonResult;
  }

  return { isValid: true };
}
