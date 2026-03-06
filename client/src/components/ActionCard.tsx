/**
 * ActionCard — Structured AI Output Cards
 * Every meaningful AI response produces these cards:
 * - Plan Preview with Apply/Edit/Discard
 * - Task cards with times
 * - Sleep option cards
 * 
 * IMPROVED: Premium hierarchy, clearer actions, better visual structure
 */

import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { minToDisplay, durationDisplay } from "@/lib/schemas";
import type { DayPlan, Task, SleepOption } from "@/lib/schemas";
import {
  CheckCircle2, X, Clock, AlertTriangle,
  Zap, Moon, Battery, ArrowRight, Sparkles, Info
} from "lucide-react";
import { toast } from "sonner";
import BedtimeExplanation from "./BedtimeExplanation";

// ─── Plan Preview Card ─────────────────────────────────────

export function PlanPreviewCard({ plan }: { plan: DayPlan }) {
  const applyPlan = useStore(s => s.applyPlan);
  const setPreviewPlan = useStore(s => s.setPreviewPlan);

  const scheduledTasks = plan.tasks.filter(t => t.startMin > 0 || t.endMin > 0);
  const unscheduled = plan.tasks.filter(t => t.startMin === 0 && t.endMin === 0);

  const handleApply = () => {
    applyPlan(plan);
    toast.success("Plan applied", {
      description: `${scheduledTasks.length} tasks scheduled for today`,
    });
  };

  const handleDiscard = () => {
    setPreviewPlan(null);
    toast.info("Plan discarded");
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className="space-y-4 p-4 rounded-xl bg-gradient-to-br from-white/[0.05] to-white/[0.02] border border-white/[0.08] ring-1 ring-[var(--sl-glow-periwinkle)]/10"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--sl-glow-periwinkle)]/25 to-[var(--sl-glow-cyan)]/15 flex items-center justify-center ring-1 ring-[var(--sl-glow-periwinkle)]/20">
            <Sparkles className="w-4 h-4 text-[var(--sl-glow-periwinkle)]" />
          </div>
          <div>
            <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
              Your Schedule
            </h3>
            <p className="text-[9px] text-[var(--sl-text-muted)] opacity-70" style={{ fontFamily: "var(--font-mono)" }}>
              {scheduledTasks.length} tasks · {plan.systemBlocks.length} breaks
            </p>
          </div>
        </div>
      </div>

      {/* Warnings section */}
      {plan.warnings.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-[var(--sl-glow-amber)] opacity-70" />
            <span className="text-[9px] font-semibold text-[var(--sl-glow-amber)] uppercase tracking-[0.1em]" style={{ fontFamily: "var(--font-heading)" }}>
              Notes
            </span>
          </div>
          <div className="space-y-1.5 pl-1">
            {plan.warnings.map((w, i) => (
              <div key={i} className="flex items-start gap-2 text-[10px] text-[var(--sl-glow-amber)] bg-[var(--sl-glow-amber)]/[0.08] rounded-lg p-2.5 border border-[var(--sl-glow-amber)]/15">
                <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5 opacity-70" />
                <span style={{ fontFamily: "var(--font-body)" }}>{w}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Task list preview */}
      <div className="space-y-1.5">
        <p className="text-[8px] font-semibold text-[var(--sl-text-muted)] uppercase tracking-[0.15em] opacity-60" style={{ fontFamily: "var(--font-heading)" }}>
          Scheduled Tasks
        </p>
        <div className="space-y-1 max-h-48 overflow-y-auto">
          {scheduledTasks.length > 0 ? (
            scheduledTasks.map(task => (
              <TaskMiniCard key={task.id} task={task} />
            ))
          ) : (
            <p className="text-[10px] text-[var(--sl-text-muted)] opacity-50 py-2" style={{ fontFamily: "var(--font-body)" }}>
              No scheduled tasks
            </p>
          )}
        </div>
      </div>

      {/* Unscheduled tasks */}
      {unscheduled.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-[8px] font-semibold text-[var(--sl-text-muted)] uppercase tracking-[0.15em] opacity-60" style={{ fontFamily: "var(--font-heading)" }}>
            Unscheduled
          </p>
          <div className="space-y-1">
            {unscheduled.map(task => (
              <div key={task.id} className="text-[10px] text-[var(--sl-text-muted)] opacity-50" style={{ fontFamily: "var(--font-body)" }}>
                • {task.title}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-2">
        <button
          onClick={handleApply}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-[var(--sl-glow-mint)]/15 hover:bg-[var(--sl-glow-mint)]/25 border border-[var(--sl-glow-mint)]/30 text-[var(--sl-glow-mint)] text-[11px] font-semibold transition-colors"
        >
          <CheckCircle2 className="w-3.5 h-3.5" />
          Apply
        </button>
        <button
          onClick={handleDiscard}
          className="flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-[var(--sl-text-muted)] text-[11px] font-semibold transition-colors"
        >
          <X className="w-3.5 h-3.5" />
          Discard
        </button>
      </div>
    </motion.div>
  );
}

// ─── Task Mini Card ────────────────────────────────────────

function TaskMiniCard({ task }: { task: Task }) {
  const priorityDot: Record<string, string> = {
    high: "bg-red-400/70",
    med: "bg-amber-400/70",
    low: "bg-emerald-400/70",
  };

  const priorityLabel: Record<string, string> = {
    high: "High",
    med: "Medium",
    low: "Low",
  };

  return (
    <div className="flex items-center gap-2.5 py-2 px-2.5 rounded-lg bg-white/[0.02] hover:bg-white/[0.04] transition-colors border border-transparent hover:border-white/[0.06]">
      <span className={`w-2 h-2 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} title={`Priority: ${priorityLabel[task.priority]}`} />
      <span className="text-[10px] text-[var(--sl-text-muted)] flex-shrink-0 w-[50px] tabular-nums font-medium" style={{ fontFamily: "var(--font-mono)" }}>
        {task.startMin > 0 ? minToDisplay(task.startMin) : "—"}
      </span>
      <span className="text-[11px] truncate flex-1 font-medium" style={{ fontFamily: "var(--font-heading)" }}>
        {task.title}
      </span>
      <span className="text-[9px] text-[var(--sl-text-muted)] opacity-70 flex-shrink-0 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {durationDisplay(task.endMin - task.startMin)}
      </span>
      {task.locked && (
        <div title="Fixed time">
          <Clock className="w-3 h-3 text-[var(--sl-text-muted)] opacity-40 flex-shrink-0" />
        </div>
      )}
    </div>
  );
}

// ─── Sleep Options Card ────────────────────────────────────

export function SleepOptionsCard({ options, selectedId, tasks, sleepGoal }: { options: SleepOption[]; selectedId: string | null; tasks?: Task[]; sleepGoal?: number }) {
  const selectSleepOption = useStore(s => s.selectSleepOption);

  const modeConfig: Record<string, { icon: React.ReactNode; color: string; label: string; gradient: string }> = {
    performance: {
      icon: <Zap className="w-4 h-4" />,
      color: "var(--sl-glow-amber)",
      label: "Performance",
      gradient: "from-[var(--sl-glow-amber)]/10 to-transparent",
    },
    balanced: {
      icon: <Battery className="w-4 h-4" />,
      color: "var(--sl-glow-mint)",
      label: "Balanced",
      gradient: "from-[var(--sl-glow-mint)]/10 to-transparent",
    },
    recovery: {
      icon: <Moon className="w-4 h-4" />,
      color: "var(--sl-glow-periwinkle)",
      label: "Recovery",
      gradient: "from-[var(--sl-glow-periwinkle)]/10 to-transparent",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-3"
    >
      <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
        Sleep Priority
      </h3>

      <div className="grid grid-cols-3 gap-2">
        {options.map(opt => {
          const config = modeConfig[opt.mode];
          const isSelected = opt.id === selectedId;

          return (
            <div key={opt.id}>
              <button
                onClick={() => selectSleepOption(opt.id)}
                className={`
                  w-full p-3 rounded-xl transition-all text-center
                  ${isSelected
                    ? `bg-gradient-to-br ${config.gradient} border-2 border-[${config.color}] ring-1 ring-[${config.color}]/20`
                    : "bg-white/5 border border-white/10 hover:border-white/20"
                  }
                `}
              >
                <div className="flex justify-center mb-2">
                  <div style={{ color: config.color }}>
                    {config.icon}
                  </div>
                </div>
                <p className="text-[10px] font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
                  {config.label}
                </p>
                <p className="text-[8px] text-[var(--sl-text-muted)] mt-1 opacity-70" style={{ fontFamily: "var(--font-body)" }}>
                  {minToDisplay(opt.bedtimeMin)}
                </p>
              </button>
              {isSelected && tasks && sleepGoal && (
                <BedtimeExplanation
                  sleepOption={opt}
                  tasks={tasks}
                  sleepGoal={sleepGoal}
                />
              )}
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
