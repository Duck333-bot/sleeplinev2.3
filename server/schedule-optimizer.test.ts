/**
 * Schedule Optimizer Tests
 */

import { describe, it, expect } from "vitest";
import { OptimizationResultSchema, blocksToTasks } from "./schedule-optimizer";

describe("Schedule Optimizer", () => {
  describe("OptimizationResultSchema", () => {
    it("should validate a correct optimization result", () => {
      const result = {
        blocks: [
          { title: "Wake up", start: 360, end: 420 },
          { title: "Study", start: 420, end: 540, type: "study", priority: "high" },
          { title: "Break", start: 540, end: 570 },
          { title: "Exercise", start: 570, end: 630, type: "exercise", priority: "med" },
        ],
        reason: "Moved study to early morning when energy is highest, then exercise for recovery.",
        improvements: ["Study during peak focus hours", "Exercise after mental work"],
      };

      const validation = OptimizationResultSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });

    it("should require blocks array", () => {
      const result = {
        reason: "Test reason",
      };

      const validation = OptimizationResultSchema.safeParse(result);
      expect(validation.success).toBe(false);
    });

    it("should require reason string", () => {
      const result = {
        blocks: [{ title: "Task", start: 0, end: 60 }],
      };

      const validation = OptimizationResultSchema.safeParse(result);
      expect(validation.success).toBe(false);
    });

    it("should validate block times", () => {
      const result = {
        blocks: [
          { title: "Task", start: -10, end: 60 }, // Invalid start
        ],
        reason: "Test",
      };

      const validation = OptimizationResultSchema.safeParse(result);
      expect(validation.success).toBe(false);
    });

    it("should accept optional improvements", () => {
      const result = {
        blocks: [{ title: "Task", start: 0, end: 60 }],
        reason: "Test reason",
      };

      const validation = OptimizationResultSchema.safeParse(result);
      expect(validation.success).toBe(true);
    });
  });

  describe("blocksToTasks", () => {
    it("should convert blocks back to task format", () => {
      const blocks = [
        { title: "Study", start: 420, end: 540, type: "study", priority: "high" },
        { title: "Break", start: 540, end: 570 },
      ];

      const originalTasks = [
        {
          id: "task-1",
          title: "Study",
          startMin: 360,
          endMin: 480,
          type: "study",
          priority: "high",
          status: "pending",
          locked: false,
        },
      ];

      const result = blocksToTasks(blocks, originalTasks);

      expect(result).toHaveLength(2);
      expect(result[0].title).toBe("Study");
      expect(result[0].startMin).toBe(420);
      expect(result[0].endMin).toBe(540);
      expect(result[0].type).toBe("study");
      expect(result[0].priority).toBe("high");
    });

    it("should preserve original task properties", () => {
      const blocks = [
        { title: "Study", start: 420, end: 540, type: "study", priority: "high" },
      ];

      const originalTasks = [
        {
          id: "task-1",
          title: "Study",
          startMin: 360,
          endMin: 480,
          type: "study",
          priority: "high",
          status: "pending",
          locked: true,
          notes: "Important exam prep",
        },
      ];

      const result = blocksToTasks(blocks, originalTasks);

      expect(result[0].id).toBe("task-1");
      expect(result[0].locked).toBe(true);
      expect(result[0].notes).toBe("Important exam prep");
    });

    it("should create new tasks for unmatched blocks", () => {
      const blocks = [
        { title: "New Task", start: 600, end: 660 },
      ];

      const originalTasks: any[] = [];

      const result = blocksToTasks(blocks, originalTasks);

      expect(result).toHaveLength(1);
      expect(result[0].title).toBe("New Task");
      expect(result[0].startMin).toBe(600);
      expect(result[0].endMin).toBe(660);
    });

    it("should maintain chronological order", () => {
      const blocks = [
        { title: "Wake", start: 360, end: 420 },
        { title: "Study", start: 420, end: 540 },
        { title: "Exercise", start: 540, end: 600 },
        { title: "Lunch", start: 600, end: 660 },
      ];

      const originalTasks = blocks.map((b, i) => ({
        id: `task-${i}`,
        title: b.title,
        startMin: b.start,
        endMin: b.end,
        type: "other",
        priority: "med",
        status: "pending",
        locked: false,
      }));

      const result = blocksToTasks(blocks, originalTasks);

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].endMin).toBeLessThanOrEqual(result[i + 1].startMin);
      }
    });
  });

  describe("Schedule constraints", () => {
    it("should handle tasks with same duration", () => {
      const originalDuration = 120; // 2 hours
      const blocks = [
        { title: "Study", start: 420, end: 540 }, // 120 minutes
      ];

      const originalTasks = [
        {
          id: "task-1",
          title: "Study",
          startMin: 360,
          endMin: 480, // 120 minutes
          type: "study",
          priority: "high",
          status: "pending",
          locked: false,
        },
      ];

      const result = blocksToTasks(blocks, originalTasks);
      const newDuration = result[0].endMin - result[0].startMin;

      expect(newDuration).toBe(originalDuration);
    });

    it("should handle locked tasks", () => {
      const blocks = [
        { title: "Class", start: 480, end: 540 },
      ];

      const originalTasks = [
        {
          id: "task-1",
          title: "Class",
          startMin: 480,
          endMin: 540,
          type: "class",
          priority: "high",
          status: "pending",
          locked: true, // Locked, should not move
        },
      ];

      const result = blocksToTasks(blocks, originalTasks);

      expect(result[0].locked).toBe(true);
    });
  });
});
