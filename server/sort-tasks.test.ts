/**
 * Sleepline — Task Sorting Tests
 * 
 * Tests for sortTasksByTime and sortBlocksByTime utilities
 */

import { describe, it, expect } from "vitest";
import { sortTasksByTime, sortBlocksByTime } from "../client/src/lib/sort-tasks";
import type { Task, SystemBlock } from "../client/src/lib/schemas";

describe("sortTasksByTime", () => {
  it("should sort tasks by start time in ascending order", () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "Homework",
        startMin: 1080,
        endMin: 1140,
        type: "study",
        priority: "high",
        status: "pending",
        locked: false,
      },
      {
        id: "2",
        title: "Breakfast",
        startMin: 450,
        endMin: 480,
        type: "other",
        priority: "low",
        status: "pending",
        locked: false,
      },
      {
        id: "3",
        title: "Gym",
        startMin: 960,
        endMin: 1020,
        type: "exercise",
        priority: "med",
        status: "pending",
        locked: false,
      },
    ];

    const sorted = sortTasksByTime(tasks);

    expect(sorted).toHaveLength(3);
    expect(sorted[0].title).toBe("Breakfast");
    expect(sorted[1].title).toBe("Gym");
    expect(sorted[2].title).toBe("Homework");
  });

  it("should move unscheduled tasks (startMin = 0) to the end", () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "Scheduled Task",
        startMin: 600,
        endMin: 660,
        type: "work",
        priority: "high",
        status: "pending",
        locked: false,
      },
      {
        id: "2",
        title: "Unscheduled Task",
        startMin: 0,
        endMin: 0,
        type: "other",
        priority: "low",
        status: "pending",
        locked: false,
      },
    ];

    const sorted = sortTasksByTime(tasks);

    expect(sorted[0].title).toBe("Scheduled Task");
    expect(sorted[1].title).toBe("Unscheduled Task");
  });

  it("should handle all unscheduled tasks", () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "Task A",
        startMin: 0,
        endMin: 0,
        type: "other",
        priority: "low",
        status: "pending",
        locked: false,
      },
      {
        id: "2",
        title: "Task B",
        startMin: 0,
        endMin: 0,
        type: "other",
        priority: "low",
        status: "pending",
        locked: false,
      },
    ];

    const sorted = sortTasksByTime(tasks);

    expect(sorted).toHaveLength(2);
    // Order of unscheduled tasks should be preserved (stable sort)
    expect(sorted[0].title).toBe("Task A");
    expect(sorted[1].title).toBe("Task B");
  });

  it("should not mutate the original array", () => {
    const tasks: Task[] = [
      {
        id: "1",
        title: "Task 1",
        startMin: 1000,
        endMin: 1060,
        type: "work",
        priority: "high",
        status: "pending",
        locked: false,
      },
      {
        id: "2",
        title: "Task 2",
        startMin: 500,
        endMin: 560,
        type: "study",
        priority: "med",
        status: "pending",
        locked: false,
      },
    ];

    const originalOrder = tasks.map(t => t.id);
    const sorted = sortTasksByTime(tasks);

    // Original array should be unchanged
    expect(tasks.map(t => t.id)).toEqual(originalOrder);
    // Sorted array should be different
    expect(sorted.map(t => t.id)).toEqual(["2", "1"]);
  });
});

describe("sortBlocksByTime", () => {
  it("should sort system blocks by start time in ascending order", () => {
    const blocks: SystemBlock[] = [
      {
        id: "1",
        type: "break",
        title: "Lunch Break",
        startMin: 720,
        endMin: 780,
        auto: true,
      },
      {
        id: "2",
        type: "wake-up",
        title: "Wake Up",
        startMin: 420,
        endMin: 450,
        auto: true,
      },
      {
        id: "3",
        type: "sleep",
        title: "Sleep",
        startMin: 1380,
        endMin: 1440,
        auto: true,
      },
    ];

    const sorted = sortBlocksByTime(blocks);

    expect(sorted).toHaveLength(3);
    expect(sorted[0].title).toBe("Wake Up");
    expect(sorted[1].title).toBe("Lunch Break");
    expect(sorted[2].title).toBe("Sleep");
  });

  it("should not mutate the original blocks array", () => {
    const blocks: SystemBlock[] = [
      {
        id: "1",
        type: "break",
        title: "Block 1",
        startMin: 1000,
        endMin: 1060,
        auto: true,
      },
      {
        id: "2",
        type: "wind-down",
        title: "Block 2",
        startMin: 500,
        endMin: 560,
        auto: true,
      },
    ];

    const originalOrder = blocks.map(b => b.id);
    const sorted = sortBlocksByTime(blocks);

    // Original array should be unchanged
    expect(blocks.map(b => b.id)).toEqual(originalOrder);
    // Sorted array should be different
    expect(sorted.map(b => b.id)).toEqual(["2", "1"]);
  });
});
