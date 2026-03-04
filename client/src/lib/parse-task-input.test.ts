/**
 * Sleepline — Natural Language Task Parser Tests
 */

import { describe, it, expect } from "vitest";
import { parseTaskInput, validateParsedTask, formatMinutesAsTime } from "./parse-task-input";

describe("Natural Language Task Parser", () => {
  describe("Basic patterns", () => {
    it('should parse "Math homework at 7pm"', () => {
      const result = parseTaskInput("Math homework at 7pm");
      expect(result.title).toBe("Math homework");
      expect(result.start).toBe(1140); // 7pm = 19:00 = 1140 minutes
      expect(result.end).toBe(1185); // +45 min default
      expect(result.duration).toBe(45);
    });

    it('should parse "Gym 18:00"', () => {
      const result = parseTaskInput("Gym 18:00");
      expect(result.title).toBe("Gym");
      expect(result.start).toBe(1080); // 18:00 = 1080 minutes
      expect(result.end).toBe(1125); // +45 min default
    });

    it('should parse "Study for 30 minutes at 9pm"', () => {
      const result = parseTaskInput("Study for 30 minutes at 9pm");
      expect(result.title).toBe("Study");
      expect(result.start).toBe(1260); // 9pm = 21:00 = 1260 minutes
      expect(result.end).toBe(1290); // +30 min
      expect(result.duration).toBe(30);
    });

    it('should parse "Read for 45 mins at 8:30pm"', () => {
      const result = parseTaskInput("Read for 45 mins at 8:30pm");
      expect(result.title).toBe("Read");
      expect(result.start).toBe(1230); // 8:30pm = 20:30 = 1230 minutes
      expect(result.end).toBe(1275); // +45 min
      expect(result.duration).toBe(45);
    });
  });

  describe("Time format variations", () => {
    it("should handle 12-hour format with am", () => {
      const result = parseTaskInput("Breakfast at 7:30am");
      expect(result.title).toBe("Breakfast");
      expect(result.start).toBe(450); // 7:30am = 450 minutes
    });

    it("should handle 12-hour format with pm", () => {
      const result = parseTaskInput("Lunch at 12:30pm");
      expect(result.title).toBe("Lunch");
      expect(result.start).toBe(750); // 12:30pm = 750 minutes
    });

    it("should handle 24-hour format", () => {
      const result = parseTaskInput("Meeting at 14:00");
      expect(result.title).toBe("Meeting");
      expect(result.start).toBe(840); // 14:00 = 840 minutes
    });

    it("should handle midnight", () => {
      const result = parseTaskInput("Sleep at 12:00am");
      expect(result.title).toBe("Sleep");
      expect(result.start).toBe(0); // 12:00am = 0 minutes
    });

    it("should handle noon", () => {
      const result = parseTaskInput("Lunch at 12:00pm");
      expect(result.title).toBe("Lunch");
      expect(result.start).toBe(720); // 12:00pm = 720 minutes
    });
  });

  describe("Duration variations", () => {
    it("should parse duration in hours", () => {
      const result = parseTaskInput("Project work for 2 hours at 10am");
      expect(result.title).toBe("Project work");
      expect(result.start).toBe(600); // 10am
      expect(result.duration).toBe(120); // 2 hours
      expect(result.end).toBe(720);
    });

    it("should parse duration with 'hr' abbreviation", () => {
      const result = parseTaskInput("Exercise for 1 hr at 6pm");
      expect(result.duration).toBe(60);
    });

    it("should parse duration with 'min' abbreviation", () => {
      const result = parseTaskInput("Meditation for 15 min at 8am");
      expect(result.duration).toBe(15);
    });

    it("should parse duration with 'm' abbreviation", () => {
      const result = parseTaskInput("Quick call for 20m at 3pm");
      expect(result.duration).toBe(20);
    });
  });

  describe("Edge cases", () => {
    it("should handle task with no time", () => {
      const result = parseTaskInput("Read a book");
      expect(result.title).toBe("Read a book");
      expect(result.start).toBeNull();
      expect(result.end).toBeNull();
      expect(result.duration).toBeNull();
    });

    it("should handle task with only duration", () => {
      const result = parseTaskInput("Study for 1 hour");
      expect(result.title).toBe("Study");
      expect(result.start).toBeNull();
      expect(result.end).toBeNull();
      expect(result.duration).toBe(60);
    });

    it("should handle empty input", () => {
      const result = parseTaskInput("");
      expect(result.title).toBe("Untitled Task");
      expect(result.start).toBeNull();
    });

    it("should handle whitespace", () => {
      const result = parseTaskInput("  Math homework at 7pm  ");
      expect(result.title).toBe("Math homework");
      expect(result.start).toBe(1140);
    });

    it("should handle multiple spaces", () => {
      const result = parseTaskInput("Math  homework  at  7pm");
      expect(result.title).toContain("Math");
      expect(result.start).toBe(1140);
    });
  });

  describe("Complex phrases", () => {
    it('should parse "Practice piano before dinner"', () => {
      const result = parseTaskInput("Practice piano before dinner");
      expect(result.title).toContain("Practice piano");
      expect(result.start).toBeNull(); // No specific time
    });

    it('should parse "Homework after school for 1 hour"', () => {
      const result = parseTaskInput("Homework after school for 1 hour");
      expect(result.title).toContain("Homework");
      expect(result.duration).toBe(60);
    });

    it('should parse "Gym session 6pm for 90 minutes"', () => {
      const result = parseTaskInput("Gym session 6pm for 90 minutes");
      expect(result.title).toBe("Gym session");
      expect(result.start).toBe(1080); // 6pm
      expect(result.duration).toBe(90);
      expect(result.end).toBe(1170);
    });
  });

  describe("Validation", () => {
    it("should validate correct task", () => {
      const parsed = parseTaskInput("Math homework at 7pm");
      const validation = validateParsedTask(parsed);
      expect(validation.valid).toBe(true);
      expect(validation.errors).toHaveLength(0);
    });

    it("should reject invalid time range", () => {
      const parsed = {
        title: "Test",
        start: 1000,
        end: 900, // end before start
        duration: null,
      };
      const validation = validateParsedTask(parsed);
      expect(validation.valid).toBe(false);
      expect(validation.errors.length).toBeGreaterThan(0);
    });

    it("should reject out-of-bounds times", () => {
      const parsed = {
        title: "Test",
        start: 2000, // > 1439
        end: 2100,
        duration: null,
      };
      const validation = validateParsedTask(parsed);
      expect(validation.valid).toBe(false);
    });
  });

  describe("Time formatting", () => {
    it("should format 0 minutes as 12:00 AM", () => {
      expect(formatMinutesAsTime(0)).toBe("12:00 AM");
    });

    it("should format 720 minutes as 12:00 PM", () => {
      expect(formatMinutesAsTime(720)).toBe("12:00 PM");
    });

    it("should format 1140 minutes as 7:00 PM", () => {
      expect(formatMinutesAsTime(1140)).toBe("7:00 PM");
    });

    it("should format 600 minutes as 10:00 AM", () => {
      expect(formatMinutesAsTime(600)).toBe("10:00 AM");
    });
  });

  describe("Real-world examples", () => {
    it('should parse "Math homework at 7pm"', () => {
      const result = parseTaskInput("Math homework at 7pm");
      expect(result.title).toBe("Math homework");
      expect(result.start).toBe(1140);
      expect(result.end).toBe(1185);
    });

    it('should parse "Gym 18:00"', () => {
      const result = parseTaskInput("Gym 18:00");
      expect(result.title).toBe("Gym");
      expect(result.start).toBe(1080);
      expect(result.end).toBe(1125);
    });

    it('should parse "Study after school"', () => {
      const result = parseTaskInput("Study after school");
      expect(result.title).toContain("Study");
      expect(result.start).toBeNull();
    });

    it('should parse "Read for 30 minutes at 9pm"', () => {
      const result = parseTaskInput("Read for 30 minutes at 9pm");
      expect(result.title).toBe("Read");
      expect(result.start).toBe(1260);
      expect(result.end).toBe(1290);
    });

    it('should parse "Practice piano before dinner"', () => {
      const result = parseTaskInput("Practice piano before dinner");
      expect(result.title).toContain("Practice piano");
      expect(result.start).toBeNull();
    });
  });
});
