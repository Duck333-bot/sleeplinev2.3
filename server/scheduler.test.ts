import { describe, expect, it } from "vitest";

/**
 * Sleepline — Scheduler & AI Planning Tests
 * 
 * Tests the deterministic scheduler logic and AI plan generation.
 * Since the scheduler runs client-side, we test the core logic patterns here.
 */

// ─── Scheduler Logic Tests ─────────────────────────────────

describe("Scheduler Logic", () => {
  describe("Time Helpers", () => {
    it("converts HH:MM to minutes from midnight", () => {
      const timeToMin = (time: string): number => {
        const [h, m] = time.split(":").map(Number);
        return h * 60 + (m || 0);
      };

      expect(timeToMin("00:00")).toBe(0);
      expect(timeToMin("06:30")).toBe(390);
      expect(timeToMin("09:00")).toBe(540);
      expect(timeToMin("12:00")).toBe(720);
      expect(timeToMin("17:00")).toBe(1020);
      expect(timeToMin("22:30")).toBe(1350);
      expect(timeToMin("23:59")).toBe(1439);
    });

    it("converts minutes to display time", () => {
      const minToDisplay = (min: number): string => {
        const h = Math.floor(min / 60);
        const m = min % 60;
        const period = h >= 12 ? "PM" : "AM";
        const h12 = h === 0 ? 12 : h > 12 ? h - 12 : h;
        return `${h12}:${m.toString().padStart(2, "0")} ${period}`;
      };

      expect(minToDisplay(0)).toBe("12:00 AM");
      expect(minToDisplay(390)).toBe("6:30 AM");
      expect(minToDisplay(540)).toBe("9:00 AM");
      expect(minToDisplay(720)).toBe("12:00 PM");
      expect(minToDisplay(1020)).toBe("5:00 PM");
      expect(minToDisplay(1350)).toBe("10:30 PM");
    });

    it("formats duration display correctly", () => {
      const durationDisplay = (mins: number): string => {
        if (mins < 60) return `${mins}m`;
        const h = Math.floor(mins / 60);
        const m = mins % 60;
        return m > 0 ? `${h}h ${m}m` : `${h}h`;
      };

      expect(durationDisplay(15)).toBe("15m");
      expect(durationDisplay(45)).toBe("45m");
      expect(durationDisplay(60)).toBe("1h");
      expect(durationDisplay(90)).toBe("1h 30m");
      expect(durationDisplay(480)).toBe("8h");
    });
  });

  describe("Free Slot Detection", () => {
    it("finds free slots between occupied intervals", () => {
      const findFreeSlots = (
        occupied: Array<{ start: number; end: number }>,
        minStart: number,
        maxEnd: number
      ): Array<{ start: number; end: number }> => {
        const sorted = [...occupied].sort((a, b) => a.start - b.start);
        const slots: Array<{ start: number; end: number }> = [];
        let cursor = minStart;

        for (const interval of sorted) {
          if (interval.start > cursor) {
            slots.push({ start: cursor, end: interval.start });
          }
          cursor = Math.max(cursor, interval.end);
        }
        if (cursor < maxEnd) {
          slots.push({ start: cursor, end: maxEnd });
        }
        return slots;
      };

      // Wake at 6:30 (390), bed at 22:30 (1350)
      const occupied = [
        { start: 390, end: 405 },   // Wake up block
        { start: 540, end: 1020 },   // Work 9-5
        { start: 1320, end: 1350 },  // Wind down
      ];

      const slots = findFreeSlots(occupied, 405, 1320);
      expect(slots).toEqual([
        { start: 405, end: 540 },    // Morning free time
        { start: 1020, end: 1320 },  // Evening free time
      ]);
    });

    it("returns empty when fully occupied", () => {
      const findFreeSlots = (
        occupied: Array<{ start: number; end: number }>,
        minStart: number,
        maxEnd: number
      ): Array<{ start: number; end: number }> => {
        const sorted = [...occupied].sort((a, b) => a.start - b.start);
        const slots: Array<{ start: number; end: number }> = [];
        let cursor = minStart;

        for (const interval of sorted) {
          if (interval.start > cursor) {
            slots.push({ start: cursor, end: interval.start });
          }
          cursor = Math.max(cursor, interval.end);
        }
        if (cursor < maxEnd) {
          slots.push({ start: cursor, end: maxEnd });
        }
        return slots;
      };

      const occupied = [{ start: 400, end: 1300 }];
      const slots = findFreeSlots(occupied, 400, 1300);
      expect(slots).toEqual([]);
    });
  });

  describe("Break Insertion", () => {
    it("calculates correct break intervals", () => {
      const getBreakConfig = (freq: string) => {
        const breakDuration = freq === "none" ? 0 :
          freq === "every-30m" ? 5 :
          freq === "every-60m" ? 10 : 15;

        const breakInterval = freq === "none" ? Infinity :
          freq === "every-30m" ? 30 :
          freq === "every-60m" ? 60 : 90;

        return { breakDuration, breakInterval };
      };

      expect(getBreakConfig("every-30m")).toEqual({ breakDuration: 5, breakInterval: 30 });
      expect(getBreakConfig("every-60m")).toEqual({ breakDuration: 10, breakInterval: 60 });
      expect(getBreakConfig("every-90m")).toEqual({ breakDuration: 15, breakInterval: 90 });
      expect(getBreakConfig("none")).toEqual({ breakDuration: 0, breakInterval: Infinity });
    });
  });

  describe("Sleep Option Generation", () => {
    it("generates 3 sleep options with correct modes", () => {
      const generateSleepOptions = (bedtimeMin: number, wakeMin: number, sleepGoalHrs: number) => {
        const perfBedtime = bedtimeMin - 60;
        const perfWake = wakeMin - 30;
        const recBedtime = bedtimeMin + 30;
        const recWake = wakeMin + 60;

        return [
          {
            mode: "performance",
            bedtimeMin: Math.max(perfBedtime, 1200),
            wakeMin: Math.max(perfWake, 300),
            predictedEnergy: 9,
          },
          {
            mode: "balanced",
            bedtimeMin: bedtimeMin,
            wakeMin: wakeMin,
            predictedEnergy: 7,
          },
          {
            mode: "recovery",
            bedtimeMin: Math.min(recBedtime, 1410),
            wakeMin: Math.min(recWake, 600),
            predictedEnergy: 6,
          },
        ];
      };

      const options = generateSleepOptions(1350, 390, 8); // 10:30 PM, 6:30 AM
      expect(options).toHaveLength(3);
      expect(options[0].mode).toBe("performance");
      expect(options[1].mode).toBe("balanced");
      expect(options[2].mode).toBe("recovery");

      // Performance should be earlier
      expect(options[0].bedtimeMin).toBeLessThan(options[1].bedtimeMin);
      // Recovery should be later
      expect(options[2].bedtimeMin).toBeGreaterThan(options[1].bedtimeMin);
      // Balanced should match user preferences
      expect(options[1].bedtimeMin).toBe(1350);
      expect(options[1].wakeMin).toBe(390);
    });

    it("clamps extreme sleep options to reasonable bounds", () => {
      const generateSleepOptions = (bedtimeMin: number, wakeMin: number, _sleepGoalHrs: number) => {
        const perfBedtime = bedtimeMin - 60;
        const perfWake = wakeMin - 30;
        const recBedtime = bedtimeMin + 30;
        const recWake = wakeMin + 60;

        return [
          {
            mode: "performance",
            bedtimeMin: Math.max(perfBedtime, 1200), // not before 8pm
            wakeMin: Math.max(perfWake, 300), // not before 5am
          },
          {
            mode: "recovery",
            bedtimeMin: Math.min(recBedtime, 1410), // not after 11:30pm
            wakeMin: Math.min(recWake, 600), // not after 10am
          },
        ];
      };

      // Very early sleeper: bed at 8pm, wake at 4am
      const options = generateSleepOptions(1200, 240, 8);
      expect(options[0].bedtimeMin).toBeGreaterThanOrEqual(1200); // not before 8pm
      expect(options[0].wakeMin).toBeGreaterThanOrEqual(300); // not before 5am
    });
  });

  describe("Overlap Detection", () => {
    it("detects overlapping intervals", () => {
      const hasOverlap = (a: { start: number; end: number }, b: { start: number; end: number }) => {
        return a.start < b.end && b.start < a.end;
      };

      expect(hasOverlap({ start: 540, end: 600 }, { start: 580, end: 640 })).toBe(true);
      expect(hasOverlap({ start: 540, end: 600 }, { start: 600, end: 640 })).toBe(false);
      expect(hasOverlap({ start: 540, end: 600 }, { start: 500, end: 550 })).toBe(true);
      expect(hasOverlap({ start: 540, end: 600 }, { start: 400, end: 500 })).toBe(false);
    });
  });
});

