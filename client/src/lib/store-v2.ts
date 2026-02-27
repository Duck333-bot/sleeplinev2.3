/**
 * Sleepline — Global State Store v2 (Fixed)
 * 
 * Improvements:
 * 1. Immutable state updates with deep cloning
 * 2. Defensive logic to prevent task overwrites
 * 3. Validation to prevent overlapping tasks
 * 4. Comprehensive logging for debugging
 * 5. Proper task merging instead of replacement
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { nanoid } from "nanoid";
import type {
  UserProfile, Onboarding, CheckIn, DayPlan, Task,
  SystemBlock, SleepOption, ReminderSettings
} from "./schemas";

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

interface FocusTimer {
  taskId: string;
  startedAt: number;
  pausedAt: number | null;
  remainingSec: number;
  totalSec: number;
}

interface SleeplineState {
  // ─── User ────────────────────────────────────
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateOnboarding: (onboarding: Partial<Onboarding>) => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;

  // ─── Navigation State ────────────────────────
  currentPage: "onboarding" | "checkin" | "dashboard" | "history" | "settings";
  setPage: (page: SleeplineState["currentPage"]) => void;

  // ─── Check-ins ───────────────────────────────
  checkIns: CheckIn[];
  todayCheckIn: () => CheckIn | undefined;
  addCheckIn: (checkIn: Omit<CheckIn, "id" | "createdAt">) => void;

  // ─── Day Plans ───────────────────────────────
  plans: DayPlan[];
  todayPlan: () => DayPlan | undefined;
  previewPlan: DayPlan | null;
  setPreviewPlan: (plan: DayPlan | null) => void;
  applyPlan: (plan: DayPlan) => void;

  // ─── Tasks ───────────────────────────────────
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  completeTask: (taskId: string) => void;
  snoozeTask: (taskId: string, minutes: number) => void;

  // ─── Sleep Options ───────────────────────────
  selectSleepOption: (optionId: string) => void;

  // ─── Focus Timer ─────────────────────────────
  focusTimer: FocusTimer | null;
  startFocus: (taskId: string) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: () => void;
  tickFocus: () => void;

  // ─── AI Chat Messages ────────────────────────
  aiMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  addAiMessage: (role: "user" | "assistant", content: string) => void;
  clearAiMessages: () => void;

  // ─── Reset ───────────────────────────────────
  resetAll: () => void;
}

const initialState = {
  user: null,
  currentPage: "onboarding" as const,
  checkIns: [],
  plans: [],
  previewPlan: null,
  focusTimer: null,
  aiMessages: [],
};

/**
 * Deep clone a DayPlan to ensure immutability
 */
function clonePlan(plan: DayPlan): DayPlan {
  return {
    ...plan,
    tasks: plan.tasks.map(t => ({ ...t })),
    systemBlocks: plan.systemBlocks.map(b => ({ ...b })),
    sleepOptions: plan.sleepOptions.map(o => ({ ...o })),
    warnings: [...plan.warnings],
  };
}

/**
 * Check if two tasks overlap in time
 */
function tasksOverlap(task1: Task, task2: Task): boolean {
  if (task1.startMin === 0 || task2.startMin === 0) return false; // Unscheduled tasks
  return !(task1.endMin <= task2.startMin || task2.endMin <= task1.startMin);
}

/**
 * Validate that a plan has no overlapping tasks
 */
