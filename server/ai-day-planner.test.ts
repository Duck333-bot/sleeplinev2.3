/**
 * AI Day Planner Tests
 * 
 * Tests for the flagship AI Day Planning feature
 */

import { describe, it, expect } from "vitest";
import { validateDayPlan, DayPlanResponseSchema } from "./ai-day-planner";
import type { DayPlanResponse } from "./ai-day-planner";

describe("AI Day Planner", () => {
  describe("validateDayPlan", () => {
    it("should validate a correct plan", () => {
      const plan: DayPlanResponse = {
        summary: "Your day with focused work and breaks",
        blocks: [
          { title: "Wake up", start: 360, end: 420, type: "snack", priority: "low", locked: false },
          { title: "Study", start: 420, end: 540, type: "task", priority: "high", locked: false },
          { title: "Break", start: 540, end: 560, type: "break", priority: "low", locked: false },
          { title: "Sleep", start: 1320, end: 1440, type: "sleep", priority: "high", locked: true },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it("should reject plan with no blocks", () => {
      const plan: DayPlanResponse = {
        summary: "Empty plan",
        blocks: [],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it("should reject plan with no sleep block", () => {
      const plan: DayPlanResponse = {
        summary: "Plan without sleep",
        blocks: [
          { title: "Work", start: 540, end: 1080, type: "task", priority: "med", locked: false },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("sleep"))).toBe(true);
    });

    it("should detect overlapping blocks", () => {
      const plan: DayPlanResponse = {
        summary: "Plan with overlap",
        blocks: [
          { title: "Task 1", start: 540, end: 660, type: "task", priority: "med", locked: false },
          { title: "Task 2", start: 600, end: 720, type: "task", priority: "med", locked: false },
          { title: "Sleep", start: 1320, end: 1440, type: "sleep", priority: "high", locked: true },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Overlap"))).toBe(true);
    });

    it("should reject blocks with invalid time ranges", () => {
      const plan: DayPlanResponse = {
        summary: "Invalid times",
        blocks: [
          { title: "Bad block", start: 600, end: 600, type: "task", priority: "med", locked: false },
          { title: "Sleep", start: 1320, end: 1440, type: "sleep", priority: "high", locked: true },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("End time must be after"))).toBe(true);
    });

    it("should reject blocks outside 0-1440 range", () => {
      const plan: DayPlanResponse = {
        summary: "Out of range",
        blocks: [
          { title: "Bad time", start: -10, end: 100, type: "task", priority: "med", locked: false },
          { title: "Sleep", start: 1320, end: 1440, type: "sleep", priority: "high", locked: true },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(false);
    });

    it("should reject blocks with duration < 5 minutes", () => {
      const plan: DayPlanResponse = {
        summary: "Too short",
        blocks: [
          { title: "Too short", start: 540, end: 542, type: "task", priority: "med", locked: false },
          { title: "Sleep", start: 1320, end: 1440, type: "sleep", priority: "high", locked: true },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes("Duration must be at least 5"))).toBe(true);
    });

    it("should reject plan exceeding 24 hours", () => {
      const plan: DayPlanResponse = {
        summary: "Overloaded",
        blocks: [
          { title: "Task 1", start: 0, end: 720, type: "task", priority: "med", locked: false },
          { title: "Task 2", start: 720, end: 1440, type: "task", priority: "med", locked: false },
          { title: "Sleep", start: 1440, end: 1500, type: "sleep", priority: "high", locked: true },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(false);
    });

    it("should accept plans with warnings", () => {
      const plan: DayPlanResponse = {
        summary: "Busy day",
        blocks: [
          { title: "Work", start: 540, end: 1080, type: "task", priority: "high", locked: false },
          { title: "Sleep", start: 1320, end: 1440, type: "sleep", priority: "high", locked: true },
        ],
        warnings: ["This is a very busy day with limited breaks"],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(true);
    });

    it("should validate realistic school day plan", () => {
      const plan: DayPlanResponse = {
        summary: "School day with homework and exercise",
        blocks: [
          { title: "Wake & breakfast", start: 360, end: 420, type: "snack", priority: "low", locked: false },
          { title: "School", start: 480, end: 900, type: "task", priority: "high", locked: true },
          { title: "Lunch", start: 900, end: 960, type: "snack", priority: "low", locked: false },
          { title: "School continued", start: 960, end: 1020, type: "task", priority: "high", locked: true },
          { title: "Homework", start: 1020, end: 1140, type: "task", priority: "med", locked: false },
          { title: "Exercise", start: 1140, end: 1200, type: "task", priority: "med", locked: false },
          { title: "Dinner", start: 1200, end: 1260, type: "snack", priority: "low", locked: false },
          { title: "Free time", start: 1260, end: 1320, type: "task", priority: "low", locked: false },
          { title: "Wind down", start: 1320, end: 1380, type: "wind-down", priority: "low", locked: false },
          { title: "Sleep", start: 1380, end: 1440, type: "sleep", priority: "high", locked: true },
        ],
        warnings: [],
      };

      const result = validateDayPlan(plan);
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });


});
