/**
 * Sleepline — Energy Zones Tests
 */

import { describe, it, expect } from "vitest";
import {
  getEnergyZones,
  getEnergyLevelAtTime,
  getEnergyColor,
  formatTime,
  getZoneDuration,
  getEnergyRecommendation,
  type EnergyZone,
} from "./lib/energy-zones";

describe("Energy Zones Calculation", () => {
  it("should generate 6 zones for a typical wake time", () => {
    const zones = getEnergyZones(420); // 7:00 AM
    expect(zones.length).toBe(6);
  });

  it("should have correct zone order", () => {
    const zones = getEnergyZones(420);
    const levels = zones.map(z => z.level);
    expect(levels).toEqual(["highFocus", "peakFocus", "dip", "recovery", "windDown", "sleep"]);
  });

  it("should calculate correct zone durations", () => {
    const zones = getEnergyZones(420);
    expect(getZoneDuration(zones[0])).toBe(180); // High Focus: 3 hours
    expect(getZoneDuration(zones[1])).toBe(180); // Peak Focus: 3 hours
    expect(getZoneDuration(zones[2])).toBe(120); // Dip: 2 hours
    expect(getZoneDuration(zones[3])).toBe(180); // Recovery: 3 hours
    expect(getZoneDuration(zones[4])).toBe(180); // Wind Down: 3 hours
  });

  it("should handle early wake time (5:00 AM)", () => {
    const zones = getEnergyZones(300);
    expect(zones[0].start).toBe(300);
    expect(zones[0].level).toBe("highFocus");
  });

  it("should handle late wake time (10:00 AM)", () => {
    const zones = getEnergyZones(600);
    expect(zones[0].start).toBe(600);
    expect(zones[0].level).toBe("highFocus");
  });

  it("should clamp zones to 1440 minutes (midnight)", () => {
    const zones = getEnergyZones(1200); // 8:00 PM wake time
    zones.forEach(zone => {
      expect(zone.end).toBeLessThanOrEqual(1440);
      expect(zone.start).toBeLessThanOrEqual(1440);
    });
  });

  it("should have correct labels for each zone", () => {
    const zones = getEnergyZones(420);
    expect(zones[0].label).toBe("High Focus");
    expect(zones[1].label).toBe("Peak Focus");
    expect(zones[2].label).toBe("Afternoon Dip");
    expect(zones[3].label).toBe("Focus Recovery");
    expect(zones[4].label).toBe("Wind Down");
    expect(zones[5].label).toBe("Sleep");
  });

  it("should have descriptions for each zone", () => {
    const zones = getEnergyZones(420);
    zones.forEach(zone => {
      expect(zone.description).toBeTruthy();
      expect(zone.description.length).toBeGreaterThan(0);
    });
  });

  it("should have color classes for each zone", () => {
    const zones = getEnergyZones(420);
    zones.forEach(zone => {
      expect(zone.color).toBeTruthy();
      expect(zone.bgColor).toBeTruthy();
      expect(zone.color).toMatch(/text-/);
      expect(zone.bgColor).toMatch(/bg-/);
    });
  });
});

describe("Energy Level at Specific Time", () => {
  it("should return high focus zone at wake time", () => {
    const zone = getEnergyLevelAtTime(420, 420); // 7:00 AM
    expect(zone?.level).toBe("highFocus");
  });

  it("should return peak focus zone 4 hours after wake", () => {
    const zone = getEnergyLevelAtTime(660, 420); // 11:00 AM (4 hours after 7 AM)
    expect(zone?.level).toBe("peakFocus");
  });

  it("should return afternoon dip zone 7 hours after wake", () => {
    const zone = getEnergyLevelAtTime(900, 420); // 3:00 PM (7 hours after 7 AM)
    expect(zone?.level).toBe("recovery");
  });

  it("should return recovery zone 9 hours after wake", () => {
    const zone = getEnergyLevelAtTime(1020, 420); // 5:00 PM (9 hours after 7 AM)
    expect(zone?.level).toBe("recovery");
  });

  it("should return wind down zone 12 hours after wake", () => {
    const zone = getEnergyLevelAtTime(1140, 420); // 7:00 PM (12 hours after 7 AM)
    expect(zone?.level).toBe("windDown");
  });

  it("should return null for invalid time", () => {
    const zone = getEnergyLevelAtTime(-100, 420);
    expect(zone).toBeNull();
  });

  it("should handle time at zone boundary", () => {
    const zone = getEnergyLevelAtTime(600, 420); // Exactly 3 hours after wake
    expect(zone).toBeTruthy();
    expect(zone?.level).toBe("peakFocus"); // Should be in peak focus (3-6h)
  });
});

