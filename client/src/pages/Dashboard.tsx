/**
 * Dashboard — The Home / Command Center
 * 3-column desktop layout, stacked mobile:
 * - Left: AI Plan Panel + Coach
 * - Center: Real-time Clock Ring + Sleep Options
 * - Right: Today Timeline + Tasks
 */

import { useEffect, useMemo } from "react";
import { useStore, getCurrentBlock, getNextBlock } from "@/lib/store";
import ClockRing from "@/components/ClockRing";
import Timeline from "@/components/Timeline";
import AIPlanPanel from "@/components/AIPlanPanel";
import { SleepOptionsCard } from "@/components/ActionCard";
import { motion } from "framer-motion";
import { Sparkles, Calendar, Activity, CheckCircle2, Timer, Coffee } from "lucide-react";

export default function Dashboard() {
  const todayPlan = useStore(s => s.todayPlan());
  const tickFocus = useStore(s => s.tickFocus);
  const focusTimer = useStore(s => s.focusTimer);
  const user = useStore(s => s.user);

  // Focus timer tick
  useEffect(() => {
    if (!focusTimer || focusTimer.pausedAt) return;
    const id = setInterval(tickFocus, 1000);
    return () => clearInterval(id);
  }, [focusTimer, tickFocus]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Good morning";
    if (h < 17) return "Good afternoon";
    return "Good evening";
  };

  // Compute stats
  const stats = useMemo(() => {
    if (!todayPlan) return null;
    const completed = todayPlan.tasks.filter(t => t.status === "completed").length;
    const total = todayPlan.tasks.length;
    const breaks = todayPlan.systemBlocks.filter(b => b.type === "break" || b.type === "snack").length;
    return { completed, total, breaks };
  }, [todayPlan]);

  return (
    <div className="space-y-5">
      {/* Greeting bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-xl sm:text-2xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            {greeting()}, {user?.name || "Sleeper"}
          </h2>
          <p className="text-xs text-[var(--sl-text-muted)] flex items-center gap-1.5 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </p>
        </div>
        {todayPlan && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[var(--sl-glow-mint)]/10 border border-[var(--sl-glow-mint)]/20"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-[var(--sl-glow-mint)] animate-pulse" />
            <span className="text-[10px] font-semibold text-[var(--sl-glow-mint)]" style={{ fontFamily: "var(--font-heading)" }}>
              Plan Active
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* Stats row — only when plan is active */}
      {stats && todayPlan && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center gap-3 flex-wrap"
        >
          <StatPill
            icon={<CheckCircle2 className="w-3 h-3" />}
            label="Tasks"
            value={`${stats.completed}/${stats.total}`}
            color="var(--sl-glow-periwinkle)"
          />
          <StatPill
            icon={<Coffee className="w-3 h-3" />}
            label="Breaks"
            value={`${stats.breaks}`}
            color="var(--sl-glow-cyan)"
          />
          <StatPill
            icon={<Timer className="w-3 h-3" />}
            label="Focus"
            value={focusTimer ? "Active" : "Idle"}
            color={focusTimer ? "var(--sl-glow-amber)" : "var(--sl-text-muted)"}
          />
          {todayPlan.warnings.length > 0 && (
            <StatPill
              icon={<Activity className="w-3 h-3" />}
              label="Warnings"
              value={`${todayPlan.warnings.length}`}
              color="var(--sl-glow-coral)"
            />
          )}
        </motion.div>
      )}

      {/* 3-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_340px] gap-4 lg:gap-5">
        {/* Left: AI Plan Panel */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 lg:max-h-[calc(100vh-200px)] lg:overflow-hidden flex flex-col order-2 lg:order-1"
        >
          <AIPlanPanel />
        </motion.div>

        {/* Center: Clock Ring + Sleep Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex flex-col items-center gap-6 order-1 lg:order-2"
        >
          <ClockRing />

          {/* Sleep Options — only in center column */}
          {todayPlan && todayPlan.sleepOptions.length > 0 && (
            <div className="w-full max-w-md">
              <SleepOptionsCard
                options={todayPlan.sleepOptions}
                selectedId={todayPlan.selectedSleepOptionId}
              />
            </div>
          )}
        </motion.div>

        {/* Right: Timeline */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4 lg:max-h-[calc(100vh-200px)] lg:overflow-y-auto order-3"
        >
          <Timeline />
        </motion.div>
      </div>
    </div>
  );
}

function StatPill({ icon, label, value, color }: { icon: React.ReactNode; label: string; value: string; color: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06]">
      <span style={{ color }}>{icon}</span>
      <span className="text-[10px] text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
        {label}
      </span>
      <span className="text-[10px] font-semibold" style={{ fontFamily: "var(--font-mono)", color }}>
        {value}
      </span>
    </div>
  );
}
