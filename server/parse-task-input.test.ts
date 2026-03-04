/**
 * Sleepline — Natural Language Task Parser Tests
 */

import { describe, it, expect } from "vitest";

// Import types from client (tests can reference client types)
interface ParsedTaskInput {
  title: string;
  start: number | null;
  end: number | null;
  duration: number | null;
}

// Replicate parser functions for testing
function parse12HourTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toLowerCase();

  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function parse24HourTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return null;

  const hours = parseInt(match[1], 10);
  const minutes = parseInt(match[2], 10);

  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

function extractTime(timeStr: string): number | null {
  if (!timeStr) return null;
  let result = parse24HourTime(timeStr);
  if (result !== null) return result;
  result = parse12HourTime(timeStr);
  if (result !== null) return result;
  return null;
}

function extractDuration(text: string): number | null {
  const durationMatch = text.match(/(\d+(?:\.\d+)?)\s*(hour|hr|minute|min|m)s?/i);
  if (!durationMatch) return null;

  const value = parseFloat(durationMatch[1]);
  const unit = durationMatch[2].toLowerCase();

  if (unit === "hour" || unit === "hr") {
    return value * 60;
  } else if (unit === "minute" || unit === "min" || unit === "m") {
    return value;
  }

  return null;
}

function parseTaskInput(input: string): ParsedTaskInput {
  if (!input || typeof input !== "string") {
    return { title: input || "", start: null, end: null, duration: null };
  }

  const trimmed = input.trim();
  let title = trimmed;
  let startTime: number | null = null;
  let duration: number | null = null;

  const durationMatch = trimmed.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(hour|hr|minute|min|m)s?\b/i);
  if (durationMatch) {
    duration = extractDuration(durationMatch[0]);
    title = trimmed.replace(durationMatch[0], "").trim();
  }

  const atMatch = title.match(/\bat\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)\b/i);
  if (atMatch) {
    startTime = extractTime(atMatch[1]);
    title = title.replace(atMatch[0], "").trim();
  } else {
    const timeMatch = title.match(/\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)\s*$/i);
    if (timeMatch) {
      startTime = extractTime(timeMatch[1]);
      if (startTime !== null) {
        title = title.replace(timeMatch[0], "").trim();
      }
    }
  }

  if (duration === null && startTime !== null) {
    duration = 45;
  }

  let endTime: number | null = null;
  if (startTime !== null && duration !== null) {
    endTime = Math.min(startTime + duration, 1440);
  }

  return {
    title: title || "Untitled Task",
    start: startTime,
    end: endTime,
    duration,
  };
}

describe("Natural Language Task Parser", () => {
  describe("Basic patterns", () => {
    it('should parse "Math homework at 7pm"', () => {
      const result = parseTaskInput("Math homework at 7pm");
      expect(result.title).toBe("Math homework");
      expect(result.start).toBe(1140);
      expect(result.end).toBe(1185);
      expect(result.duration).toBe(45);
    });

    it('should parse "Gym 18:00"', () => {
      const result = parseTaskInput("Gym 18:00");
      expect(result.title).toBe("Gym");
      expect(result.start).toBe(1080);
      expect(result.end).toBe(1125);
    });

    it('should parse "Study for 30 minutes at 9pm"', () => {
      const result = parseTaskInput("Study for 30 minutes at 9pm");
      expect(result.title).toBe("Study");
      expect(result.start).toBe(1260);
      expect(result.end).toBe(1290);
      expect(result.duration).toBe(30);
    });

    it('should parse "Read for 45 mins at 8:30pm"', () => {
      const result = parseTaskInput("Read for 45 mins at 8:30pm");
      expect(result.title).toBe("Read");
      expect(result.start).toBe(1230);
      expect(result.end).toBe(1275);
      expect(result.duration).toBe(45);
    });
  });

  describe("Time format variations", () => {
    it("should handle 12-hour format with am", () => {
      const result = parseTaskInput("Breakfast at 7:30am");
      expect(result.title).toBe("Breakfast");
      expect(result.start).toBe(450);
    });

    it("should handle 12-hour format with pm", () => {
      const result = parseTaskInput("Lunch at 12:30pm");
      expect(result.title).toBe("Lunch");
      expect(result.start).toBe(750);
    });

    it("should handle 24-hour format", () => {
      const result = parseTaskInput("Meeting at 14:00");
      expect(result.title).toBe("Meeting");
      expect(result.start).toBe(840);
    });

    it("should handle midnight", () => {
      const result = parseTaskInput("Sleep at 12:00am");
      expect(result.title).toBe("Sleep");
      expect(result.start).toBe(0);
    });

    it("should handle noon", () => {
      const result = parseTaskInput("Lunch at 12:00pm");
      expect(result.title).toBe("Lunch");
      expect(result.start).toBe(720);
    });
  });

  describe("Duration variations", () => {
    it("should parse duration in hours", () => {
      const result = parseTaskInput("Project work for 2 hours at 10am");
      expect(result.title).toBe("Project work");
      expect(result.start).toBe(600);
      expect(result.duration).toBe(120);
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
      expect(result.title).toBe("");
      expect(result.start).toBeNull();
    });

    it("should handle whitespace", () => {
      const result = parseTaskInput("  Math homework at 7pm  ");
      expect(result.title).toBe("Math homework");
      expect(result.start).toBe(1140);
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