describe("Energy Colors", () => {
  it("should return correct colors for high focus", () => {
    const colors = getEnergyColor("highFocus");
    expect(colors.text).toBe("text-emerald-400");
    expect(colors.bg).toBe("bg-emerald-500/10");
  });

  it("should return correct colors for peak focus", () => {
    const colors = getEnergyColor("peakFocus");
    expect(colors.text).toBe("text-emerald-300");
    expect(colors.bg).toBe("bg-emerald-400/15");
  });

  it("should return correct colors for dip", () => {
    const colors = getEnergyColor("dip");
    expect(colors.text).toBe("text-amber-400");
    expect(colors.bg).toBe("bg-amber-500/10");
  });

  it("should return correct colors for recovery", () => {
    const colors = getEnergyColor("recovery");
    expect(colors.text).toBe("text-emerald-400");
    expect(colors.bg).toBe("bg-emerald-500/10");
  });

  it("should return correct colors for wind down", () => {
    const colors = getEnergyColor("windDown");
    expect(colors.text).toBe("text-blue-400");
    expect(colors.bg).toBe("bg-blue-500/10");
  });

  it("should return correct colors for sleep", () => {
    const colors = getEnergyColor("sleep");
    expect(colors.text).toBe("text-indigo-600");
    expect(colors.bg).toBe("bg-indigo-900/20");
  });
});

describe("Time Formatting", () => {
  it("should format 420 minutes as 7:00 AM", () => {
    expect(formatTime(420)).toBe("7:00 AM");
  });

  it("should format 600 minutes as 10:00 AM", () => {
    expect(formatTime(600)).toBe("10:00 AM");
  });

  it("should format 720 minutes as 12:00 PM", () => {
    expect(formatTime(720)).toBe("12:00 PM");
  });

  it("should format 900 minutes as 3:00 PM", () => {
    expect(formatTime(900)).toBe("3:00 PM");
  });

  it("should format 1380 minutes as 11:00 PM", () => {
    expect(formatTime(1380)).toBe("11:00 PM");
  });

  it("should format 0 minutes as 12:00 AM", () => {
    expect(formatTime(0)).toBe("12:00 AM");
  });

  it("should format minutes with leading zero", () => {
    expect(formatTime(425)).toBe("7:05 AM");
  });
});

describe("Energy Recommendations", () => {
  it("should provide recommendation for high focus", () => {
    const rec = getEnergyRecommendation("highFocus");
    expect(rec).toContain("important tasks");
  });

  it("should provide recommendation for peak focus", () => {
    const rec = getEnergyRecommendation("peakFocus");
    expect(rec).toContain("critical work");
  });

  it("should provide recommendation for dip", () => {
    const rec = getEnergyRecommendation("dip");
    expect(rec).toContain("break");
  });

  it("should provide recommendation for recovery", () => {
    const rec = getEnergyRecommendation("recovery");
    expect(rec).toContain("focused work");
  });

  it("should provide recommendation for wind down", () => {
    const rec = getEnergyRecommendation("windDown");
    expect(rec).toContain("Light tasks");
  });

  it("should provide recommendation for sleep", () => {
    const rec = getEnergyRecommendation("sleep");
    expect(rec).toContain("Rest");
  });
});

describe("Edge Cases", () => {
  it("should handle very early wake time (4:00 AM)", () => {
    const zones = getEnergyZones(240);
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0].start).toBe(240);
  });

  it("should handle very late wake time (11:00 PM)", () => {
    const zones = getEnergyZones(1380);
    expect(zones.length).toBeGreaterThan(0);
  });

  it("should handle custom sleep time", () => {
    const zones = getEnergyZones(420, 1200); // Wake 7 AM, sleep 8 PM
    const sleepZone = zones.find(z => z.level === "sleep");
    expect(zones.length).toBeGreaterThan(0);
    expect(zones[0].start).toBe(420);
  });

  it("should handle overnight sleep (sleep before wake)", () => {
    const zones = getEnergyZones(420, 1380); // Wake 7 AM, sleep 11 PM
    const sleepZone = zones.find(z => z.level === "sleep");
    expect(sleepZone).toBeTruthy();
  });

  it("should not have overlapping zones", () => {
    const zones = getEnergyZones(420);
    for (let i = 0; i < zones.length - 1; i++) {
      expect(zones[i].end).toBeLessThanOrEqual(zones[i + 1].start);
    }
  });

  it("should have zones in chronological order", () => {
    const zones = getEnergyZones(420);
    for (let i = 1; i < zones.length; i++) {
      expect(zones[i].start).toBeGreaterThanOrEqual(zones[i - 1].start);
    }
  });

  it("should handle invalid wake time gracefully", () => {
    const zones = getEnergyZones(-100);
    expect(zones.length).toBe(0);

    const zones2 = getEnergyZones(1500);
    expect(zones2.length).toBe(0);
  });
});

describe("Zone Duration Calculation", () => {
  it("should calculate correct duration for high focus zone", () => {
    const zones = getEnergyZones(420);
    const highFocus = zones.find(z => z.level === "highFocus");
    expect(getZoneDuration(highFocus!)).toBe(180);
  });

  it("should calculate correct duration for peak focus zone", () => {
    const zones = getEnergyZones(420);
    const peakFocus = zones.find(z => z.level === "peakFocus");
    expect(getZoneDuration(peakFocus!)).toBe(180);
  });

  it("should calculate correct duration for afternoon dip", () => {
    const zones = getEnergyZones(420);
    const dip = zones.find(z => z.level === "dip");
    expect(getZoneDuration(dip!)).toBe(120);
  });

  it("should return positive duration for all zones", () => {
    const zones = getEnergyZones(420);
    zones.forEach(zone => {
      expect(getZoneDuration(zone)).toBeGreaterThan(0);
    });
  });
});
