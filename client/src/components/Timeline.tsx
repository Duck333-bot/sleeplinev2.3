/**
 * Timeline — Right Panel
 * Shows tasks + system blocks in chronological order
 * Highlights current block, shows gaps as "Free"
 * Quick actions: Start Focus, Complete, Snooze, Edit
 */

import { useMemo, useState } from "react";
import { useStore, getTimelineItems, getUnscheduledTasks } from "@/lib/store";
import { minToDisplay, durationDisplay } from "@/lib/schemas";
import type { Task, SystemBlock } from "@/lib/schemas";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play, CheckCircle2, Clock, Pause,
  Coffee, Moon, Sun, Utensils, Zap, Timer, Sparkles,
  ArrowRight, CalendarClock, Wand2, Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import OptimizationPreview from "./OptimizationPreview";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

function isTask(item: any): item is Task & { itemType: "task" } {
  return item.itemType === "task";
}

const typeIcons: Record<string, React.ReactNode> = {
  "break": <Coffee className="w-3.5 h-3.5" />,
  "snack": <Utensils className="w-3.5 h-3.5" />,
  "wind-down": <Moon className="w-3.5 h-3.5" />,
  "wake-up": <Sun className="w-3.5 h-3.5" />,
  "sleep": <Moon className="w-3.5 h-3.5" />,
  "work": <Zap className="w-3.5 h-3.5" />,
  "study": <Sparkles className="w-3.5 h-3.5" />,
  "exercise": <Timer className="w-3.5 h-3.5" />,
  "class": <CalendarClock className="w-3.5 h-3.5" />,
  "errand": <ArrowRight className="w-3.5 h-3.5" />,
};

const priorityColors: Record<string, string> = {
  high: "border-l-red-400/70",
  med: "border-l-amber-400/70",
  low: "border-l-emerald-400/70",
};