function validatePlanConsistency(plan: DayPlan): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  const scheduledTasks = plan.tasks.filter(t => t.startMin > 0 && t.endMin > 0);

  // Check for overlapping tasks
  for (let i = 0; i < scheduledTasks.length; i++) {
    for (let j = i + 1; j < scheduledTasks.length; j++) {
      if (tasksOverlap(scheduledTasks[i], scheduledTasks[j])) {
        errors.push(`Tasks overlap: "${scheduledTasks[i].title}" and "${scheduledTasks[j].title}"`);
      }
    }
  }

  // Check for invalid time ranges
  for (const task of scheduledTasks) {
    if (task.startMin >= task.endMin) {
      errors.push(`Invalid time range for "${task.title}": ${task.startMin} >= ${task.endMin}`);
    }
    if (task.startMin < 0 || task.endMin > 1440) {
      errors.push(`Out of bounds time for "${task.title}": ${task.startMin}-${task.endMin}`);
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

export const useStore = create<SleeplineState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => {
        console.log("[Store] Setting user:", user.name);
        set({ user });
      },

      updateOnboarding: (onboarding) => {
        const user = get().user;
        if (!user) return;
        console.log("[Store] Updating onboarding");
        set({
          user: {
            ...user,
            onboarding: { ...user.onboarding, ...onboarding },
          },
        });
      },

      updateReminderSettings: (settings) => {
        const user = get().user;
        if (!user) return;
        console.log("[Store] Updating reminder settings");
        set({
          user: {
            ...user,
            reminderSettings: { ...user.reminderSettings, ...settings },
          },
        });
      },

      setPage: (page) => {
        console.log("[Store] Navigating to page:", page);
        set({ currentPage: page });
      },

      todayCheckIn: () => {
        const today = todayStr();
        return get().checkIns.find(c => c.date === today);
      },

      addCheckIn: (checkIn) => {
        const newCheckIn: CheckIn = {
          ...checkIn,
          id: nanoid(),
          createdAt: new Date().toISOString(),
        };
        console.log("[Store] Adding check-in for", checkIn.date);
        set(s => ({ checkIns: [...s.checkIns, newCheckIn] }));
      },

      todayPlan: () => {
        const today = todayStr();
        return get().plans.find(p => p.date === today && p.appliedAt !== null);
      },

      setPreviewPlan: (plan) => {
        if (plan) {
          const validation = validatePlanConsistency(plan);
          if (!validation.valid) {
            console.warn("[Store] Preview plan has issues:", validation.errors);
          }
          console.log("[Store] Setting preview plan with", plan.tasks.length, "tasks");
        } else {
          console.log("[Store] Clearing preview plan");
        }
        set({ previewPlan: plan ? clonePlan(plan) : null });
      },

      applyPlan: (plan) => {
        const validation = validatePlanConsistency(plan);
        if (!validation.valid) {
          console.error("[Store] Cannot apply invalid plan:", validation.errors);
          return;
        }

        const appliedPlan = clonePlan({
          ...plan,
          appliedAt: new Date().toISOString(),
        });

        console.log("[Store] Applying plan for", plan.date, "with", appliedPlan.tasks.length, "tasks");

        set(s => {
          // Remove any unapplied preview plans for this date, keep applied plans
          const filteredPlans = s.plans.filter(p => p.date !== plan.date || p.appliedAt !== null);
          return {
            plans: [...filteredPlans, appliedPlan],
            previewPlan: null,
          };
        });
      },

      updateTask: (taskId, updates) => {
        console.log("[Store] Updating task", taskId, "with:", Object.keys(updates));

        set(s => {
          // Deep clone all plans to ensure immutability
          const newPlans = s.plans.map(p => {
            // Only update the plan containing this task
            const hasTask = p.tasks.some(t => t.id === taskId);
            if (!hasTask) return p;

            const updatedPlan = clonePlan(p);
            updatedPlan.tasks = updatedPlan.tasks.map(t =>
              t.id === taskId ? { ...t, ...updates } : t
            );

            // Validate after update
            const validation = validatePlanConsistency(updatedPlan);
            if (!validation.valid) {
              console.warn("[Store] Plan consistency issues after task update:", validation.errors);
            }

            return updatedPlan;
          });

          return { plans: newPlans };
        });
      },

      completeTask: (taskId) => {
        console.log("[Store] Completing task", taskId);
        get().updateTask(taskId, { status: "completed" });
        // If focus timer is on this task, stop it
        if (get().focusTimer?.taskId === taskId) {
          get().stopFocus();
        }
      },

      snoozeTask: (taskId, minutes) => {
        console.log("[Store] Snoozing task", taskId, 'by', minutes, 'minutes');

        set(s => {
          const newPlans = s.plans.map(p => {
            const hasTask = p.tasks.some(t => t.id === taskId);
            if (!hasTask) return p;

            const updatedPlan = clonePlan(p);
            updatedPlan.tasks = updatedPlan.tasks.map(t => {
              if (t.id !== taskId) return t;
              return {
                ...t,
                startMin: t.startMin + minutes,
                endMin: t.endMin + minutes,
                status: "snoozed" as const,
              };
            });

            // Validate after snooze
            const validation = validatePlanConsistency(updatedPlan);
            if (!validation.valid) {
              console.warn("[Store] Plan consistency issues after snooze:", validation.errors);
            }

            return updatedPlan;
          });

          return { plans: newPlans };
        });
      },

      selectSleepOption: (optionId) => {
        const today = todayStr();
        console.log("[Store] Selecting sleep option", optionId, 'for', today);

        set(s => ({
          plans: s.plans.map(p => {
            if (p.date !== today) return p;
            const updatedPlan = clonePlan(p);
            updatedPlan.selectedSleepOptionId = optionId;
            return updatedPlan;
          }),
        }));
      },

      startFocus: (taskId) => {
        const plan = get().todayPlan();
        if (!plan) {
          console.warn("[Store] Cannot start focus: no today plan");
          return;
        }

        const task = plan.tasks.find(t => t.id === taskId);
        if (!task) {
          console.warn("[Store] Cannot start focus: task not found", taskId);
          return;
        }

        const totalSec = (task.endMin - task.startMin) * 60;
        console.log("[Store] Starting focus on task', taskId, 'for', totalSec, 'seconds");

        set({
          focusTimer: {
            taskId,
            startedAt: Date.now(),
            pausedAt: null,
            remainingSec: totalSec,
            totalSec,
          },
        });

        get().updateTask(taskId, { status: "active" });
      },

      pauseFocus: () => {
        const ft = get().focusTimer;
        if (!ft || ft.pausedAt) return;
        console.log("[Store] Pausing focus");
        set({ focusTimer: { ...ft, pausedAt: Date.now() } });
      },

      resumeFocus: () => {
        const ft = get().focusTimer;
        if (!ft || !ft.pausedAt) return;
        console.log("[Store] Resuming focus");
        set({ focusTimer: { ...ft, pausedAt: null, startedAt: Date.now() } });
      },

      stopFocus: () => {
        console.log("[Store] Stopping focus");
        set({ focusTimer: null });
      },

      tickFocus: () => {
        const ft = get().focusTimer;
        if (!ft || ft.pausedAt) return;
        const elapsed = Math.floor((Date.now() - ft.startedAt) / 1000);
        const remaining = Math.max(0, ft.totalSec - elapsed);
        set({ focusTimer: { ...ft, remainingSec: remaining } });
        if (remaining <= 0) {
          get().completeTask(ft.taskId);
        }
      },

      addAiMessage: (role, content) => {
        console.log("[Store] Adding AI message:", role);
        set(s => ({
          aiMessages: [...s.aiMessages, {
            role,
            content,
            timestamp: new Date().toISOString(),
          }],
        }));
      },

      clearAiMessages: () => {
        console.log("[Store] Clearing AI messages");
        set({ aiMessages: [] });
      },

      resetAll: () => {
        console.log("[Store] Resetting all state");
        set(initialState);
      },
    }),
    {
      name: "sleepline-store",
      partialize: (state) => ({
        user: state.user,
        currentPage: state.currentPage,
        checkIns: state.checkIns,
        plans: state.plans,
        aiMessages: state.aiMessages,
      }),
    }
  )
);

