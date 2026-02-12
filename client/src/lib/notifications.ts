/**
 * Sleepline — Browser Notification Service
 * Handles wind-down, bedtime, and next-task reminders
 */

import type { DayPlan, ReminderSettings, Task, SystemBlock } from "./schemas";
import { minToDisplay } from "./schemas";

let notificationTimers: ReturnType<typeof setTimeout>[] = [];

export function clearAllNotifications() {
  notificationTimers.forEach(clearTimeout);
  notificationTimers = [];
}

export function requestPermission(): Promise<boolean> {
  if (!("Notification" in window)) return Promise.resolve(false);
  if (Notification.permission === "granted") return Promise.resolve(true);
  return Notification.requestPermission().then(p => p === "granted");
}

function sendNotification(title: string, body: string, tag?: string) {
  if (Notification.permission !== "granted") return;
  try {
    new Notification(title, {
      body,
      icon: "/favicon.ico",
      tag: tag || "sleepline",
      silent: false,
    });
  } catch (e) {
    console.warn("Notification failed:", e);
  }
}

function isInQuietHours(currentMin: number, settings: ReminderSettings): boolean {
  const { quietHoursStart, quietHoursEnd } = settings;
  if (quietHoursStart > quietHoursEnd) {
    // Wraps midnight: e.g., 23:00 - 07:00
    return currentMin >= quietHoursStart || currentMin < quietHoursEnd;
  }
  return currentMin >= quietHoursStart && currentMin < quietHoursEnd;
}

export function scheduleReminders(plan: DayPlan, settings: ReminderSettings) {
  clearAllNotifications();

  if (Notification.permission !== "granted") return;

  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Wind-down reminder
  if (settings.windDownReminder) {
    const windDown = plan.systemBlocks.find(b => b.type === "wind-down");
    if (windDown) {
      const reminderMin = windDown.startMin - settings.windDownMinsBefore;
      if (reminderMin > currentMin && !isInQuietHours(reminderMin, settings)) {
        const delayMs = (reminderMin - currentMin) * 60 * 1000;
        const timer = setTimeout(() => {
          sendNotification(
            "🌙 Wind-down Time",
            `Start winding down at ${minToDisplay(windDown.startMin)}. Time to relax.`,
            "wind-down"
          );
        }, delayMs);
        notificationTimers.push(timer);
      }
    }
  }

  // Bedtime reminder
  if (settings.bedtimeReminder) {
    const sleep = plan.systemBlocks.find(b => b.type === "sleep");
    if (sleep && sleep.startMin > currentMin) {
      const delayMs = (sleep.startMin - currentMin) * 60 * 1000;
      const timer = setTimeout(() => {
        sendNotification(
          "😴 Bedtime",
          `It's ${minToDisplay(sleep.startMin)} — time for bed. Good night!`,
          "bedtime"
        );
      }, delayMs);
      notificationTimers.push(timer);
    }
  }

  // Next task reminders
  if (settings.nextTaskReminder) {
    const futureTasks = plan.tasks.filter(
      t => t.startMin > currentMin && t.status !== "completed" && t.status !== "skipped"
    );

    for (const task of futureTasks) {
      const reminderMin = task.startMin - settings.nextTaskMinsBefore;
      if (reminderMin > currentMin && !isInQuietHours(reminderMin, settings)) {
        const delayMs = (reminderMin - currentMin) * 60 * 1000;
        const timer = setTimeout(() => {
          sendNotification(
            "⏰ Next Task",
            `"${task.title}" starts at ${minToDisplay(task.startMin)}`,
            `task-${task.id}`
          );
        }, delayMs);
        notificationTimers.push(timer);
      }
    }
  }
}