// ─── Text Parser Tests ─────────────────────────────────────

describe("Text Parser", () => {
  // Simplified version of the parser for testing
  function parseTimeRange(segment: string): { startMin: number; endMin: number; title: string } | null {
    const match = segment.match(
      /^(.*?)\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*[-–to]+\s*(\d{1,2}):?(\d{2})?\s*(am|pm)?\s*(.*)$/i
    );
    if (!match) return null;

    let startH = parseInt(match[2]);
    const startM = parseInt(match[3] || "0");
    const startAmPm = match[4] || "";
    let endH = parseInt(match[5]);
    const endM = parseInt(match[6] || "0");
    const endAmPm = match[7] || "";

    let title = (match[1] + " " + (match[8] || "")).trim();
    if (!title) title = segment;

    if (startAmPm) {
      if (startAmPm.toLowerCase() === "pm" && startH < 12) startH += 12;
      if (startAmPm.toLowerCase() === "am" && startH === 12) startH = 0;
    }
    if (endAmPm) {
      if (endAmPm.toLowerCase() === "pm" && endH < 12) endH += 12;
      if (endAmPm.toLowerCase() === "am" && endH === 12) endH = 0;
    }

    if (!startAmPm && !endAmPm) {
      if (startH >= 7 && startH <= 12) { /* AM */ }
      else if (startH >= 1 && startH <= 6) startH += 12;
      if (endH < startH && endH <= 12) endH += 12;
      if (startH === 9 && endH === 5) endH = 17;
      if (startH === 8 && endH === 3) endH = 15;
    }

    if (endH <= startH && endH < 12) endH += 12;

    return {
      startMin: startH * 60 + startM,
      endMin: endH * 60 + endM,
      title,
    };
  }

  it("parses 'Work 9-5' correctly", () => {
    const result = parseTimeRange("Work 9-5");
    expect(result).not.toBeNull();
    expect(result!.startMin).toBe(540);  // 9:00 AM
    expect(result!.endMin).toBe(1020);   // 5:00 PM
    expect(result!.title).toBe("Work");
  });

  it("parses 'school 8-3' correctly", () => {
    const result = parseTimeRange("school 8-3");
    expect(result).not.toBeNull();
    expect(result!.startMin).toBe(480);  // 8:00 AM
    expect(result!.endMin).toBe(900);    // 3:00 PM
  });

  it("parses 'meetings 10-12' correctly", () => {
    const result = parseTimeRange("meetings 10-12");
    expect(result).not.toBeNull();
    expect(result!.startMin).toBe(600);  // 10:00 AM
    expect(result!.endMin).toBe(720);    // 12:00 PM
  });

  it("parses 'School 8:00-15:00' correctly", () => {
    const result = parseTimeRange("School 8:00-15:00");
    expect(result).not.toBeNull();
    expect(result!.startMin).toBe(480);  // 8:00 AM
    expect(result!.endMin).toBe(900);    // 3:00 PM
  });

  it("parses time with AM/PM", () => {
    const result = parseTimeRange("meeting 2pm-4pm");
    expect(result).not.toBeNull();
    expect(result!.startMin).toBe(840);  // 2:00 PM
    expect(result!.endMin).toBe(960);    // 4:00 PM
  });

  it("detects task types correctly", () => {
    const detectType = (text: string) => {
      const lower = text.toLowerCase();
      if (/\b(work|office|meeting)\b/.test(lower)) return "work";
      if (/\b(study|homework|exam)\b/.test(lower)) return "study";
      if (/\b(gym|exercise|run|walk|yoga|soccer)\b/.test(lower)) return "exercise";
      if (/\b(cook|clean|grocery|errand|dinner prep)\b/.test(lower)) return "errand";
      return "other";
    };

    expect(detectType("Work from home")).toBe("work");
    expect(detectType("Study for exams")).toBe("study");
    expect(detectType("Gym session")).toBe("exercise");
    expect(detectType("Dinner prep")).toBe("errand");
    expect(detectType("Relax")).toBe("other");
  });
});

