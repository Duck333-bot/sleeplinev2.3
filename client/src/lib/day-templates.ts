/**
 * Sleepline — Day Templates
 * Predefined schedule structures for quick day setup
 */

import type { SystemBlock } from "./schemas";
import { nanoid } from "nanoid";

export type TemplateType = "school" | "weekend" | "exam";

export interface DayTemplate {
  id: TemplateType;
  name: string;
  description: string;
  icon: string;
  blocks: Omit<SystemBlock, "id">[];
}

/**
 * School Day Template
 * Typical weekday with school, homework, and structured breaks
 */
export const SCHOOL_DAY_TEMPLATE: DayTemplate = {
  id: "school",
  name: "School Day",
  description: "Structured weekday with school, homework, and breaks",
  icon: "📚",
  blocks: [
    {
      type: "wake-up",
      title: "Wake Up",
      startMin: 420, // 7:00 AM
      endMin: 450, // 7:30 AM
      auto: true,
    },
    {
      type: "free",
      title: "School",
      startMin: 495, // 8:15 AM
      endMin: 900, // 3:00 PM
      auto: true,
    },
    {
      type: "snack",
      title: "Snack/Break",
      startMin: 900, // 3:00 PM
      endMin: 930, // 3:30 PM
      auto: true,
    },
    {
      type: "free",
      title: "Homework",
      startMin: 960, // 4:00 PM
      endMin: 1080, // 6:00 PM
      auto: true,
    },
    {
      type: "break",
      title: "Dinner",
      startMin: 1110, // 6:30 PM
      endMin: 1140, // 7:00 PM
      auto: true,
    },
    {
      type: "wind-down",
      title: "Wind Down",
      startMin: 1290, // 9:30 PM
      endMin: 1320, // 10:00 PM
      auto: true,
    },
    {
      type: "sleep",
      title: "Sleep",
      startMin: 1350, // 10:30 PM
      endMin: 420, // 7:00 AM (next day)
      auto: true,
    },
  ],
};

/**
 * Weekend Template
 * Relaxed schedule with exercise, free time, and later wake/sleep
 */
export const WEEKEND_TEMPLATE: DayTemplate = {
  id: "weekend",
  name: "Weekend",
  description: "Relaxed weekend with exercise and free time",
  icon: "🌞",
  blocks: [
    {
      type: "wake-up",
      title: "Wake Up",
      startMin: 540, // 9:00 AM
      endMin: 570, // 9:30 AM
      auto: true,
    },
    {
      type: "break",
      title: "Exercise",
      startMin: 630, // 10:30 AM
      endMin: 690, // 11:30 AM
      auto: true,
    },
    {
      type: "free",
      title: "Free Time",
      startMin: 780, // 1:00 PM
      endMin: 960, // 4:00 PM
      auto: true,
    },
    {
      type: "wind-down",
      title: "Wind Down",
      startMin: 1350, // 10:30 PM
      endMin: 1380, // 11:00 PM
      auto: true,
    },
    {
      type: "sleep",
      title: "Sleep",
      startMin: 1410, // 11:30 PM
      endMin: 540, // 9:00 AM (next day)
      auto: true,
    },
  ],
};

/**
 * Exam Day Template
 * Intensive study schedule with deep focus blocks and strategic breaks
 */
export const EXAM_DAY_TEMPLATE: DayTemplate = {
  id: "exam",
  name: "Exam Day",
  description: "Intensive study day with deep focus blocks",
  icon: "🎯",
  blocks: [
    {
      type: "wake-up",
      title: "Wake Up",
      startMin: 390, // 6:30 AM
      endMin: 420, // 7:00 AM
      auto: true,
    },
    {
      type: "free",
      title: "Deep Study 1",
      startMin: 480, // 8:00 AM
      endMin: 600, // 10:00 AM
      auto: true,
    },
    {
      type: "break",
      title: "Break",
      startMin: 600, // 10:00 AM
      endMin: 620, // 10:20 AM
      auto: true,
    },
    {
      type: "free",
      title: "Deep Study 2",
      startMin: 620, // 10:20 AM
      endMin: 720, // 12:00 PM
      auto: true,
    },
    {
      type: "free",
      title: "Light Review",
      startMin: 840, // 2:00 PM
      endMin: 900, // 3:00 PM
      auto: true,
    },
    {
      type: "wind-down",
      title: "Wind Down",
      startMin: 1260, // 9:00 PM
      endMin: 1290, // 9:30 PM
      auto: true,
    },
    {
      type: "sleep",
      title: "Sleep",
      startMin: 1320, // 10:00 PM
      endMin: 390, // 6:30 AM (next day)
      auto: true,
    },
  ],
};

/**
 * All available templates
 */
export const ALL_TEMPLATES: DayTemplate[] = [
  SCHOOL_DAY_TEMPLATE,
  WEEKEND_TEMPLATE,
  EXAM_DAY_TEMPLATE,
];

/**
 * Get template by ID
 */
export function getTemplateById(id: TemplateType): DayTemplate | undefined {
  return ALL_TEMPLATES.find(t => t.id === id);
}

/**
 * Convert template to system blocks with generated IDs
 */
export function templateToBlocks(template: DayTemplate): SystemBlock[] {
  return template.blocks.map(block => ({
    ...block,
    id: nanoid(),
  }));
}

/**
 * Get template description with time summary
 */
export function getTemplateTimeSummary(template: DayTemplate): string {
  const wakeBlock = template.blocks.find(b => b.type === "wake-up");
  const sleepBlock = template.blocks.find(b => b.type === "sleep");

  if (!wakeBlock || !sleepBlock) return "Custom schedule";

  const wakeTime = formatMin(wakeBlock.startMin);
  const sleepTime = formatMin(sleepBlock.startMin);

  return `${wakeTime} – ${sleepTime}`;
}

/**
 * Format minutes to readable time (e.g., "7:00 AM")
 */
function formatMin(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  const period = hours >= 12 ? "PM" : "AM";
  const displayHours = hours > 12 ? hours - 12 : hours === 0 ? 12 : hours;
  return `${displayHours}:${mins.toString().padStart(2, "0")} ${period}`;
}

/**
 * Validate template structure
 */
export function validateTemplate(template: DayTemplate): boolean {
  if (!template.blocks || template.blocks.length === 0) return false;

  // Check that all blocks have required fields
  return template.blocks.every(
    block =>
      block.type &&
      block.title &&
      typeof block.startMin === "number" &&
      typeof block.endMin === "number" &&
      block.startMin >= 0 &&
      block.startMin < 1440 &&
      block.endMin > 0 &&
      block.endMin <= 1440
  );
}
