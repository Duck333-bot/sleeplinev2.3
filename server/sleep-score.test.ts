/**
 * Sleepline — Sleep Score Tests
 * 
 * Comprehensive test suite for sleep score calculation and feedback generation.
 */

import { describe, it, expect } from "vitest";
import { calculateSleepScore, formatSleepDuration, formatTimeDisplay } from "./lib/sleep-score";

describe("Sleep Score Calculation", () => {
  it("should give perfect score (100) for ideal sleep", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 22 * 60 + 30,
      actualWakeMin: 6 * 60 + 30,
    });

    expect(result.score).toBe(100);
    expect(result.issues.shortSleep).toBe(false);
    expect(result.issues.lateBedtime).toBe(false);
    expect(result.issues.lateWakeTime).toBe(false);
  });

  it("should deduct 25 points for sleep duration < 7 hours", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 23 * 60,
      plannedWakeMin: 6 * 60,
      actualBedtimeMin: 23 * 60,
      actualWakeMin: 5 * 60,
    });

    expect(result.score).toBe(65);
    expect(result.issues.shortSleep).toBe(true);
  });

  it("should deduct 15 points for bedtime > 30 minutes late", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 23 * 60 + 5,
      actualWakeMin: 6 * 60 + 30,
    });

    expect(result.score).toBe(85);
    expect(result.issues.lateBedtime).toBe(true);
  });

  it("should deduct 10 points for wake time > 30 minutes late", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 22 * 60 + 30,
      actualWakeMin: 7 * 60 + 10,
    });

    expect(result.score).toBe(90);
    expect(result.issues.lateWakeTime).toBe(true);
  });

  it("should deduct 10 points for poor sleep quality (1-2 rating)", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 22 * 60 + 30,
      actualWakeMin: 6 * 60 + 30,
      sleepQuality: 1,
    });

    expect(result.score).toBe(90);
    expect(result.issues.poorQuality).toBe(true);
  });

  it("should stack penalties for multiple issues", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 23 * 60 + 15,
      actualWakeMin: 7 * 60,
      sleepQuality: 2,
    });

    expect(result.score).toBe(75);
    expect(result.issues.lateBedtime).toBe(true);
    expect(result.issues.lateWakeTime).toBe(false);
  });

  it("should clamp score to minimum 0", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 2 * 60,
      actualWakeMin: 12 * 60,
      sleepQuality: 1,
    });

    expect(result.score).toBeGreaterThanOrEqual(0);
    expect(result.score).toBeLessThanOrEqual(100);
  });

  it("should correctly handle sleep crossing midnight", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 23 * 60,
      plannedWakeMin: 7 * 60,
      actualBedtimeMin: 23 * 60,
      actualWakeMin: 7 * 60,
    });

    expect(result.score).toBe(100);
    expect(result.issues.shortSleep).toBe(false);
  });

  it("should not penalize sleep duration of exactly 7 hours", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 23 * 60,
      plannedWakeMin: 6 * 60,
      actualBedtimeMin: 23 * 60,
      actualWakeMin: 6 * 60,
    });

    expect(result.score).toBe(100);
    expect(result.issues.shortSleep).toBe(false);
  });

  it("should not penalize bedtime deviation of exactly 30 minutes", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 23 * 60,
      actualWakeMin: 6 * 60 + 30,
    });

    expect(result.score).toBe(100);
    expect(result.issues.lateBedtime).toBe(false);
  });

  it("should penalize bedtime deviation of 31 minutes", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 23 * 60 + 1,
      actualWakeMin: 6 * 60 + 30,
    });

    expect(result.score).toBe(85);
    expect(result.issues.lateBedtime).toBe(true);
  });

  it("should generate appropriate feedback for excellent sleep", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 22 * 60 + 30,
      actualWakeMin: 6 * 60 + 30,
    });

    expect(result.feedback.length).toBeGreaterThanOrEqual(1);
    expect(result.feedback[0]).toContain("Excellent");
  });

  it("should generate appropriate feedback for fair sleep", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 2 * 60,
      actualWakeMin: 12 * 60,
      sleepQuality: 1,
    });

    expect(result.feedback.length).toBeGreaterThanOrEqual(1);
    expect(result.feedback[0].toLowerCase()).toContain("fair");
  });

  it("should categorize score as excellent (85+)", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 22 * 60 + 30,
      actualWakeMin: 6 * 60 + 30,
    });

    expect(result.score).toBeGreaterThanOrEqual(85);
    expect(result.feedback[0]).toContain("Excellent");
  });

  it("should categorize score as good (70-84)", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 23 * 60 + 15,
      actualWakeMin: 7 * 60 + 5,
    });

    expect(result.score).toBe(75);
    expect(result.feedback[0]).toContain("Good");
  });

  it("should categorize score as fair (50-69)", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 1 * 60,
      actualWakeMin: 3 * 60,
      sleepQuality: 1,
    });

    expect(result.score).toBe(40);
    expect(result.feedback[0]).toContain("Poor");
  });

  it("should categorize score as poor (<50)", () => {
    const result = calculateSleepScore({
      plannedBedtimeMin: 22 * 60 + 30,
      plannedWakeMin: 6 * 60 + 30,
      actualBedtimeMin: 3 * 60,
      actualWakeMin: 7 * 60 + 45,
      sleepQuality: 1,
    });

    expect(result.score).toBe(40);
    expect(result.feedback[0]).toContain("Poor");
  });
});

describe("Sleep Duration Formatting", () => {
  it("should format sleep duration in hours only", () => {
    expect(formatSleepDuration(480)).toBe("8h");
    expect(formatSleepDuration(360)).toBe("6h");
  });

  it("should format sleep duration with hours and minutes", () => {
    expect(formatSleepDuration(510)).toBe("8h 30m");
    expect(formatSleepDuration(390)).toBe("6h 30m");
    expect(formatSleepDuration(425)).toBe("7h 5m");
  });

  it("should format sleep duration in minutes only", () => {
    expect(formatSleepDuration(45)).toBe("0h 45m");
    expect(formatSleepDuration(30)).toBe("0h 30m");
  });
});

describe("Time Display Formatting", () => {
  it("should format morning times correctly", () => {
    expect(formatTimeDisplay(0)).toBe("12:00 AM");
    expect(formatTimeDisplay(60)).toBe("1:00 AM");
    expect(formatTimeDisplay(390)).toBe("6:30 AM");
  });

  it("should format afternoon times correctly", () => {
    expect(formatTimeDisplay(720)).toBe("12:00 PM");
    expect(formatTimeDisplay(780)).toBe("1:00 PM");
    expect(formatTimeDisplay(1350)).toBe("10:30 PM");
  });

  it("should format evening times correctly", () => {
    expect(formatTimeDisplay(1320)).toBe("10:00 PM");
    expect(formatTimeDisplay(1380)).toBe("11:00 PM");
  });
});
