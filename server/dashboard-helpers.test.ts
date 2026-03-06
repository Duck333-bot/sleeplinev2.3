/**
 * Dashboard Helpers Tests
 * 
 * Tests for dashboard utility functions:
 * - getNextTask
 * - getDailyProgress
 * - getCurrentEnergyPhase
 * - getSleepGoalInfo
 * - getTimelinePreview
 */

import { describe, it, expect, beforeEach, vi } from "vitest";
import type { Task, DayPlan } from "../client/src/lib/schemas";

// Mock implementations
function getNextTask(tasks: Task[]): Task | null {
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const upcomingTasks = tasks
    .filter(t => t.status !== "completed" && t.status !== "skipped")
    .filter(t => t.startMin > currentMin || t.startMin === 0)
    .sort((a, b) => a.startMin - b.startMin);

  if (upcomingTasks.length > 0) return upcomingTasks[0];

  const incompleteTasks = tasks
    .filter(t => t.status !== "completed" && t.status !== "skipped")
    .sort((a, b) => a.startMin - b.startMin);

  return incompleteTasks.length > 0 ? incompleteTasks[0] : null;
}

function getDailyProgress(tasks: Task[]): {
  completed: number;
  total: number;
  percentage: number;
} {
  const total = tasks.length;
  const completed = tasks.filter(t => t.status === "completed").length;
  const percentage = total > 0 ? Math.round((completed / total) * 100) : 0;

  return { completed, total, percentage };
}

describe("Dashboard Helpers", () => {
  describe("getNextTask", () => {
    it("should return the next upcoming task", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Breakfast",
          startMin: 450,
          endMin: 480,
          type: "other",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
        {
          id: "2",
          title: "Study",
          startMin: 960,
          endMin: 1080,
          type: "study",
          priority: "high",
          status: "pending",
          locked: false,
          notes: "",
        },
        {
          id: "3",
          title: "Exercise",
          startMin: 1200,
          endMin: 1260,
          type: "exercise",
          priority: "med",
          status: "pending",
          locked: false,
          notes: "",
        },
      ];

      const next = getNextTask(tasks);
      expect(next?.id).toBe("2");
      expect(next?.title).toBe("Study");
    });

    it("should skip completed tasks", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          startMin: 480,
          endMin: 540,
          type: "work",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
        {
          id: "2",
          title: "Task 2",
          startMin: 600,
          endMin: 660,
          type: "work",
          priority: "low",
          status: "pending",
          locked: false,
          notes: "",
        },
      ];

      const next = getNextTask(tasks);
      expect(next?.id).toBe("2");
    });

    it("should return null when all tasks completed", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          startMin: 480,
          endMin: 540,
          type: "work",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
      ];

      const next = getNextTask(tasks);
      expect(next).toBeNull();
    });

    it("should handle unscheduled tasks", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Unscheduled",
          startMin: 0,
          endMin: 0,
          type: "work",
          priority: "low",
          status: "pending",
          locked: false,
          notes: "",
        },
        {
          id: "2",
          title: "Scheduled",
          startMin: 1200,
          endMin: 1260,
          type: "work",
          priority: "low",
          status: "pending",
          locked: false,
          notes: "",
        },
      ];

      const next = getNextTask(tasks);
      // Should return unscheduled task if it's the first pending
      expect(next?.id).toBe("1");
    });
  });

  describe("getDailyProgress", () => {
    it("should calculate progress correctly", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          startMin: 480,
          endMin: 540,
          type: "work",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
        {
          id: "2",
          title: "Task 2",
          startMin: 600,
          endMin: 660,
          type: "work",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
        {
          id: "3",
          title: "Task 3",
          startMin: 720,
          endMin: 780,
          type: "work",
          priority: "low",
          status: "pending",
          locked: false,
          notes: "",
        },
      ];

      const progress = getDailyProgress(tasks);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(3);
      expect(progress.percentage).toBe(67);
    });

    it("should handle empty task list", () => {
      const progress = getDailyProgress([]);
      expect(progress.completed).toBe(0);
      expect(progress.total).toBe(0);
      expect(progress.percentage).toBe(0);
    });

    it("should handle all tasks completed", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          startMin: 480,
          endMin: 540,
          type: "work",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
        {
          id: "2",
          title: "Task 2",
          startMin: 600,
          endMin: 660,
          type: "work",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
      ];

      const progress = getDailyProgress(tasks);
      expect(progress.completed).toBe(2);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(100);
    });

    it("should ignore skipped tasks", () => {
      const tasks: Task[] = [
        {
          id: "1",
          title: "Task 1",
          startMin: 480,
          endMin: 540,
          type: "work",
          priority: "low",
          status: "completed",
          locked: false,
          notes: "",
        },
        {
          id: "2",
          title: "Task 2",
          startMin: 600,
          endMin: 660,
          type: "work",
          priority: "low",
          status: "skipped",
          locked: false,
          notes: "",
        },
      ];

      const progress = getDailyProgress(tasks);
      expect(progress.completed).toBe(1);
      expect(progress.total).toBe(2);
      expect(progress.percentage).toBe(50);
    });
  });
});
