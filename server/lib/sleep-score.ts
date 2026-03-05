/**
 * Sleepline — Sleep Score Calculator
 * 
 * Evaluates daily sleep quality based on planned vs actual sleep times.
 * Scoring algorithm:
 * - Start at 100 points
 * - Deduct points for sleep duration, timing deviations, and sleep quality
 * - Clamp final score between 0–100
 * 
 * Input: planned bedtime, planned wake time, actual bedtime, actual wake time
 * Output: score (0–100) + feedback messages
 */

export interface SleepScoreInput {
  plannedBedtimeMin: number; // minutes since midnight (0-1439)
  plannedWakeMin: number; // minutes since midnight (0-1439)
  actualBedtimeMin: number; // minutes since midnight (0-1439)
  actualWakeMin: number; // minutes since midnight (0-1439)
  sleepQuality?: number; // 1-5 scale (optional, from check-in)
}

export interface SleepScoreResult {
  score: number; // 0-100
  feedback: string[]; // 1-2 feedback messages
  issues: {
    shortSleep: boolean;
    lateBedtime: boolean;
    lateWakeTime: boolean;
    poorQuality: boolean;
  };
}

/**
 * Calculate actual sleep duration in minutes, handling day boundary.
 * If wake time < bedtime, assumes sleep crosses midnight.
 */
function calculateSleepDuration(bedtimeMin: number, wakeMin: number): number {
  if (wakeMin > bedtimeMin) {
    return wakeMin - bedtimeMin;
  } else {
    // Sleep crosses midnight
    return 1440 - bedtimeMin + wakeMin;
  }
}

/**
 * Calculate time deviation in minutes (absolute value).
 * Handles day boundary: if times are on different days, use modulo arithmetic.
 */
function calculateDeviation(plannedMin: number, actualMin: number): number {
  const diff = Math.abs(actualMin - plannedMin);
  // If difference is > 12 hours, likely crossed midnight boundary
  if (diff > 720) {
    return 1440 - diff;
  }
  return diff;
}

/**
 * Generate feedback messages based on score and issues.
 */
function generateFeedback(score: number, issues: SleepScoreResult["issues"], sleepQuality?: number): string[] {
  const feedback: string[] = [];

  // Primary message based on score
  if (score >= 85) {
    feedback.push("Excellent sleep! You're maintaining a healthy sleep schedule. Keep it up!");
  } else if (score >= 70) {
    feedback.push("Good sleep quality. Your schedule is mostly on track.");
  } else if (score >= 50) {
    feedback.push("Fair sleep. There's room for improvement in your sleep routine.");
  } else {
    feedback.push("Poor sleep quality. Let's work on improving your sleep schedule.");
  }

  // Secondary message based on specific issues
  if (issues.shortSleep) {
    feedback.push("Your sleep duration was less than 7 hours. Try to get more rest tonight.");
  } else if (issues.lateBedtime) {
    feedback.push("You went to bed later than planned. Consider an earlier wind-down routine.");
  } else if (issues.lateWakeTime) {
    feedback.push("You woke up later than planned. Try setting an alarm for your target wake time.");
  } else if (issues.poorQuality && sleepQuality && sleepQuality <= 2) {
    feedback.push("Your sleep quality was low. Check for sleep disruptions or environmental factors.");
  } else if (score >= 85) {
    // Positive reinforcement if no issues
    feedback.push("Your sleep consistency is excellent. This routine is working well for you.");
  }

  return feedback;
}

/**
 * Calculate daily sleep score (0-100) based on planned vs actual sleep times.
 * 
 * Scoring breakdown:
 * - Start: 100 points
 * - Sleep duration < 7 hours: -25 points
 * - Bedtime > 30 min late: -15 points
 * - Wake time > 30 min late: -10 points
 * - Sleep quality (if provided) 1-2: -10 points
 * - Final: clamp to [0, 100]
 */
export function calculateSleepScore(input: SleepScoreInput): SleepScoreResult {
  let score = 100;
  const issues = {
    shortSleep: false,
    lateBedtime: false,
    lateWakeTime: false,
    poorQuality: false,
  };

  // Calculate actual sleep duration
  const actualDurationMin = calculateSleepDuration(input.actualBedtimeMin, input.actualWakeMin);
  const actualDurationHrs = actualDurationMin / 60;

  // Penalty 1: Sleep duration < 7 hours
  if (actualDurationHrs < 7) {
    score -= 25;
    issues.shortSleep = true;
  }

  // Penalty 2: Bedtime > 30 minutes later than planned
  const bedtimeDeviation = calculateDeviation(input.plannedBedtimeMin, input.actualBedtimeMin);
  if (bedtimeDeviation > 30) {
    score -= 15;
    issues.lateBedtime = true;
  }

  // Penalty 3: Wake time > 30 minutes later than planned
  const wakeTimeDeviation = calculateDeviation(input.plannedWakeMin, input.actualWakeMin);
  if (wakeTimeDeviation > 30) {
    score -= 10;
    issues.lateWakeTime = true;
  }

  // Penalty 4: Poor sleep quality (if provided)
  if (input.sleepQuality && input.sleepQuality <= 2) {
    score -= 10;
    issues.poorQuality = true;
  }

  // Clamp score between 0 and 100
  score = Math.max(0, Math.min(100, score));

  // Generate feedback
  const feedback = generateFeedback(score, issues, input.sleepQuality);

  return {
    score,
    feedback,
    issues,
  };
}

/**
 * Format sleep duration for display (e.g., "7h 30m", "6h")
 */
export function formatSleepDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  if (mins === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${mins}m`;
}

/**
 * Format time in minutes since midnight to HH:MM AM/PM
 */
export function formatTimeDisplay(min: number): string {
  const hours = Math.floor(min / 60);
  const mins = min % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const h12 = hours === 0 ? 12 : hours > 12 ? hours - 12 : hours;
  return `${h12}:${mins.toString().padStart(2, "0")} ${period}`;
}
