/**
 * ActionCard — Structured AI Output Cards
 * Every meaningful AI response produces these cards:
 * - Plan Preview with Apply/Edit/Discard
 * - Task cards with times
 * - Sleep option cards
 */

import { motion } from "framer-motion";
import { useStore } from "@/lib/store";
import { minToDisplay, durationDisplay } from "@/lib/schemas";
import type { DayPlan, Task, SleepOption } from "@/lib/schemas";
import {
  CheckCircle2, X, Clock, AlertTriangle,
  Zap, Moon, Battery, ArrowRight, Sparkles
} from "lucide-react";
import { toast } from "sonner";

// ─── Plan Preview Card ─────────────────────────────────────

export function PlanPreviewCard({ plan }: { plan: DayPlan }) {
  const applyPlan = useStore(s => s.applyPlan);
  const setPreviewPlan = useStore(s => s.setPreviewPlan);

  const scheduledTasks = plan.tasks.filter(t => t.startMin > 0 || t.endMin > 0);
  const unscheduled = plan.tasks.filter(t => t.startMin === 0 && t.endMin === 0);

  const handleApply = () => {
    applyPlan(plan);
    toast.success("Day plan applied! Your timeline is ready.", {
      description: `${scheduledTasks.length} tasks scheduled across your day`,
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
      className="glass-card p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[var(--sl-glow-periwinkle)]/20 to-[var(--sl-glow-cyan)]/10 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-[var(--sl-glow-periwinkle)]" />
        </div>
        <div>
          <h3 className="text-sm font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            Day Plan Preview
          </h3>
          <p className="text-[9px] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
            {scheduledTasks.length} tasks · {plan.systemBlocks.length} blocks
          </p>
        </div>
      </div>

      {/* Warnings */}
      {plan.warnings.length > 0 && (
        <div className="space-y-1">
          {plan.warnings.map((w, i) => (
            <div key={i} className="flex items-start gap-2 text-[10px] text-[var(--sl-glow-amber)] bg-[var(--sl-glow-amber)]/[0.06] rounded-lg p-2 border border-[var(--sl-glow-amber)]/10">
              <AlertTriangle className="w-3 h-3 flex-shrink-0 mt-0.5" />
              <span>{w}</span>
            </div>
          ))}
        </div>
      )}

      {/* Task list preview */}
      <div className="space-y-0.5 max-h-52 overflow-y-auto">
        {scheduledTasks.map(task => (
          <TaskMiniCard key={task.id} task={task} />
        ))}
      </div>

      {unscheduled.length > 0 && (
        <p className="text-[10px] text-[var(--sl-glow-coral)] flex items-center gap-1">
          <AlertTriangle className="w-3 h-3" />
          {unscheduled.length} task{unscheduled.length > 1 ? "s" : ""} couldn't be scheduled
        </p>
      )}

      {/* Actions */}
      <div className="flex items-center gap-2 pt-1">
        <button
          onClick={handleApply}
          className="flex-1 inline-flex items-center justify-center gap-1.5 py-2.5 px-4 rounded-xl bg-gradient-to-r from-[var(--sl-glow-periwinkle)]/20 to-[var(--sl-glow-cyan)]/15 text-[var(--sl-glow-periwinkle)] hover:from-[var(--sl-glow-periwinkle)]/30 hover:to-[var(--sl-glow-cyan)]/25 border border-[var(--sl-glow-periwinkle)]/15 text-xs font-semibold transition-all"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <CheckCircle2 className="w-3.5 h-3.5" /> Apply Plan
        </button>
        <button
          onClick={handleDiscard}
          className="inline-flex items-center gap-1.5 py-2.5 px-3 rounded-xl bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10 text-xs font-medium transition-colors"
          style={{ fontFamily: "var(--font-heading)" }}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.div>
  );
}

// ─── Task Mini Card ────────────────────────────────────────

function TaskMiniCard({ task }: { task: Task }) {
  const priorityDot: Record<string, string> = {
    high: "bg-red-400",
    med: "bg-amber-400",
    low: "bg-emerald-400",
  };

  return (
    <div className="flex items-center gap-2 py-1.5 px-2 rounded-lg hover:bg-white/[0.03] transition-colors">
      <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${priorityDot[task.priority]}`} />
      <span className="text-[10px] text-[var(--sl-text-muted)] flex-shrink-0 w-[52px] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {task.startMin > 0 ? minToDisplay(task.startMin) : "TBD"}
      </span>
      <span className="text-[11px] truncate flex-1 font-medium" style={{ fontFamily: "var(--font-heading)" }}>
        {task.title}
      </span>
      <span className="text-[9px] text-[var(--sl-text-muted)] opacity-60 tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
        {durationDisplay(task.endMin - task.startMin)}
      </span>
      {task.locked && (
        <Clock className="w-2.5 h-2.5 text-[var(--sl-text-muted)] opacity-40" />
      )}
    </div>
  );
}

// ─── Sleep Options Card ────────────────────────────────────

export function SleepOptionsCard({ options, selectedId }: { options: SleepOption[]; selectedId: string | null }) {
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
      color: "var(--sl-glow-periwinkle)",
      label: "Balanced",
      gradient: "from-[var(--sl-glow-periwinkle)]/10 to-transparent",
    },
    recovery: {
      icon: <Moon className="w-4 h-4" />,
      color: "var(--sl-glow-cyan)",
      label: "Recovery",
      gradient: "from-[var(--sl-glow-cyan)]/10 to-transparent",
    },
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 space-y-3"
    >
      <div className="flex items-center gap-2">
        <Moon className="w-4 h-4 text-[var(--sl-glow-cyan)]" />
        <h3 className="text-xs font-semibold tracking-[0.1em] uppercase" style={{ fontFamily: "var(--font-heading)" }}>
          Tonight's Sleep Options
        </h3>
      </div>

      <div className="space-y-2">
        {options.map(opt => {
          const config = modeConfig[opt.mode];
          const isSelected = opt.id === selectedId;

          return (
            <button
              key={opt.id}
              onClick={() => selectSleepOption(opt.id)}
              className={`
                w-full text-left p-3 rounded-xl transition-all duration-200 bg-gradient-to-r
                ${isSelected
                  ? `${config.gradient} ring-1 ring-white/15`
                  : "from-white/[0.02] to-transparent hover:from-white/[0.04]"
                }
              `}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span style={{ color: config.color }}>{config.icon}</span>
                  <span className="text-xs font-semibold" style={{ fontFamily: "var(--font-heading)", color: config.color }}>
                    {config.label}
                  </span>
                  {isSelected && (
                    <CheckCircle2 className="w-3 h-3 text-[var(--sl-glow-mint)]" />
                  )}
                </div>
                <span className="text-[9px] text-[var(--sl-text-muted)] tabular-nums" style={{ fontFamily: "var(--font-mono)" }}>
                  Energy {opt.predictedEnergy}/10
                </span>
              </div>

              <div className="flex items-center gap-2 text-[11px] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-mono)" }}>
                <span>{minToDisplay(opt.bedtimeMin)}</span>
                <ArrowRight className="w-3 h-3 opacity-40" />
                <span>{minToDisplay(opt.wakeMin)}</span>
                <span className="text-[var(--sl-glow-cyan)]">({opt.sleepDurationHrs}h)</span>
              </div>

              <p className="text-[9px] text-[var(--sl-text-muted)] mt-1.5 leading-relaxed opacity-70">
                {opt.rationale}
              </p>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
