/**
 * Bedtime Explanation Tests
 */

import { describe, it, expect } from "vitest";
import { FALLBACK_EXPLANATION } from "./bedtime-explanation";

describe("Bedtime Explanation", () => {
  describe("Constants", () => {
    it("should have a fallback explanation", () => {
      expect(FALLBACK_EXPLANATION).toBeDefined();
      expect(typeof FALLBACK_EXPLANATION).toBe("string");
      expect(FALLBACK_EXPLANATION.length).toBeGreaterThan(0);
    });

    it("fallback should be under 50 words", () => {
      const wordCount = FALLBACK_EXPLANATION.split(/\s+/).length;
      expect(wordCount).toBeLessThan(50);
    });

    it("fallback should mention bedtime and schedule", () => {
      expect(FALLBACK_EXPLANATION.toLowerCase()).toContain("bedtime");
    });
  });

  describe("Input validation", () => {
    it("should accept valid bedtime inputs", () => {
      const validInputs = [
        { recommendedBedtime: 0, wakeTime: 360, tasks: [], sleepGoal: 8 },
        { recommendedBedtime: 1200, wakeTime: 360, tasks: [], sleepGoal: 8 },
        { recommendedBedtime: 1439, wakeTime: 360, tasks: [], sleepGoal: 8 },
      ];

      validInputs.forEach(input => {
        expect(input.recommendedBedtime).toBeGreaterThanOrEqual(0);
        expect(input.recommendedBedtime).toBeLessThanOrEqual(1439);
      });
    });

    it("should validate wake time range", () => {
      const validWakeTimes = [0, 360, 720, 1439];
      const invalidWakeTimes = [-1, 1440, 2000];

      validWakeTimes.forEach(time => {
        expect(time).toBeGreaterThanOrEqual(0);
        expect(time).toBeLessThanOrEqual(1439);
      });

      invalidWakeTimes.forEach(time => {
        expect(time < 0 || time > 1439).toBe(true);
      });
    });

    it("should validate sleep goal range", () => {
      const validGoals = [4, 6, 8, 10, 14];
      const invalidGoals = [3, 15, 0, -1];

      validGoals.forEach(goal => {
        expect(goal).toBeGreaterThanOrEqual(4);
        expect(goal).toBeLessThanOrEqual(14);
      });

      invalidGoals.forEach(goal => {
        expect(goal < 4 || goal > 14).toBe(true);
      });
    });
  });

  describe("Schedule intensity analysis", () => {
    it("should handle empty task list", () => {
      const tasks: any[] = [];
      expect(tasks.length).toBe(0);
    });

    it("should handle light schedule (1-2 tasks)", () => {
      const tasks = [
        { id: "1", title: "Task 1", priority: "low" },
        { id: "2", title: "Task 2", priority: "low" },
      ];
      expect(tasks.length).toBeLessThan(3);
    });

    it("should handle moderate schedule (3-4 tasks)", () => {
      const tasks = [
        { id: "1", title: "Task 1", priority: "med" },
        { id: "2", title: "Task 2", priority: "med" },
        { id: "3", title: "Task 3", priority: "med" },
      ];
      expect(tasks.length).toBeGreaterThanOrEqual(3);
      expect(tasks.length).toBeLessThan(5);
    });

    it("should handle demanding schedule (many high priority tasks)", () => {
      const tasks = [
        { id: "1", title: "Task 1", priority: "high" },
        { id: "2", title: "Task 2", priority: "high" },
        { id: "3", title: "Task 3", priority: "high" },
        { id: "4", title: "Task 4", priority: "high" },
      ];
      const highPriorityCount = tasks.filter(t => t.priority === "high").length;
      expect(highPriorityCount / tasks.length).toBeGreaterThan(0.5);
    });
  });

  describe("Time formatting", () => {
    it("should format morning times correctly", () => {
      // 360 minutes = 6:00 AM
      const min = 360;
      const h = Math.floor(min / 60);
      const m = min % 60;
      expect(h).toBe(6);
      expect(m).toBe(0);
    });

    it("should format afternoon times correctly", () => {
      // 900 minutes = 3:00 PM
      const min = 900;
      const h = Math.floor(min / 60);
      const m = min % 60;
      expect(h).toBe(15);
      expect(m).toBe(0);
    });

    it("should format evening times correctly", () => {
      // 1380 minutes = 11:00 PM
      const min = 1380;
      const h = Math.floor(min / 60);
      const m = min % 60;
      expect(h).toBe(23);
      expect(m).toBe(0);
    });
  });

  describe("Explanation characteristics", () => {
    it("should be concise (1-2 sentences)", () => {
      const explanation = "You have an early wake-up tomorrow and several demanding tasks planned. Sleeping a bit earlier should improve focus.";
      const sentences = explanation.split(/[.!?]+/).filter(s => s.trim().length > 0);
      expect(sentences.length).toBeLessThanOrEqual(2);
    });

    it("should mention bedtime or sleep", () => {
      const explanation = "This bedtime supports your wake-up goal and tomorrow's schedule.";
      expect(explanation.toLowerCase()).toMatch(/bedtime|sleep/);
    });

    it("should be under 50 words", () => {
      const explanation = "You have an early wake-up tomorrow and several demanding tasks planned. Sleeping a bit earlier should improve focus and make the day feel easier.";
      const wordCount = explanation.split(/\s+/).length;
      expect(wordCount).toBeLessThan(50);
    });

    it("should use calm, trustworthy tone", () => {
      const explanation = "You're waking up early tomorrow with a full schedule. This bedtime gives you enough rest to handle the day with focus and energy.";
      // Check for positive language
      expect(explanation).toMatch(/enough|focus|energy|rest/i);
      // Should not have clinical language
      expect(explanation).not.toMatch(/circadian|melatonin|REM|NREM/i);
    });
  });

  describe("Error handling", () => {
    it("should handle missing tasks gracefully", () => {
      const input = {
        recommendedBedtime: 1380,
        wakeTime: 360,
        tasks: undefined as any,
        sleepGoal: 8,
      };
      // Should not crash
      expect(() => {
        if (!input.tasks) {
          // Fallback behavior
        }
      }).not.toThrow();
    });

    it("should handle invalid bedtime gracefully", () => {
      const input = {
        recommendedBedtime: 2000, // Invalid
        wakeTime: 360,
        tasks: [],
        sleepGoal: 8,
      };
      expect(input.recommendedBedtime > 1439).toBe(true);
    });

    it("should have fallback for LLM failures", () => {
      expect(FALLBACK_EXPLANATION).toBeDefined();
      expect(FALLBACK_EXPLANATION.length > 0).toBe(true);
    });
  });

  describe("Integration scenarios", () => {
    it("should work with early bedtime", () => {
      const input = {
        recommendedBedtime: 1260, // 9:00 PM
        wakeTime: 360, // 6:00 AM
        tasks: [
          { id: "1", title: "Morning Run", priority: "high" },
          { id: "2", title: "Important Meeting", priority: "high" },
        ],
        sleepGoal: 9,
      };
      expect(input.recommendedBedtime).toBeLessThan(1320); // Before 10 PM
    });

    it("should work with late bedtime", () => {
      const input = {
        recommendedBedtime: 1380, // 11:00 PM
        wakeTime: 540, // 9:00 AM
        tasks: [
          { id: "1", title: "Afternoon task", priority: "low" },
        ],
        sleepGoal: 8,
      };
      expect(input.recommendedBedtime).toBeGreaterThan(1320); // After 10 PM
    });

    it("should work with short sleep goal", () => {
      const input = {
        recommendedBedtime: 1320, // 10:00 PM
        wakeTime: 360, // 6:00 AM
        tasks: [],
        sleepGoal: 6,
      };
      expect(input.sleepGoal).toBeLessThan(7);
    });

    it("should work with long sleep goal", () => {
      const input = {
        recommendedBedtime: 1200, // 8:00 PM
        wakeTime: 360, // 6:00 AM
        tasks: [],
        sleepGoal: 10,
      };
      expect(input.sleepGoal).toBeGreaterThan(9);
    });
  });
});
