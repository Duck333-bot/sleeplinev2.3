/**
 * Sleepline — Task Sorting Utility
 * 
 * Ensures tasks always appear in chronological order by start time.
 * Unscheduled tasks (startMin = 0) are sorted to the end.
 */

import type { Task, SystemBlock } from "./schemas";

/**
 * Sort tasks by start time (ascending)
 * Unscheduled tasks (startMin = 0) are sorted to the end
 * 
 * @param tasks - Array of tasks to sort
 * @returns New sorted array (does not mutate original)
 * 
 * @example
 * const tasks = [
 *   { id: "1", title: "Homework", startMin: 1080, ... },
 *   { id: "2", title: "Breakfast", startMin: 450, ... },
 *   { id: "3", title: "Gym", startMin: 960, ... }
 * ];
 * const sorted = sortTasksByTime(tasks);
 * // Result: Breakfast (450), Gym (960), Homework (1080)
 */
export function sortTasksByTime(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    // Unscheduled tasks (startMin = 0) go to the end
    if (a.startMin === 0 && b.startMin === 0) return 0;
    if (a.startMin === 0) return 1;
    if (b.startMin === 0) return -1;
    
    // Sort by start time ascending
    return a.startMin - b.startMin;
  });
}

/**
 * Sort system blocks by start time (ascending)
 * 
 * @param blocks - Array of system blocks to sort
 * @returns New sorted array (does not mutate original)
 */
export function sortBlocksByTime(blocks: SystemBlock[]): SystemBlock[] {
  return [...blocks].sort((a, b) => a.startMin - b.startMin);
}