// ─── Derived Selectors ─────────────────────────────────────

export function getCurrentBlock(plan: DayPlan | undefined): (Task | SystemBlock) | null {
  if (!plan) return null;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  // Check tasks first
  const activeTask = plan.tasks.find(
    t => t.startMin <= currentMin && t.endMin > currentMin && t.status !== "completed" && t.status !== "skipped"
  );
  if (activeTask) return activeTask;

  // Check system blocks
  const activeBlock = plan.systemBlocks.find(
    b => b.startMin <= currentMin && b.endMin > currentMin
  );
  if (activeBlock) return activeBlock;

  return null;
}

export function getNextBlock(plan: DayPlan | undefined): (Task | SystemBlock) | null {
  if (!plan) return null;
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const allBlocks = [
    ...plan.tasks.filter(t => t.status !== "completed" && t.status !== "skipped"),
    ...plan.systemBlocks,
  ].sort((a, b) => a.startMin - b.startMin);

  return allBlocks.find(b => b.startMin > currentMin) || null;
}

export function getTimelineItems(plan: DayPlan | undefined): Array<(Task | SystemBlock) & { itemType: "task" | "system" }> {
  if (!plan) return [];

  const items = [
    ...plan.tasks.filter(t => t.startMin > 0 || t.endMin > 0).map(t => ({ ...t, itemType: "task" as const })),
    ...plan.systemBlocks.map(b => ({ ...b, itemType: "system" as const })),
  ].sort((a, b) => a.startMin - b.startMin);

  return items;
}

export function getUnscheduledTasks(plan: DayPlan | undefined): Task[] {
  if (!plan) return [];
  return plan.tasks.filter(t => t.startMin === 0 && t.endMin === 0);
}
