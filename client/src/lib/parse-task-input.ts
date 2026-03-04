/**
 * Sleepline — Natural Language Task Parser
 * Converts human-readable task descriptions into structured task objects
 * 
 * Examples:
 * "Math homework at 7pm" → { title: "Math homework", start: 1140, end: 1185 }
 * "Gym 18:00" → { title: "Gym", start: 1080, end: 1125 }
 * "Study for 30 minutes at 9pm" → { title: "Study", start: 1260, end: 1290 }
 * "Read before dinner" → { title: "Read", start: null, end: null } (no time)
 */

export interface ParsedTaskInput {
  title: string;
  start: number | null; // minutes since midnight, or null if no time specified
  end: number | null;
  duration: number | null; // extracted duration in minutes, or null
}

/**
 * Convert 12-hour time to 24-hour format
 * "7pm" → 19, "3:30am" → 3.5, "12:00" → 12
 */
function parse12HourTime(timeStr: string): number | null {
  const match = timeStr.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)?$/i);
  if (!match) return null;

  let hours = parseInt(match[1], 10);
  const minutes = match[2] ? parseInt(match[2], 10) : 0;
  const period = match[3]?.toLowerCase();

  // Handle 12-hour format
  if (period === "pm" && hours !== 12) {
    hours += 12;
  } else if (period === "am" && hours === 12) {
    hours = 0;
  }

  // Validate
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) {
    return null;
  }

  return hours * 60 + minutes;
}

/**
 * Convert 24-hour time to minutes since midnight
 * "18:00" → 1080, "23:59" → 1439, "0:00" → 0
 */
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

/**
 * Extract time from various formats
 * Supports: "7pm", "19:00", "3:30am", "12:00", etc.
 */
function extractTime(timeStr: string): number | null {
  if (!timeStr) return null;

  // Try 24-hour format first (e.g., "18:00")
  let result = parse24HourTime(timeStr);
  if (result !== null) return result;

  // Try 12-hour format (e.g., "7pm", "3:30am")
  result = parse12HourTime(timeStr);
  if (result !== null) return result;

  return null;
}

/**
 * Extract duration from text (e.g., "30 minutes", "45 mins", "1 hour")
 * Returns duration in minutes, or null if not found
 */
function extractDuration(text: string): number | null {
  // Match patterns like "30 minutes", "45 mins", "1 hour", "2 hours"
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

/**
 * Main parser function
 * Converts natural language input into structured task object
 */
export function parseTaskInput(input: string): ParsedTaskInput {
  if (!input || typeof input !== "string") {
    return { title: input || "", start: null, end: null, duration: null };
  }

  const trimmed = input.trim();
  let title = trimmed;
  let startTime: number | null = null;
  let duration: number | null = null;

  // Pattern 1: "task at 7pm for 45 minutes"
  // Pattern 2: "task at 7pm"
  // Pattern 3: "task for 30 minutes"
  // Pattern 4: "task 18:00"

  // Extract duration first (so we can remove it from title)
  const durationMatch = trimmed.match(/\bfor\s+(\d+(?:\.\d+)?)\s*(hour|hr|minute|min|m)s?\b/i);
  if (durationMatch) {
    duration = extractDuration(durationMatch[0]);
    // Remove duration from text
    title = trimmed.replace(durationMatch[0], "").trim();
  }

  // Extract time with "at" keyword: "task at 7pm"
  const atMatch = title.match(/\bat\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)\b/i);
  if (atMatch) {
    startTime = extractTime(atMatch[1]);
    // Remove "at TIME" from title
    title = title.replace(atMatch[0], "").trim();
  } else {
    // Try to extract time without "at" keyword: "task 18:00" or "task 7pm"
    // Look for time at the end of the string
    const timeMatch = title.match(/\s+([0-9]{1,2}(?::[0-9]{2})?\s*(?:am|pm)?)\s*$/i);
    if (timeMatch) {
      startTime = extractTime(timeMatch[1]);
      if (startTime !== null) {
        // Remove time from title
        title = title.replace(timeMatch[0], "").trim();
      }
    }
  }

  // Handle special phrases like "after school", "before dinner", etc.
  // These don't have specific times, so we leave startTime as null
  const specialPhrases = ["after school", "before dinner", "after work", "before bed"];
  const hasSpecialPhrase = specialPhrases.some(phrase =>
    title.toLowerCase().includes(phrase)
  );

  // If no time extracted and no special phrase, keep the title as-is
  // (user can still manually set time)

  // Default duration if not specified
  if (duration === null && startTime !== null) {
    duration = 45; // 45 minutes default
  }

  // Calculate end time
  let endTime: number | null = null;
  if (startTime !== null && duration !== null) {
    endTime = Math.min(startTime + duration, 1440); // Cap at midnight
  }

  return {
    title: title || "Untitled Task",
    start: startTime,
    end: endTime,
    duration,
  };
}

/**
 * Validate parsed task times
 */
export function validateParsedTask(parsed: ParsedTaskInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!parsed.title || parsed.title.trim().length === 0) {
    errors.push("Task title is empty");
  }

  if (parsed.start !== null && (parsed.start < 0 || parsed.start > 1439)) {
    errors.push("Start time out of bounds (0-1439 minutes)");
  }

  if (parsed.end !== null && (parsed.end < 1 || parsed.end > 1440)) {
    errors.push("End time out of bounds (1-1440 minutes)");
  }

  if (parsed.start !== null && parsed.end !== null && parsed.start >= parsed.end) {
    errors.push("Start time must be before end time");
  }

  if (parsed.duration !== null && (parsed.duration < 1 || parsed.duration > 1440)) {
    errors.push("Duration must be between 1 and 1440 minutes");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Format minutes since midnight back to human-readable time
 */
export function formatMinutesAsTime(minutes: number): string {
  if (minutes < 0 || minutes > 1440) return "Invalid";

  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;

  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours % 12 || 12;

  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}
