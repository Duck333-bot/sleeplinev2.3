/**
 * TodayDashboard — Premium Daily Command Center
 * 
 * 5 main cards:
 * 1. Sleep Goal (bedtime → wake time)
 * 2. Next Block (upcoming task)
 * 3. Daily Progress (tasks completed)
 * 4. Energy Window (current energy phase)
 * 5. Today Timeline Preview (upcoming tasks)
 * 
 * Design: Notion / Linear / Calm inspired
 * - Clear card hierarchy
 * - Consistent spacing
 * - Clean typography
 * - Soft card backgrounds
 */

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import TodaysReview from "./TodaysReview";
import {
  getNextTask,
  getDailyProgress,
  getCurrentEnergyPhase,
  getSleepGoalInfo,
  getTimelinePreview,
  formatTimeRange,
} from "@/lib/dashboard-helpers";
import { minToDisplay, durationDisplay } from "@/lib/schemas";
import type { Task } from "@/lib/schemas";
import { motion } from "framer-motion";
import {
  Moon, Zap, CheckCircle2, Clock, Activity,
  ArrowRight, Sparkles, Battery, Sun
} from "lucide-react";

export default function TodayDashboard() {
  const todayPlan = useStore(s => s.todayPlan());
  const focusTimer = useStore(s => s.focusTimer);

  // Compute dashboard data
  const nextTask = useMemo(() => {
    if (!todayPlan) return null;
    return getNextTask(todayPlan.tasks);
  }, [todayPlan]);

  const progress = useMemo(() => {
    if (!todayPlan) return null;
    return getDailyProgress(todayPlan.tasks);
  }, [todayPlan]);

  const energyPhase = useMemo(() => {
    if (!todayPlan || !todayPlan.sleepOptions.length) return null;
    const sleepOption = todayPlan.sleepOptions.find(o => o.id === todayPlan.selectedSleepOptionId) || todayPlan.sleepOptions[0];
    return getCurrentEnergyPhase(sleepOption.wakeMin, sleepOption.bedtimeMin);
  }, [todayPlan]);

  const sleepGoal = useMemo(() => {
    return getSleepGoalInfo(todayPlan);
  }, [todayPlan]);

  const timelinePreview = useMemo(() => {
    if (!todayPlan) return [];
    return getTimelinePreview(todayPlan.tasks, 4);
  }, [todayPlan]);

  // Empty state
  if (!todayPlan) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-4"
      >
        <div className="p-8 rounded-xl bg-white/[0.02] border border-white/[0.05] text-center">
          <div className="w-12 h-12 rounded-lg bg-[var(--sl-glow-periwinkle)]/10 flex items-center justify-center mx-auto mb-3">
            <Moon className="w-6 h-6 text-[var(--sl-glow-periwinkle)] opacity-50" />
          </div>
          <p className="text-sm font-semibold text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
            No plan yet
          </p>
          <p className="text-xs text-[var(--sl-text-muted)] opacity-60 mt-2" style={{ fontFamily: "var(--font-body)" }}>
            Create a plan using the AI planner to see your daily dashboard
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-4"
    >
      {/* Row 1: Sleep Goal + Next Block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 1: Sleep Goal */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--sl-glow-periwinkle)]/15 flex items-center justify-center">
              <Moon className="w-4 h-4 text-[var(--sl-glow-periwinkle)]" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
              Sleep Goal
            </h3>
          </div>
          {sleepGoal ? (
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-lg font-semibold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-mono)" }}>
                  {sleepGoal.bedtime}
                </span>
                <ArrowRight className="w-4 h-4 text-[var(--sl-text-muted)] opacity-50" />
                <span className="text-lg font-semibold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-mono)" }}>
                  {sleepGoal.wakeTime}
                </span>
              </div>
              <p className="text-[10px] text-[var(--sl-text-muted)] opacity-70" style={{ fontFamily: "var(--font-body)" }}>
                {sleepGoal.sleepDuration}h target
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--sl-text-muted)] opacity-50">No sleep goal set</p>
          )}
        </motion.div>

        {/* Card 2: Next Block */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--sl-glow-amber)]/15 flex items-center justify-center">
              <Zap className="w-4 h-4 text-[var(--sl-glow-amber)]" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
              Next Block
            </h3>
          </div>
          {nextTask ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
                {nextTask.title}
              </p>
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-[var(--sl-text-muted)] opacity-70 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                  {nextTask.startMin > 0 ? formatTimeRange(nextTask.startMin, nextTask.endMin) : "Unscheduled"}
                </span>
                {nextTask.locked && (
                  <div title="Fixed time">
                    <Clock className="w-3 h-3 text-[var(--sl-text-muted)] opacity-40" />
                  </div>
                )}
              </div>
            </div>
          ) : (
            <p className="text-xs text-[var(--sl-text-muted)] opacity-50">All tasks completed</p>
          )}
        </motion.div>
      </div>

      {/* Row 2: Daily Progress + Energy Window */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Card 3: Daily Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-[var(--sl-glow-mint)]/15 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4 text-[var(--sl-glow-mint)]" />
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
              Daily Progress
            </h3>
          </div>
          {progress ? (
            <div className="space-y-3">
              <div className="flex items-baseline gap-2">
                <span className="text-2xl font-bold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-mono)" }}>
                  {progress.completed}
                </span>
                <span className="text-sm text-[var(--sl-text-muted)] opacity-70" style={{ fontFamily: "var(--font-body)" }}>
                  / {progress.total} tasks
                </span>
              </div>
              {/* Progress bar */}
              <div className="w-full h-2 rounded-full bg-white/[0.05] overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-[var(--sl-glow-mint)] to-[var(--sl-glow-cyan)] transition-all duration-500"
                  style={{ width: `${progress.percentage}%` }}
                />
              </div>
              <p className="text-[10px] text-[var(--sl-text-muted)] opacity-70" style={{ fontFamily: "var(--font-body)" }}>
                {progress.percentage}% complete
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--sl-text-muted)] opacity-50">No tasks</p>
          )}
        </motion.div>

        {/* Card 4: Energy Window */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] hover:border-white/[0.12] transition-colors"
        >
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${energyPhase?.color}15` }}>
              {energyPhase?.phase === "high-focus" && <Sun className="w-4 h-4" style={{ color: energyPhase.color }} />}
              {energyPhase?.phase === "peak-focus" && <Sparkles className="w-4 h-4" style={{ color: energyPhase.color }} />}
              {energyPhase?.phase === "dip" && <Activity className="w-4 h-4" style={{ color: energyPhase.color }} />}
              {energyPhase?.phase === "recovery" && <Battery className="w-4 h-4" style={{ color: energyPhase.color }} />}
              {energyPhase?.phase === "wind-down" && <Moon className="w-4 h-4" style={{ color: energyPhase.color }} />}
              {!["high-focus", "peak-focus", "dip", "recovery", "wind-down"].includes(energyPhase?.phase || "") && (
                <Clock className="w-4 h-4" style={{ color: energyPhase?.color }} />
              )}
            </div>
            <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
              Energy Window
            </h3>
          </div>
          {energyPhase ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)", color: energyPhase.color }}>
                {energyPhase.label}
              </p>
              <p className="text-[10px] text-[var(--sl-text-muted)] opacity-70" style={{ fontFamily: "var(--font-body)" }}>
                {energyPhase.description}
              </p>
            </div>
          ) : (
            <p className="text-xs text-[var(--sl-text-muted)] opacity-50">Unable to determine</p>
          )}
        </motion.div>
      </div>

      {/* Row 3: Timeline Preview + Today's Review */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Timeline Preview */}
        {timelinePreview.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08]"
          >
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg bg-[var(--sl-glow-cyan)]/15 flex items-center justify-center">
                <Clock className="w-4 h-4 text-[var(--sl-glow-cyan)]" />
              </div>
              <h3 className="text-xs font-semibold uppercase tracking-[0.1em] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
                Today Timeline
              </h3>
            </div>
            <div className="space-y-2">
              {timelinePreview.map((task, i) => (
                <TimelinePreviewItem key={task.id} task={task} isActive={focusTimer?.taskId === task.id} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Today's Review */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08]"
        >
          <TodaysReview />
        </motion.div>
      </div>
    </motion.div>
  );
}

function TimelinePreviewItem({ task, isActive }: { task: Task; isActive: boolean }) {
  const priorityDot: Record<string, string> = {
    high: "bg-red-400/80",
    med: "bg-amber-400/80",
    low: "bg-emerald-400/80",
  };

  return (
    <div className={`flex items-center gap-3 p-2.5 rounded-lg transition-colors ${
      isActive ? "bg-[var(--sl-glow-amber)]/10 border border-[var(--sl-glow-amber)]/20" : "hover:bg-white/[0.03]"
    }`}>
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} />
      <span className="text-[10px] text-[var(--sl-text-muted)] flex-shrink-0 w-[50px] tabular-nums font-medium" style={{ fontFamily: "var(--font-mono)" }}>
        {task.startMin > 0 ? minToDisplay(task.startMin) : "—"}
      </span>
      <span className="text-[11px] truncate flex-1 font-medium" style={{ fontFamily: "var(--font-heading)" }}>
        {task.title}
      </span>
      <span className="text-[9px] text-[var(--sl-text-muted)] opacity-70 flex-shrink-0 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {durationDisplay(task.endMin - task.startMin)}
      </span>
      {isActive && (
        <div className="w-1.5 h-1.5 rounded-full bg-[var(--sl-glow-amber)] animate-pulse flex-shrink-0" />
      )}
    </div>
  );
}