export default function Timeline() {
  const todayPlan = useStore(s => s.todayPlan());
  const focusTimer = useStore(s => s.focusTimer);
  const startFocus = useStore(s => s.startFocus);
  const pauseFocus = useStore(s => s.pauseFocus);
  const resumeFocus = useStore(s => s.resumeFocus);
  const stopFocus = useStore(s => s.stopFocus);
  const completeTask = useStore(s => s.completeTask);
  const snoozeTask = useStore(s => s.snoozeTask);
  const applyPlan = useStore(s => s.applyPlan);

  const [showOptimization, setShowOptimization] = useState(false);
  const [optimizationData, setOptimizationData] = useState<any>(null);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [isApplying, setIsApplying] = useState(false);

  const optimizeMutation = trpc.scheduleOptimizer.optimize.useMutation({
    onSuccess: (result) => {
      setIsOptimizing(false);
      if (result.success && result.optimization) {
        setOptimizationData(result);
        setShowOptimization(true);
        toast.success("Schedule optimized!");
      } else {
        toast.error(result.error || "Failed to optimize schedule");
      }
    },
    onError: (error) => {
      setIsOptimizing(false);
      toast.error(error.message || "Failed to optimize schedule");
    },
  });

  const items = useMemo(() => getTimelineItems(todayPlan), [todayPlan]);
  const unscheduled = useMemo(() => getUnscheduledTasks(todayPlan), [todayPlan]);
  const now = new Date();
  const currentMin = now.getHours() * 60 + now.getMinutes();

  const handleApplyOptimization = async () => {
    if (!optimizationData?.optimizedTasks || !todayPlan) return;

    setIsApplying(true);
    try {
      const optimizedPlan = {
        ...todayPlan,
        tasks: optimizationData.optimizedTasks,
      };

      applyPlan(optimizedPlan);
      setShowOptimization(false);
      setOptimizationData(null);
      toast.success("Schedule optimized and applied!");
    } catch (error) {
      toast.error("Failed to apply optimization");
    } finally {
      setIsApplying(false);
    }
  };

  if (!todayPlan) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-14 h-14 rounded-2xl bg-[var(--sl-glow-periwinkle)]/[0.08] flex items-center justify-center mb-4">
          <Moon className="w-7 h-7 text-[var(--sl-glow-periwinkle)] opacity-40" />
        </div>
        <p className="text-sm font-medium text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
          No plan yet for today
        </p>
        <p className="text-xs text-[var(--sl-text-muted)] opacity-50 mt-1.5 max-w-[200px]">
          Use the AI planner on the left to create your day schedule
        </p>
      </div>
    );
  }

  const completedCount = items.filter(i => isTask(i) && i.status === "completed").length;
  const totalTasks = items.filter(isTask).length;

  return (
    <div className="space-y-1">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
          Today's Timeline
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-[var(--sl-text-muted)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
            {completedCount}/{totalTasks} done
          </span>
          {todayPlan && todayPlan.tasks.length > 0 && (
            <Button
              onClick={() => {
                setIsOptimizing(true);
                const sleepOption = todayPlan.sleepOptions.find(o => o.id === todayPlan.selectedSleepOptionId) || todayPlan.sleepOptions[0];
                optimizeMutation.mutate({
                  tasks: todayPlan.tasks,
                  wakeTime: sleepOption.wakeMin,
                  bedtime: sleepOption.bedtimeMin,
                  sleepDurationHrs: sleepOption.sleepDurationHrs,
                });
              }}
              size="sm"
              variant="ghost"
              className="h-6 px-2 text-[10px] gap-1.5 hover:bg-[var(--sl-glow-cyan)]/10 text-[var(--sl-glow-cyan)]"
              disabled={isOptimizing}
              title="AI rearranges your tasks to improve focus and energy."
            >
              {isOptimizing ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Wand2 className="w-3 h-3" />
              )}
              <span>{isOptimizing ? "Analyzing..." : "Optimize Schedule"}</span>
            </Button>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {totalTasks > 0 && (
        <div className="h-1 rounded-full bg-white/5 overflow-hidden mb-3">
          <motion.div
            className="h-full rounded-full bg-gradient-to-r from-[var(--sl-glow-periwinkle)] to-[var(--sl-glow-mint)]"
            initial={{ width: 0 }}
            animate={{ width: totalTasks > 0 ? `${(completedCount / totalTasks) * 100}%` : "0%" }}
            transition={{ duration: 0.5 }}
          />
        </div>
      )}

      {/* Timeline items */}
      <div className="space-y-0.5">
        <AnimatePresence>
          {items.map((item, idx) => {
            const isCurrent = item.startMin <= currentMin && item.endMin > currentMin;
            const isPast = item.endMin <= currentMin;
            const isTaskItem = isTask(item);
            const duration = item.endMin - item.startMin;
            const isFocused = focusTimer?.taskId === item.id;
            const isCompleted = isTaskItem && item.status === "completed";
            const isSkipped = isTaskItem && item.status === "skipped";

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ delay: idx * 0.02 }}
                className={`
                  relative flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-200
                  ${isCurrent ? "bg-white/[0.06] ring-1 ring-[var(--sl-glow-periwinkle)]/20" : "hover:bg-white/[0.02]"}
                  ${isCompleted ? "opacity-45" : ""}
                  ${isSkipped ? "opacity-25" : ""}
                  ${isTaskItem ? `border-l-2 ${priorityColors[item.priority] || "border-l-transparent"}` : "border-l-2 border-l-transparent"}
                `}
              >
                {/* Time column */}
                <div className="flex-shrink-0 w-[52px] text-right pt-0.5">
                  <span
                    className={`text-[10px] tabular-nums ${isCurrent ? "text-[var(--sl-glow-amber)]" : isPast ? "text-[var(--sl-text-muted)]/40" : "text-[var(--sl-text-muted)]"}`}
                    style={{ fontFamily: "var(--font-mono)" }}
                  >
                    {minToDisplay(item.startMin)}
                  </span>
                </div>

                {/* Timeline dot/icon */}
                <div className={`
                  flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center mt-0.5
                  ${isCurrent ? "bg-[var(--sl-glow-periwinkle)]/20 text-[var(--sl-glow-periwinkle)]" :
                    isCompleted ? "bg-[var(--sl-glow-mint)]/15 text-[var(--sl-glow-mint)]" :
                    isTaskItem ? "bg-white/5 text-[var(--sl-text-muted)]" :
                    "bg-[var(--sl-glow-cyan)]/8 text-[var(--sl-glow-cyan)]/70"}
                `}>
                  {isCompleted ? (
                    <CheckCircle2 className="w-3 h-3" />
                  ) : (
                    typeIcons[isTaskItem ? item.type : (item as SystemBlock).type] || <Clock className="w-3 h-3" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span
                      className={`text-[13px] font-medium truncate ${isCompleted ? "line-through" : ""}`}
                      style={{ fontFamily: "var(--font-heading)" }}
                    >
                      {item.title}
                    </span>
                    {isCurrent && (
                      <span className="flex-shrink-0 w-1.5 h-1.5 rounded-full bg-[var(--sl-glow-amber)] animate-pulse" />
                    )}
                  </div>
                  <span className="text-[9px] text-[var(--sl-text-muted)] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
                    {durationDisplay(duration)}
                    {isTaskItem && item.locked && " · Fixed"}
                  </span>

                  {/* Quick actions for tasks */}
                  {isTaskItem && !isCompleted && !isSkipped && (
                    <div className="flex items-center gap-1 mt-1.5">
                      {isCurrent && !isFocused && (
                        <button
                          onClick={() => startFocus(item.id)}
                          className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-[var(--sl-glow-amber)]/10 text-[var(--sl-glow-amber)] hover:bg-[var(--sl-glow-amber)]/20 transition-colors"
                          style={{ fontFamily: "var(--font-heading)" }}
                        >
                          <Play className="w-2.5 h-2.5" /> Focus
                        </button>
                      )}
                      {isFocused && (
                        <>
                          <button
                            onClick={focusTimer?.pausedAt ? resumeFocus : pauseFocus}
                            className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10 transition-colors"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            {focusTimer?.pausedAt ? <Play className="w-2.5 h-2.5" /> : <Pause className="w-2.5 h-2.5" />}
                            {focusTimer?.pausedAt ? "Resume" : "Pause"}
                          </button>
                          <button
                            onClick={stopFocus}
                            className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10 transition-colors"
                            style={{ fontFamily: "var(--font-heading)" }}
                          >
                            Stop
                          </button>
                        </>
                      )}
                      <button
                        onClick={() => completeTask(item.id)}
                        className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-[var(--sl-glow-mint)]/10 text-[var(--sl-glow-mint)] hover:bg-[var(--sl-glow-mint)]/20 transition-colors"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        <CheckCircle2 className="w-2.5 h-2.5" /> Done
                      </button>
                      <button
                        onClick={() => snoozeTask(item.id, 10)}
                        className="inline-flex items-center gap-1 text-[9px] font-medium px-2 py-0.5 rounded-full bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10 transition-colors"
                        style={{ fontFamily: "var(--font-heading)" }}
                      >
                        +10m
                      </button>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div className="mt-4 pt-3 border-t border-white/5">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-[10px] font-semibold tracking-wider uppercase text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
              Unscheduled ({unscheduled.length})
            </h4>
          </div>
          {unscheduled.map(task => (
            <div key={task.id} className="flex items-center gap-2 py-1.5 px-2 text-xs text-[var(--sl-text-muted)]">
              <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
              <span className="truncate" style={{ fontFamily: "var(--font-heading)" }}>{task.title}</span>
              <span className="text-[9px] ml-auto opacity-50" style={{ fontFamily: "var(--font-mono)" }}>
                {durationDisplay(task.endMin - task.startMin)}
              </span>
            </div>
          ))}
        </div>
      )}

      {/* Optimization Preview Modal */}
      {showOptimization && optimizationData && (
        <OptimizationPreview
          original={todayPlan.tasks}
          optimized={optimizationData.optimizedTasks}
          reason={optimizationData.optimization.reason}
          improvements={optimizationData.optimization.improvements}
          onApply={handleApplyOptimization}
          onCancel={() => setShowOptimization(false)}
          isApplying={isApplying}
        />
      )}
    </div>
  );
}
