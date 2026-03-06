/**
 * Dashboard Helper Utilities
 * 
 * Small, focused utilities for the Today Dashboard:
 * - getNextTask: Find the next upcoming task
 * - getDailyProgress: Calculate task completion progress
 * - getCurrentEnergyPhase: Determine current energy zone
 * - formatTimeRange: Display time in readable format
 */

import type { Task, DayPlan } from "./schemas";
import { minToDisplay } from "./schemas";

/**
 * Get the next upcoming task from the plan
 * Returns the first task that hasn't been completed yet
 */
export function getNextTask(tasks: Task[]): Task | null {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Find first incomplete task that hasn't started yet
  const upcomingTasks = tasks
    .filter(t => t.status !== "completed" && t.status !== "skipped")
    .filter(t => t.startMin > currentMin || t.startMin === 0) // Unscheduled or in future
    .sort((a, b) => a.startMin - b.startMin);

  if (upcomingTasks.length > 0) return upcomingTasks[0];

  // If no upcoming tasks, find first incomplete task (even if in progress)
  const incompleteTasks = tasks
    .filter(t => t.status !== "completed" && t.status !== "skipped")
    .sort((a, b) => a.startMin - b.startMin);

  return incompleteTasks.length > 0 ? incompleteTasks[0] : null;
}

/**
 * Calculate daily task completion progress
 * Returns { completed, total, percentage }
 */
export function getDailyProgress(tasks: Task[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

/**
 * Get current energy phase based on wake time
 * Energy phases:
 * - high-focus: 0-3h after wake
 * - peak-focus: 3-6h after wake
 * - dip: 6-8h after wake
 * - recovery: 8-11h after wake
 * - wind-down: 11h+ after wake
 * - sleep: during sleep hours
 */
export function getCurrentEnergyPhase(
  wakeMinFromMidnight: number,
  sleepMinFromMidnight: number | null = null
): {
  phase: "high-focus" | "peak-focus" | "dip" | "recovery" | "wind-down" | "sleep" | "unknown";
  label: string;
  description: string;
  color: string;
} {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Handle sleep phase
  if (sleepMinFromMidnight !== null) {
    // If sleep time is earlier than wake time (e.g., 22:30 sleep, 07:00 wake)
    if (sleepMinFromMidnight > wakeMinFromMidnight) {
      // Sleep is later in the day
      if (currentMin >= sleepMinFromMidnight || currentMin < wakeMinFromMidnight) {
        return {
          phase: "sleep",
          label: "Sleep",
          description: "Resting",
          color: "var(--sl-glow-periwinkle)",
        };
      }
    } else {
      // Sleep is earlier (next day)
      if (currentMin >= sleepMinFromMidnight && currentMin < wakeMinFromMidnight) {
        return {
          phase: "sleep",
          label: "Sleep",
          description: "Resting",
          color: "var(--sl-glow-periwinkle)",
        };
      }
    }
  }

  // If before wake time, return unknown
  if (currentMin < wakeMinFromMidnight) {
    return {
      phase: "unknown",
      label: "Night",
      description: "Before wake time",
      color: "var(--sl-text-muted)",
    };
  }

  // Calculate hours since wake
  const hoursSinceWake = (currentMin - wakeMinFromMidnight) / 60;

  if (hoursSinceWake < 3) {
    return {
      phase: "high-focus",
      label: "High Focus",
      description: "Peak alertness",
      color: "var(--sl-glow-amber)",
    };
  }

  if (hoursSinceWake < 6) {
    return {
      phase: "peak-focus",
      label: "Peak Focus",
      description: "Optimal performance",
      color: "var(--sl-glow-mint)",
    };
  }

  if (hoursSinceWake < 8) {
    return {
      phase: "dip",
      label: "Energy Dip",
      description: "Post-lunch slump",
      color: "var(--sl-glow-coral)",
    };
  }

  if (hoursSinceWake < 11) {
    return {
      phase: "recovery",
      label: "Recovery",
      description: "Second wind",
      color: "var(--sl-glow-cyan)",
    };
  }

  return {
    phase: "wind-down",
    label: "Wind Down",
    description: "Preparing for sleep",
    color: "var(--sl-glow-periwinkle)",
  };
}

/**
 * Format a time range for display
 * Example: 1080 → "18:00"
 */
export function formatTimeRange(startMin: number, endMin: number): string {
  return `${minToDisplay(startMin)} – ${minToDisplay(endMin)}`;
}

/**
 * Get sleep goal info from plan
 * Returns bedtime and wake time in readable format
 */
export function getSleepGoalInfo(plan: DayPlan | undefined): {
  bedtime: string;
  wakeTime: string;
  sleepDuration: number;
} | null {
  if (!plan || !plan.sleepOptions || plan.sleepOptions.length === 0) {
    return null;
  }

  // Use selected sleep option, or first one
  const sleepOption = plan.sleepOptions.find(o => o.id === plan.selectedSleepOptionId) || plan.sleepOptions[0];

  return {
    bedtime: minToDisplay(sleepOption.bedtimeMin),
    wakeTime: minToDisplay(sleepOption.wakeMin),
    sleepDuration: sleepOption.sleepDurationHrs,
  };
}

/**
 * Check if the day is complete
 * Returns true if all tasks are completed or it's past the sleep time
 */
export function isDayComplete(plan: DayPlan | undefined): boolean {
  if (!plan) return false;

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Get sleep time
  const sleepOption = plan.sleepOptions.find(o => o.id === plan.selectedSleepOptionId) || plan.sleepOptions[0];
  if (!sleepOption) return false;

  // If past sleep time, day is complete
  if (currentMin >= sleepOption.bedtimeMin) {
    return true;
  }

  // If all tasks completed, day is complete
  const allCompleted = plan.tasks.every(t => t.status === "completed" || t.status === "skipped");
  return allCompleted;
}

/**
 * Get timeline preview (next 3-4 tasks)
 */
export function getTimelinePreview(tasks: Task[], limit: number = 4): Task[] {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Get upcoming tasks (not completed, not skipped)
  const upcoming = tasks
    .filter(t => t.status !== "completed" && t.status !== "skipped")
    .filter(t => t.startMin >= currentMin || t.startMin === 0)
    .sort((a, b) => a.startMin - b.startMin)
    .slice(0, limit);

  return upcoming;
}
