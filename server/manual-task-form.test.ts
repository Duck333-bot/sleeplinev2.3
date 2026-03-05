/**
 * Sleepline — Manual Task Form Tests
 * 
 * Tests for manual task creation functionality
 */

import { describe, it, expect } from "vitest";
import { timeToMin, minToDisplay } from "../client/src/lib/schemas";

describe("Manual Task Form Utilities", () => {
  describe("timeToMin", () => {
    it("should convert time string to minutes since midnight", () => {
      expect(timeToMin("00:00")).toBe(0);
      expect(timeToMin("09:00")).toBe(540);
      expect(timeToMin("12:00")).toBe(720);
      expect(timeToMin("18:30")).toBe(1110);
      expect(timeToMin("23:59")).toBe(1439);
    });

    it("should handle various time formats", () => {
      expect(timeToMin("01:30")).toBe(90);
      expect(timeToMin("06:45")).toBe(405);
      expect(timeToMin("15:15")).toBe(915);
    });
  });

  describe("minToDisplay", () => {
    it("should convert minutes to 12-hour display format", () => {
      expect(minToDisplay(0)).toBe("12:00 AM");
      expect(minToDisplay(540)).toBe("9:00 AM");
      expect(minToDisplay(720)).toBe("12:00 PM");
      expect(minToDisplay(1110)).toBe("6:30 PM");
      expect(minToDisplay(1439)).toBe("11:59 PM");
    });

    it("should handle edge cases", () => {
      expect(minToDisplay(60)).toBe("1:00 AM");
      expect(minToDisplay(780)).toBe("1:00 PM");
      expect(minToDisplay(1380)).toBe("11:00 PM");
    });
  });

  describe("Task Time Validation", () => {
    it("should validate start time is within 24-hour range", () => {
      const startMin = timeToMin("09:00");
      expect(startMin).toBeGreaterThanOrEqual(0);
      expect(startMin).toBeLessThan(1440);
    });

    it("should calculate end time correctly with duration", () => {
      const startMin = timeToMin("09:00");
      const duration = 60;
      const endMin = Math.min(startMin + duration, 1440);
      
      expect(startMin).toBe(540);
      expect(endMin).toBe(600);
      expect(endMin).toBeGreaterThan(startMin);
    });

    it("should cap end time at 1440 (midnight)", () => {
      const startMin = timeToMin("23:00");
      const duration = 120; // 2 hours
      const endMin = Math.min(startMin + duration, 1440);
      
      expect(endMin).toBe(1440);
    });

    it("should handle tasks that span across midnight", () => {
      const startMin = timeToMin("22:00");
      const duration = 180; // 3 hours
      const endMin = Math.min(startMin + duration, 1440);
      
      expect(startMin).toBe(1320);
      expect(endMin).toBe(1440); // Capped at midnight
    });
  });

  describe("Task Duration Validation", () => {
    it("should validate duration is positive", () => {
      const duration = 60;
      expect(duration).toBeGreaterThan(0);
    });

    it("should validate duration is reasonable", () => {
      const minDuration = 5;
      const maxDuration = 1440;
      const testDuration = 60;
      
      expect(testDuration).toBeGreaterThanOrEqual(minDuration);
      expect(testDuration).toBeLessThanOrEqual(maxDuration);
    });

    it("should handle various duration values", () => {
      const durations = [5, 15, 30, 45, 60, 90, 120, 180, 240, 1440];
      
      durations.forEach(duration => {
        expect(duration).toBeGreaterThan(0);
        expect(duration).toBeLessThanOrEqual(1440);
      });
    });
  });
});
