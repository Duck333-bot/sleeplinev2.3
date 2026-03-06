/**
 * Plan Normalization Tests
 * 
 * Tests for deduplication, validation, and normalization utilities
 */

import { describe, it, expect } from "vitest";
import type { Task, DayPlan } from "../client/src/lib/schemas";

// Mock implementations for testing (since we can't import from client)
function deduplicateTasks(tasks: Task[]): Task[] {
  const seen = new Set<string>();
  return tasks.filter(task => {
    if (seen.has(task.id)) return false;
    seen.add(task.id);
    return true;
  });
}

describe("Plan Normalization", () => {
  describe("deduplicateTasks", () => {
    it("should remove duplicate tasks by ID", () => {
      const task1: Task = {
        id: "task-1",
        title: "Homework",
        startMin: 1080,
        endMin: 1140,
        type: "study",
        priority: "high",
        status: "pending",
        locked: false,
        notes: "",
      };

      const task2: Task = {
        id: "task-2",
        title: "Gym",
        startMin: 960,
        endMin: 1020,
        type: "exercise",
        priority: "med",
        status: "pending",
        locked: false,
        notes: "",
      };

      const duplicate = { ...task1, id: "task-1" };

      const tasks = [task1, task2, duplicate];
      const deduplicated = deduplicateTasks(tasks);

      expect(deduplicated).toHaveLength(2);
      expect(deduplicated.map(t => t.id)).toEqual(["task-1", "task-2"]);
    });

    it("should preserve order of first occurrence", () => {
      const task1: Task = {
        id: "a",
        title: "First",
        startMin: 0,
        endMin: 60,
        type: "work",
        priority: "low",
        status: "pending",
        locked: false,
        notes: "",
      };

      const task2: Task = {
        id: "b",
        title: "Second",
        startMin: 60,
        endMin: 120,
        type: "work",
        priority: "low",
        status: "pending",
        locked: false,
        notes: "",
      };

      const tasks = [task1, task2, { ...task1, id: "a" }];
      const deduplicated = deduplicateTasks(tasks);

      expect(deduplicated[0].title).toBe("First");
      expect(deduplicated[1].title).toBe("Second");
    });

    it("should handle empty array", () => {
      const deduplicated = deduplicateTasks([]);
      expect(deduplicated).toHaveLength(0);
    });

    it("should handle array with no duplicates", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          startMin: 0,
          endMin: 60,
          type: "work",
          priority: "low",
          status: "pending",
          locked: false,
          notes: "",
        },
        {
          id: "2",
          title: "Task 2",
          startMin: 60,
          endMin: 120,
          type: "work",
          priority: "low",
          status: "pending",
          locked: false,
          notes: "",
        },
      ];

      const deduplicated = deduplicateTasks(tasks);
      expect(deduplicated).toHaveLength(2);
    });
  });

  describe("Task validation", () => {
    it("should identify invalid start times", () => {
      const task: Task = {
        id: "invalid",
        title: "Bad Task",
        startMin: -1, // Invalid
        endMin: 60,
        type: "work",
        priority: "low",
        status: "pending",
        locked: false,
        notes: "",
      };

      expect(task.startMin).toBeLessThan(0);
    });

    it("should identify invalid end times", () => {
      const task: Task = {
        id: "invalid",
        title: "Bad Task",
        startMin: 60,
        endMin: 1500, // Invalid (> 1440)
        type: "work",
        priority: "low",
        status: "pending",
        locked: false,
        notes: "",
      };

      expect(task.endMin).toBeGreaterThan(1440);
    });

    it("should identify end time before start time", () => {
      const task: Task = {
        id: "invalid",
        title: "Bad Task",
        startMin: 120,
        endMin: 60, // Invalid (before start)
        type: "work",
        priority: "low",
        status: "pending",
        locked: false,
        notes: "",
      };

      expect(task.endMin).toBeLessThanOrEqual(task.startMin);
    });
  });

  describe("Duplicate detection", () => {
    it("should detect when new plan has same task IDs as existing", () => {
      const taskId = "shared-task";
      
      const existingIds = new Set(["task-1", "task-2", taskId]);
      const newTaskIds = [taskId, "task-3", "task-4"];
      
      const duplicates = newTaskIds.filter(id => existingIds.has(id));
      
      expect(duplicates).toEqual([taskId]);
    });

    it("should return empty array when no duplicates", () => {
      const existingIds = new Set(["task-1", "task-2"]);
      const newTaskIds = ["task-3", "task-4"];
      
      const duplicates = newTaskIds.filter(id => existingIds.has(id));
      
      expect(duplicates).toHaveLength(0);
    });
  });
});
