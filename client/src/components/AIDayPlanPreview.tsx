/**
 * AI Day Plan Preview & Apply Component
 * 
 * Shows generated plan with:
 * - Summary of the plan
 * - List of blocks with times and types
 * - Action buttons (Apply, Regenerate, Cancel)
 * - Warnings if any
 */

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, RefreshCw, X, Zap, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { minToDisplay } from "@/lib/schemas";
// DayPlanResponse type is defined on server side
type DayPlanResponse = {
  summary: string;
  blocks: Array<{
    title: string;
    start: number;
    end: number;
    type: "task" | "break" | "snack" | "wind-down" | "sleep";
    priority: "low" | "med" | "high";
    locked: boolean;
  }>;
  warnings: string[];
};

interface AIDayPlanPreviewProps {
  plan: DayPlanResponse;
  onApply: () => void;
  onRegenerate: () => void;
  onCancel: () => void;
  isApplying?: boolean;
}

const BLOCK_TYPE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  task: { bg: "bg-[var(--sl-glow-periwinkle)]/10", text: "text-[var(--sl-glow-periwinkle)]", icon: "📋" },
  break: { bg: "bg-[var(--sl-glow-cyan)]/10", text: "text-[var(--sl-glow-cyan)]", icon: "☕" },
  snack: { bg: "bg-[var(--sl-glow-mint)]/10", text: "text-[var(--sl-glow-mint)]", icon: "🍎" },
  "wind-down": { bg: "bg-[var(--sl-glow-amber)]/10", text: "text-[var(--sl-glow-amber)]", icon: "🌙" },
  sleep: { bg: "bg-[var(--sl-glow-periwinkle)]/10", text: "text-[var(--sl-glow-periwinkle)]", icon: "😴" },
};

const PRIORITY_COLORS: Record<string, string> = {
  high: "bg-red-500/20 text-red-400",
  med: "bg-amber-500/20 text-amber-400",
  low: "bg-emerald-500/20 text-emerald-400",
};

export default function AIDayPlanPreview({
  plan,
  onApply,
  onRegenerate,
  onCancel,
  isApplying = false,
}: AIDayPlanPreviewProps) {
  const totalMinutes = plan.blocks.reduce((sum: number, b: any) => sum + (b.end - b.start), 0);
  const totalHours = (totalMinutes / 60).toFixed(1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="space-y-4"
    >
      {/* Header */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1">
            <h3 className="text-sm font-bold text-[var(--sl-text)]" style={{ fontFamily: "var(--font-heading)" }}>
              Your Day Plan
            </h3>
            <p className="text-xs text-[var(--sl-text-muted)] mt-1" style={{ fontFamily: "var(--font-body)" }}>
              {plan.summary}
            </p>
          </div>
          <button
            onClick={onCancel}
            disabled={isApplying}
            className="p-1.5 rounded-lg hover:bg-white/[0.05] transition-colors disabled:opacity-50"
          >
            <X className="w-4 h-4 text-[var(--sl-text-muted)]" />
          </button>
        </div>

        {/* Stats */}
        <div className="flex items-center gap-3 flex-wrap">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <Zap className="w-3 h-3 text-[var(--sl-glow-amber)]" />
            <span className="text-[10px] font-mono text-[var(--sl-text-muted)]">
              {plan.blocks.length} blocks
            </span>
          </div>
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/[0.03] border border-white/[0.06]">
            <Clock className="w-3 h-3 text-[var(--sl-glow-cyan)]" />
            <span className="text-[10px] font-mono text-[var(--sl-text-muted)]">
              {totalHours}h scheduled
            </span>
          </div>
        </div>
      </div>

      {/* Warnings */}
      <AnimatePresence>
        {plan.warnings && plan.warnings.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-2"
          >
            {plan.warnings.map((warning: any, i: number) => (
              <div
                key={i}
                className="flex items-start gap-2 p-2.5 rounded-lg bg-[var(--sl-glow-coral)]/10 border border-[var(--sl-glow-coral)]/20"
              >
                <AlertTriangle className="w-3.5 h-3.5 text-[var(--sl-glow-coral)] flex-shrink-0 mt-0.5" />
                <p className="text-[10px] text-[var(--sl-glow-coral)]" style={{ fontFamily: "var(--font-body)" }}>
                  {warning}
                </p>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Blocks list */}
      <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2">
        {plan.blocks.map((block: any, i: number) => {
          const typeConfig = BLOCK_TYPE_COLORS[block.type] || BLOCK_TYPE_COLORS.task;
          const priorityClass = PRIORITY_COLORS[block.priority] || PRIORITY_COLORS.low;
          const duration = block.end - block.start;
          const durationText = duration >= 60 ? `${(duration / 60).toFixed(1)}h` : `${duration}m`;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: i * 0.05 }}
              className={`p-3 rounded-lg border transition-colors ${typeConfig.bg} border-white/[0.08] hover:border-white/[0.12]`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">{typeConfig.icon}</span>
                    <h4 className="text-xs font-semibold text-[var(--sl-text)] truncate" style={{ fontFamily: "var(--font-heading)" }}>
                      {block.title}
                    </h4>
                    {block.locked && (
                      <div title="Fixed time">
                        <Clock className="w-3 h-3 text-[var(--sl-text-muted)] opacity-50 flex-shrink-0" />
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] font-mono text-[var(--sl-text-muted)]">
                      {minToDisplay(block.start)} – {minToDisplay(block.end)}
                    </span>
                    <span className="text-[9px] text-[var(--sl-text-muted)] opacity-60">
                      {durationText}
                    </span>
                  </div>
                </div>
                <div className={`px-2 py-1 rounded text-[9px] font-semibold flex-shrink-0 ${priorityClass}`}>
                  {block.priority}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Action buttons */}
      <div className="flex gap-2 pt-2 border-t border-white/[0.05]">
        <Button
          onClick={onApply}
          disabled={isApplying}
          className="flex-1 bg-[var(--sl-glow-mint)] hover:bg-[var(--sl-glow-mint)]/90 text-slate-900 font-semibold flex items-center justify-center gap-2"
        >
          {isApplying ? (
            <>
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
                <CheckCircle2 className="w-4 h-4" />
              </motion.div>
              <span>Applying...</span>
            </>
          ) : (
            <>
              <CheckCircle2 className="w-4 h-4" />
              <span>Apply Plan</span>
            </>
          )}
        </Button>
        <Button
          onClick={onRegenerate}
          disabled={isApplying}
          variant="outline"
          className="flex-1 border-white/[0.2] hover:bg-white/[0.05] flex items-center justify-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          <span>Regenerate</span>
        </Button>
      </div>

      {/* Footer note */}
      <p className="text-[9px] text-[var(--sl-text-muted)] opacity-60 text-center" style={{ fontFamily: "var(--font-body)" }}>
        You can edit individual tasks after applying the plan
      </p>
    </motion.div>
  );
}
