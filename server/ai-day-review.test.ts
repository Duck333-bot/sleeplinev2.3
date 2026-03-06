/**
 * AI Day Review Tests
 */

import { describe, it, expect } from "vitest";
import { DayReviewSchema, getMoodEmoji, getMoodColor } from "./ai-day-review";

describe("AI Day Review", () => {
  describe("DayReviewSchema", () => {
    it("should validate a correct review", () => {
      const review = {
        productivityObservation: "You completed 5 out of 7 tasks today, showing good focus during morning hours.",
        tomorrowSuggestion: "Try scheduling deep work before 10am when your energy is highest.",
        sleepInsight: "You maintained your 8-hour sleep goal, which likely contributed to your productivity.",
        overallMood: "good" as const,
      };

      const result = DayReviewSchema.safeParse(review);
      expect(result.success).toBe(true);
    });

    it("should accept all mood types", () => {
      const moods = ["great", "good", "neutral", "challenging"] as const;

      moods.forEach(mood => {
        const review = {
          productivityObservation: "Test observation",
          tomorrowSuggestion: "Test suggestion",
          sleepInsight: "Test insight",
          overallMood: mood,
        };

        const result = DayReviewSchema.safeParse(review);
        expect(result.success).toBe(true);
      });
    });

    it("should reject missing fields", () => {
      const review = {
        productivityObservation: "Test",
        tomorrowSuggestion: "Test",
        // Missing sleepInsight
        overallMood: "good" as const,
      };

      const result = DayReviewSchema.safeParse(review);
      expect(result.success).toBe(false);
    });

    it("should reject text that's too short", () => {
      const review = {
        productivityObservation: "Too short",
        tomorrowSuggestion: "Test suggestion that is long enough",
        sleepInsight: "Test insight that is long enough",
        overallMood: "good" as const,
      };

      const result = DayReviewSchema.safeParse(review);
      expect(result.success).toBe(false);
    });

    it("should reject text that's too long", () => {
      const longText = "a".repeat(250);
      const review = {
        productivityObservation: longText,
        tomorrowSuggestion: "Test suggestion",
        sleepInsight: "Test insight",
        overallMood: "good" as const,
      };

      const result = DayReviewSchema.safeParse(review);
      expect(result.success).toBe(false);
    });
  });

  describe("getMoodEmoji", () => {
    it("should return correct emoji for each mood", () => {
      expect(getMoodEmoji("great")).toBe("🌟");
      expect(getMoodEmoji("good")).toBe("😊");
      expect(getMoodEmoji("neutral")).toBe("😐");
      expect(getMoodEmoji("challenging")).toBe("💪");
    });
  });

  describe("getMoodColor", () => {
    it("should return correct color class for each mood", () => {
      expect(getMoodColor("great")).toContain("mint");
      expect(getMoodColor("good")).toContain("cyan");
      expect(getMoodColor("neutral")).toContain("muted");
      expect(getMoodColor("challenging")).toContain("amber");
    });
  });

  describe("Review content validation", () => {
    it("should accept realistic productivity observation", () => {
      const review = {
        productivityObservation: "You completed 5 out of 7 tasks today, showing strong focus during morning hours.",
        tomorrowSuggestion: "Try scheduling deep work before 10am when your energy is highest.",
        sleepInsight: "You maintained your 8-hour sleep goal, which likely contributed to your productivity.",
        overallMood: "good" as const,
      };

      const result = DayReviewSchema.safeParse(review);
      expect(result.success).toBe(true);
    });

    it("should accept realistic tomorrow suggestion", () => {
      const review = {
        productivityObservation: "You had a productive day with good task completion.",
        tomorrowSuggestion: "Consider adding a 15-minute break after focused work sessions to maintain energy.",
        sleepInsight: "Your sleep timing aligns well with your natural rhythm.",
        overallMood: "good" as const,
      };

      const result = DayReviewSchema.safeParse(review);
      expect(result.success).toBe(true);
    });

    it("should accept realistic sleep insight", () => {
      const review = {
        productivityObservation: "You managed your time well today.",
        tomorrowSuggestion: "Try this schedule tomorrow.",
        sleepInsight: "Bedtime at 11pm with 7.5 hours sleep is slightly below your goal, consider earlier bedtime.",
        overallMood: "neutral" as const,
      };

      const result = DayReviewSchema.safeParse(review);
      expect(result.success).toBe(true);
    });
  });
});