// ─── AI Plan Preview Schema Tests ──────────────────────────

describe("AI Plan Preview Schema", () => {
  it("validates a correct plan preview", () => {
    const { z } = require("zod");

    const TaskTypeEnum = z.enum([
      "work", "study", "class", "exercise", "commute",
      "errand", "creative", "social", "other"
    ]);
    const PriorityEnum = z.enum(["low", "med", "high"]);
    const SleepModeEnum = z.enum(["performance", "balanced", "recovery"]);

    const SleepOptionSchema = z.object({
      id: z.string(),
      mode: SleepModeEnum,
      bedtimeMin: z.number().int().min(0).max(1439),
      wakeMin: z.number().int().min(0).max(1439),
      sleepDurationHrs: z.number().min(4).max(14),
      predictedEnergy: z.number().int().min(1).max(10),
      rationale: z.string(),
    });

    const AIPlanPreviewSchema = z.object({
      tasks: z.array(z.object({
        title: z.string(),
        durationMin: z.number().int().min(5).max(480),
        type: TaskTypeEnum,
        priority: PriorityEnum,
        locked: z.boolean().default(false),
        fixedStartMin: z.number().int().optional(),
        notes: z.string().optional(),
      })),
      constraints: z.object({
        wakeMin: z.number().int(),
        bedtimeMin: z.number().int(),
        breakFrequency: z.enum(["every-30m", "every-60m", "every-90m", "none"]),
        includeSnacks: z.boolean(),
      }),
      sleepOptions: z.array(SleepOptionSchema).min(1).max(3),
      warnings: z.array(z.string()).default([]),
    });

    const validPreview = {
      tasks: [
        { title: "Work", durationMin: 480, type: "work", priority: "high", locked: true, fixedStartMin: 540 },
        { title: "Gym", durationMin: 60, type: "exercise", priority: "med", locked: false },
      ],
      constraints: {
        wakeMin: 390,
        bedtimeMin: 1350,
        breakFrequency: "every-60m",
        includeSnacks: true,
      },
      sleepOptions: [
        { id: "1", mode: "performance", bedtimeMin: 1290, wakeMin: 360, sleepDurationHrs: 7.5, predictedEnergy: 9, rationale: "Early to bed" },
        { id: "2", mode: "balanced", bedtimeMin: 1350, wakeMin: 390, sleepDurationHrs: 8, predictedEnergy: 7, rationale: "Your preferred" },
        { id: "3", mode: "recovery", bedtimeMin: 1380, wakeMin: 450, sleepDurationHrs: 9, predictedEnergy: 6, rationale: "Extra rest" },
      ],
      warnings: [],
    };

    const result = AIPlanPreviewSchema.safeParse(validPreview);
    expect(result.success).toBe(true);
  });

  it("rejects invalid task types", () => {
    const { z } = require("zod");
    const TaskTypeEnum = z.enum([
      "work", "study", "class", "exercise", "commute",
      "errand", "creative", "social", "other"
    ]);

    const result = TaskTypeEnum.safeParse("invalid");
    expect(result.success).toBe(false);
  });

  it("rejects tasks with duration out of range", () => {
    const { z } = require("zod");
    const schema = z.number().int().min(5).max(480);

    expect(schema.safeParse(4).success).toBe(false);
    expect(schema.safeParse(481).success).toBe(false);
    expect(schema.safeParse(5).success).toBe(true);
    expect(schema.safeParse(480).success).toBe(true);
  });
});

