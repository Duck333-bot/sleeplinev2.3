/**
 * Sleepline — Energy Zones
 * 
 * Calculates daily energy patterns based on wake time using sleep science.
 * Helps users align high-focus tasks with peak energy periods.
 */

export type EnergyLevel = "highFocus" | "peakFocus" | "dip" | "recovery" | "windDown" | "sleep";

export interface EnergyZone {
  start: number;        // minutes since midnight
  end: number;          // minutes since midnight
  level: EnergyLevel;
  label: string;
  description: string;
  color: string;        // Tailwind color class
  bgColor: string;      // Background color for timeline
}

/**
 * Get energy zones for a given wake time
 * Based on circadian rhythm and sleep science
 * 
 * @param wakeTimeMin - Wake time in minutes since midnight (e.g., 420 = 7:00 AM)
 * @param sleepTimeMin - Sleep time in minutes since midnight (e.g., 1380 = 11:00 PM)
 * @returns Array of energy zones for the day
 */
export function getEnergyZones(
  wakeTimeMin: number,
  sleepTimeMin: number = 1380 // Default 11 PM
): EnergyZone[] {
  const zones: EnergyZone[] = [];

  // Validate inputs
  if (wakeTimeMin < 0 || wakeTimeMin >= 1440) {
    return [];
  }

  // Calculate zone boundaries relative to wake time
  const zone1Start = wakeTimeMin;
  const zone1End = Math.min(wakeTimeMin + 180, 1440); // +0–3h: High Focus (morning alertness)

  const zone2Start = zone1End;
  const zone2End = Math.min(wakeTimeMin + 360, 1440); // +3–6h: Peak Focus (optimal performance)

  const zone3Start = zone2End;
  const zone3End = Math.min(wakeTimeMin + 480, 1440); // +6–8h: Early Afternoon Dip (post-lunch slump)

  const zone4Start = zone3End;
  const zone4End = Math.min(wakeTimeMin + 660, 1440); // +8–11h: Focus Recovery (second wind)

  const zone5Start = zone4End;
  const zone5End = Math.min(wakeTimeMin + 840, 1440); // +11–14h: Wind Down (preparing for sleep)

  // High Focus Zone (0–3 hours after wake)
  if (zone1Start < zone1End) {
    zones.push({
      start: zone1Start,
      end: zone1End,
      level: "highFocus",
      label: "High Focus",
      description: "Morning alertness - good for important tasks",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    });
  }

  // Peak Focus Zone (3–6 hours after wake)
  if (zone2Start < zone2End) {
    zones.push({
      start: zone2Start,
      end: zone2End,
      level: "peakFocus",
      label: "Peak Focus",
      description: "Optimal cognitive performance - schedule critical work",
      color: "text-emerald-300",
      bgColor: "bg-emerald-400/15",
    });
  }

  // Early Afternoon Dip (6–8 hours after wake)
  if (zone3Start < zone3End) {
    zones.push({
      start: zone3Start,
      end: zone3End,
      level: "dip",
      label: "Afternoon Dip",
      description: "Energy dip - good for breaks, meals, or routine tasks",
      color: "text-amber-400",
      bgColor: "bg-amber-500/10",
    });
  }

  // Focus Recovery (8–11 hours after wake)
  if (zone4Start < zone4End) {
    zones.push({
      start: zone4Start,
      end: zone4End,
      level: "recovery",
      label: "Focus Recovery",
      description: "Second wind - moderate focus tasks",
      color: "text-emerald-400",
      bgColor: "bg-emerald-500/10",
    });
  }

  // Wind Down (11–14 hours after wake)
  if (zone5Start < zone5End) {
    zones.push({
      start: zone5Start,
      end: zone5End,
      level: "windDown",
      label: "Wind Down",
      description: "Winding down - light tasks, preparation for sleep",
      color: "text-blue-400",
      bgColor: "bg-blue-500/10",
    });
  }

  // Sleep Zone (from sleep time to next wake time)
  // Handle overnight sleep (e.g., 11 PM to 7 AM)
  if (sleepTimeMin < wakeTimeMin) {
    // Sleep wraps around midnight
    zones.push({
      start: sleepTimeMin,
      end: 1440,
      level: "sleep",
      label: "Sleep",
      description: "Rest period",
      color: "text-indigo-600",
      bgColor: "bg-indigo-900/20",
    });
  } else if (sleepTimeMin > zone5End) {
    // Sleep is after wind-down period
    zones.push({
      start: zone5End,
      end: sleepTimeMin,
      level: "sleep",
      label: "Sleep",
      description: "Rest period",
      color: "text-indigo-600",
      bgColor: "bg-indigo-900/20",
    });
  }

  return zones;
}

/**
 * Get the energy level at a specific time
 */
export function getEnergyLevelAtTime(
  timeMin: number,
  wakeTimeMin: number,
  sleepTimeMin: number = 1380
): EnergyZone | null {
  const zones = getEnergyZones(wakeTimeMin, sleepTimeMin);
  return zones.find(z => timeMin >= z.start && timeMin < z.end) || null;
}

/**
 * Get energy zone color for a specific level
 */
export function getEnergyColor(level: EnergyLevel): { text: string; bg: string } {
  const colors: Record<EnergyLevel, { text: string; bg: string }> = {
    highFocus: { text: "text-emerald-400", bg: "bg-emerald-500/10" },
    peakFocus: { text: "text-emerald-300", bg: "bg-emerald-400/15" },
    dip: { text: "text-amber-400", bg: "bg-amber-500/10" },
    recovery: { text: "text-emerald-400", bg: "bg-emerald-500/10" },
    windDown: { text: "text-blue-400", bg: "bg-blue-500/10" },
    sleep: { text: "text-indigo-600", bg: "bg-indigo-900/20" },
  };
  return colors[level];
}

/**
 * Format time for display (e.g., "7:00 AM")
 */
export function formatTime(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Calculate zone duration in minutes
 */
export function getZoneDuration(zone: EnergyZone): number {
  return zone.end - zone.start;
}

/**
 * Get recommendation for task scheduling based on energy level
 */
export function getEnergyRecommendation(level: EnergyLevel): string {
  const recommendations: Record<EnergyLevel, string> = {
    highFocus: "Schedule important tasks requiring focus",
    peakFocus: "Schedule critical work and complex problem-solving",
    dip: "Take a break, eat lunch, or do routine tasks",
    recovery: "Resume focused work or tackle moderate tasks",
    windDown: "Light tasks, admin work, or preparation for sleep",
    sleep: "Rest and recovery",
  };
  return recommendations[level];
}
