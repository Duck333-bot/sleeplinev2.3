/**
 * History — Sleep + Plan History
 * Shows past check-ins and plans with stats
 */

import { useStore } from "@/lib/store";
import { minToDisplay, durationDisplay } from "@/lib/schemas";
import { motion } from "framer-motion";
import { Moon, Zap, Brain, Calendar, TrendingUp, BarChart3 } from "lucide-react";

export default function HistoryPage() {
  const checkIns = useStore(s => s.checkIns);
  const plans = useStore(s => s.plans);

  const sortedCheckIns = [...checkIns].sort((a, b) => b.date.localeCompare(a.date));
  const appliedPlans = plans.filter(p => p.appliedAt !== null);

  // Stats
  const avgSleep = checkIns.length > 0
    ? (checkIns.reduce((sum, c) => sum + c.sleepHours, 0) / checkIns.length).toFixed(1)
    : "—";
  const avgQuality = checkIns.length > 0
    ? (checkIns.reduce((sum, c) => sum + c.sleepQuality, 0) / checkIns.length).toFixed(1)
    : "—";
  const avgEnergy = checkIns.length > 0
    ? (checkIns.reduce((sum, c) => sum + c.morningEnergy, 0) / checkIns.length).toFixed(1)
    : "—";
  const totalPlans = appliedPlans.length;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          History & Insights
        </h2>
        <p className="text-xs text-[var(--sl-text-muted)]">
          Track your sleep patterns and daily plans over time.
        </p>
      </motion.div>

      {/* Stats cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={<Moon className="w-4 h-4" />} label="Avg Sleep" value={`${avgSleep}h`} color="var(--sl-glow-cyan)" />
        <StatCard icon={<TrendingUp className="w-4 h-4" />} label="Avg Quality" value={`${avgQuality}/5`} color="var(--sl-glow-periwinkle)" />
        <StatCard icon={<Zap className="w-4 h-4" />} label="Avg Energy" value={`${avgEnergy}/5`} color="var(--sl-glow-amber)" />
        <StatCard icon={<BarChart3 className="w-4 h-4" />} label="Plans Made" value={`${totalPlans}`} color="var(--sl-glow-mint)" />
      </div>

      {/* Check-in history */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
          <Calendar className="w-4 h-4 text-[var(--sl-glow-periwinkle)]" />
          Check-in History
        </h3>

        {sortedCheckIns.length === 0 ? (
          <p className="text-xs text-[var(--sl-text-muted)] py-6 text-center">
            No check-ins yet. Complete your first morning check-in to start tracking.
          </p>
        ) : (
          <div className="space-y-2">
            {sortedCheckIns.map((ci, idx) => (
              <motion.div
                key={ci.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
              >
                <div className="flex-shrink-0">
                  <span className="text-xs font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                    {new Date(ci.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-3 text-[10px] text-[var(--sl-text-muted)]">
                  <span className="flex items-center gap-1">
                    <Moon className="w-3 h-3 text-[var(--sl-glow-cyan)]" />
                    {ci.sleepHours}h
                  </span>
                  <span className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-[var(--sl-glow-periwinkle)]" />
                    Q{ci.sleepQuality}
                  </span>
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3 text-[var(--sl-glow-amber)]" />
                    E{ci.morningEnergy}
                  </span>
                  <span className="flex items-center gap-1">
                    <Brain className="w-3 h-3 text-[var(--sl-glow-coral)]" />
                    S{ci.stressLevel}
                  </span>
                </div>
                <span className="text-[10px] text-[var(--sl-text-muted)] capitalize" style={{ fontFamily: "var(--font-heading)" }}>
                  {ci.workload}
                </span>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Plan history */}
      <div className="glass-card p-4">
        <h3 className="text-sm font-semibold mb-3 flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
          <BarChart3 className="w-4 h-4 text-[var(--sl-glow-mint)]" />
          Plan History
        </h3>

        {appliedPlans.length === 0 ? (
          <p className="text-xs text-[var(--sl-text-muted)] py-6 text-center">
            No plans applied yet. Create and apply your first day plan.
          </p>
        ) : (
          <div className="space-y-2">
            {[...appliedPlans].sort((a, b) => b.date.localeCompare(a.date)).map((plan, idx) => {
              const completed = plan.tasks.filter(t => t.status === "completed").length;
              const total = plan.tasks.length;
              return (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors"
                >
                  <span className="text-xs font-medium flex-shrink-0" style={{ fontFamily: "var(--font-mono)" }}>
                    {new Date(plan.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  </span>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-[10px] text-[var(--sl-text-muted)]">
                      <span>{total} tasks</span>
                      <span>·</span>
                      <span>{completed} completed</span>
                      <span>·</span>
                      <span>{plan.systemBlocks.length} blocks</span>
                    </div>
                    <div className="mt-1 h-1 rounded-full bg-white/5 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-[var(--sl-glow-periwinkle)] to-[var(--sl-glow-mint)]"
                        style={{ width: total > 0 ? `${(completed / total) * 100}%` : "0%" }}
                      />
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-3 text-center"
    >
      <div className="flex items-center justify-center mb-1.5" style={{ color }}>
        {icon}
      </div>
      <p className="text-lg font-bold" style={{ fontFamily: "var(--font-mono)", color }}>
        {value}
      </p>
      <p className="text-[10px] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
        {label}
      </p>
    </motion.div>
  );
}
