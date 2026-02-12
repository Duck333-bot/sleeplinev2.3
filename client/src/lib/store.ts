/**
 * Sleepline — Global State Store (Zustand + localStorage)
 * 
 * Single source of truth for:
 * - User profile + onboarding
 * - Today's plan (tasks + system blocks + sleep options)
 * - Check-ins
 * - History
 * - UI state (selected sleep option, focus timer, etc.)
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
  // ─── User ────────────────────────────────────────
  user: UserProfile | null;
  setUser: (user: UserProfile) => void;
  updateOnboarding: (onboarding: Partial<Onboarding>) => void;
  updateReminderSettings: (settings: Partial<ReminderSettings>) => void;

  // ─── Navigation State ────────────────────────────
  currentPage: "onboarding" | "checkin" | "dashboard" | "history" | "settings";
  setPage: (page: SleeplineState["currentPage"]) => void;

  // ─── Check-ins ───────────────────────────────────
  checkIns: CheckIn[];
  todayCheckIn: () => CheckIn | undefined;
  addCheckIn: (checkIn: Omit<CheckIn, "id" | "createdAt">) => void;

  // ─── Day Plans ───────────────────────────────────
  plans: DayPlan[];
  todayPlan: () => DayPlan | undefined;
  previewPlan: DayPlan | null;
  setPreviewPlan: (plan: DayPlan | null) => void;
  applyPlan: (plan: DayPlan) => void;

  // ─── Tasks ───────────────────────────────────────
  updateTask: (taskId: string, updates: Partial<Task>) => void;
  completeTask: (taskId: string) => void;
  snoozeTask: (taskId: string, minutes: number) => void;

  // ─── Sleep Options ───────────────────────────────
  selectSleepOption: (optionId: string) => void;

  // ─── Focus Timer ─────────────────────────────────
  focusTimer: FocusTimer | null;
  startFocus: (taskId: string) => void;
  pauseFocus: () => void;
  resumeFocus: () => void;
  stopFocus: () => void;
  tickFocus: () => void;

  // ─── AI Chat Messages ────────────────────────────
  aiMessages: Array<{ role: "user" | "assistant"; content: string; timestamp: string }>;
  addAiMessage: (role: "user" | "assistant", content: string) => void;
  clearAiMessages: () => void;

  // ─── Reset ───────────────────────────────────────
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

export const useStore = create<SleeplineState>()(
  persist(
    (set, get) => ({
      ...initialState,

      setUser: (user) => set({ user }),

      updateOnboarding: (onboarding) => {
        const user = get().user;
        if (!user) return;
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
        set({
          user: {
            ...user,
            reminderSettings: { ...user.reminderSettings, ...settings },
          },
        });
      },

      setPage: (page) => set({ currentPage: page }),

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
        set(s => ({ checkIns: [...s.checkIns, newCheckIn] }));
      },

      todayPlan: () => {
        const today = todayStr();
        return get().plans.find(p => p.date === today && p.appliedAt !== null);
      },

      setPreviewPlan: (plan) => set({ previewPlan: plan }),

      applyPlan: (plan) => {
        const appliedPlan = { ...plan, appliedAt: new Date().toISOString() };
        set(s => ({
          plans: [...s.plans.filter(p => p.date !== plan.date || p.appliedAt === null), appliedPlan],
          previewPlan: null,
        }));
      },

      updateTask: (taskId, updates) => {
        set(s => ({
          plans: s.plans.map(p => ({
            ...p,
            tasks: p.tasks.map(t => t.id === taskId ? { ...t, ...updates } : t),
          })),
        }));
      },

      completeTask: (taskId) => {
        get().updateTask(taskId, { status: "completed" });
        // If focus timer is on this task, stop it
        if (get().focusTimer?.taskId === taskId) {
          get().stopFocus();
        }
      },

      snoozeTask: (taskId, minutes) => {
        set(s => ({
          plans: s.plans.map(p => ({
            ...p,
            tasks: p.tasks.map(t => {
              if (t.id !== taskId) return t;
              return {
                ...t,
                startMin: t.startMin + minutes,
                endMin: t.endMin + minutes,
                status: "snoozed",
              };
            }),
          })),
        }));
      },

      selectSleepOption: (optionId) => {
        const today = todayStr();
        set(s => ({
          plans: s.plans.map(p =>
            p.date === today ? { ...p, selectedSleepOptionId: optionId } : p
          ),
        }));
      },

      startFocus: (taskId) => {
        const plan = get().todayPlan();
        if (!plan) return;
        const task = plan.tasks.find(t => t.id === taskId);
        if (!task) return;
        const totalSec = (task.endMin - task.startMin) * 60;
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
        set({ focusTimer: { ...ft, pausedAt: Date.now() } });
      },

      resumeFocus: () => {
        const ft = get().focusTimer;
        if (!ft || !ft.pausedAt) return;
        set({ focusTimer: { ...ft, pausedAt: null, startedAt: Date.now() } });
      },

      stopFocus: () => set({ focusTimer: null }),

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
        set(s => ({
          aiMessages: [...s.aiMessages, {
            role,
            content,
            timestamp: new Date().toISOString(),
          }],
        }));
      },

      clearAiMessages: () => set({ aiMessages: [] }),

      resetAll: () => set(initialState),
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