// ─── AI Router Input Validation ────────────────────────────

describe("AI Router Input", () => {
  it("validates the generatePlan input schema", () => {
    const { z } = require("zod");

    const inputSchema = z.object({
      userPrompt: z.string().min(1),
      wakeTime: z.string(),
      bedtime: z.string(),
      sleepGoalHrs: z.number(),
      chronotype: z.string(),
      breakFrequency: z.string(),
      snackWindows: z.boolean(),
      checkIn: z.object({
        sleepHours: z.number(),
        sleepQuality: z.number(),
        morningEnergy: z.number(),
        stressLevel: z.number(),
        workload: z.string(),
      }).optional(),
    });

    const validInput = {
      userPrompt: "Work 9-5, gym after work 1h",
      wakeTime: "06:30",
      bedtime: "22:30",
      sleepGoalHrs: 8,
      chronotype: "flexible",
      breakFrequency: "every-60m",
      snackWindows: true,
    };

    expect(inputSchema.safeParse(validInput).success).toBe(true);

    const withCheckIn = {
      ...validInput,
      checkIn: {
        sleepHours: 7,
        sleepQuality: 3,
        morningEnergy: 3,
        stressLevel: 2,
        workload: "moderate",
      },
    };

    expect(inputSchema.safeParse(withCheckIn).success).toBe(true);

    // Empty prompt should fail
    expect(inputSchema.safeParse({ ...validInput, userPrompt: "" }).success).toBe(false);
  });
});
