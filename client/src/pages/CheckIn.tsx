/**
 * CheckIn — Daily Sleep Check-in
 * Captures: sleep hours, quality, energy, caffeine, stress, workload
 * Beautiful rating UI with celestial theme
 */

import { useState } from "react";
import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import { Moon, Sun, Zap, Brain, Coffee, Briefcase, ArrowRight, SkipForward } from "lucide-react";
import { toast } from "sonner";

const CHECKIN_IMG = "https://private-us-east-1.manuscdn.com/sessionFile/hMkM5ef4lOzWk8WsKovwyH/sandbox/zmFmmK5TWQ1GOXTj3FQ5lV-img-3_1770930524000_na1fn_Y2hlY2tpbi1iZw.png?x-oss-process=image/resize,w_1920,h_1920/format,webp/quality,q_80&Expires=1798761600&Policy=eyJTdGF0ZW1lbnQiOlt7IlJlc291cmNlIjoiaHR0cHM6Ly9wcml2YXRlLXVzLWVhc3QtMS5tYW51c2Nkbi5jb20vc2Vzc2lvbkZpbGUvaE1rTTVlZjRsT3pXazhXc0tvdnd5SC9zYW5kYm94L3ptRm1tSzVUV1ExR09YVGozRlE1bFYtaW1nLTNfMTc3MDkzMDUyNDAwMF9uYTFmbl9ZMmhsWTJ0cGJpMWlady5wbmc~eC1vc3MtcHJvY2Vzcz1pbWFnZS9yZXNpemUsd18xOTIwLGhfMTkyMC9mb3JtYXQsd2VicC9xdWFsaXR5LHFfODAiLCJDb25kaXRpb24iOnsiRGF0ZUxlc3NUaGFuIjp7IkFXUzpFcG9jaFRpbWUiOjE3OTg3NjE2MDB9fX1dfQ__&Key-Pair-Id=K2HSFNDJXOU9YS&Signature=j05a6SRW0IJczYd31tNcY0yuMJmNkRdOQdAhHAIbsi2m8VIHZRYzFkKeYgX5fNWNs1VIeOwx4BQAAFuj8KhLMg3fSu459LfJJ6UoCXZG1J~clmAoZqwS3tMTe-SIow61TDKmxOaTCH-NplDDACk2AeKpUHR~qqckB2qwNdnkFZmRXpC9bfayXYqrs47ZxnWP0MHfqGmmO78eR20y7C68Md8EdXXARNQX3uI~nTL3D927zFPJLvdtzQKuAR-Muw-wKLxObJPutJjQLjNrSCLBt1EiXZZNfdfoG19nScuJgqxV~ZW7S42UM53jKtRvHtQd0roP2t188he~HKKusaJCIg__";

export default function CheckInPage() {
  const addCheckIn = useStore(s => s.addCheckIn);
  const setPage = useStore(s => s.setPage);
  const todayCheckIn = useStore(s => s.todayCheckIn());

  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(3);
  const [morningEnergy, setMorningEnergy] = useState(3);
  const [caffeineToday, setCaffeineToday] = useState(false);
  const [stressLevel, setStressLevel] = useState(3);
  const [workload, setWorkload] = useState<"light" | "moderate" | "heavy">("moderate");

  // If already checked in today, go to dashboard
  if (todayCheckIn) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="glass-card p-8 text-center max-w-md"
        >
          <Sun className="w-12 h-12 text-[var(--sl-glow-amber)] mx-auto mb-4" />
          <h2 className="text-lg font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
            Already Checked In
          </h2>
          <p className="text-sm text-[var(--sl-text-muted)] mb-4">
            You've already completed today's check-in. Head to the dashboard to plan your day.
          </p>
          <button
            onClick={() => setPage("dashboard")}
            className="pill-btn bg-[var(--sl-glow-periwinkle)]/15 text-[var(--sl-glow-periwinkle)] hover:bg-[var(--sl-glow-periwinkle)]/25"
          >
            Go to Dashboard <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </motion.div>
      </div>
    );
  }

  const handleSubmit = () => {
    addCheckIn({
      date: new Date().toISOString().slice(0, 10),
      sleepHours,
      sleepQuality,
      morningEnergy,
      caffeineToday,
      stressLevel,
      workload,
    });
    toast.success("Check-in saved! Let's plan your day.");
    setPage("dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-lg"
      >
        <div className="glass-card p-6 sm:p-8 space-y-6">
          {/* Header */}
          <div className="text-center">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[var(--sl-glow-amber)] to-[var(--sl-glow-periwinkle)] flex items-center justify-center mx-auto mb-3">
              <Sun className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-bold" style={{ fontFamily: "var(--font-heading)" }}>
              Good Morning Check-in
            </h2>
            <p className="text-xs text-[var(--sl-text-muted)] mt-1">
              How did you sleep? This helps optimize your day.
            </p>
          </div>

          {/* Sleep Hours */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs text-[var(--sl-text-muted)] flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
                <Moon className="w-3.5 h-3.5 text-[var(--sl-glow-cyan)]" /> Hours Slept
              </label>
              <span className="text-sm font-medium" style={{ fontFamily: "var(--font-mono)" }}>
                {sleepHours}h
              </span>
            </div>
            <input
              type="range"
              min={0} max={14} step={0.5}
              value={sleepHours}
              onChange={e => setSleepHours(parseFloat(e.target.value))}
              className="w-full accent-[var(--sl-glow-cyan)]"
            />
          </div>

          {/* Sleep Quality */}
          <RatingRow
            label="Sleep Quality"
            icon={<Moon className="w-3.5 h-3.5 text-[var(--sl-glow-periwinkle)]" />}
            value={sleepQuality}
            onChange={setSleepQuality}
            labels={["Terrible", "Poor", "Okay", "Good", "Excellent"]}
          />

          {/* Morning Energy */}
          <RatingRow
            label="Morning Energy"
            icon={<Zap className="w-3.5 h-3.5 text-[var(--sl-glow-amber)]" />}
            value={morningEnergy}
            onChange={setMorningEnergy}
            labels={["Exhausted", "Low", "Moderate", "Energized", "Peak"]}
          />

          {/* Stress Level */}
          <RatingRow
            label="Stress Level"
            icon={<Brain className="w-3.5 h-3.5 text-[var(--sl-glow-coral)]" />}
            value={stressLevel}
            onChange={setStressLevel}
            labels={["Calm", "Mild", "Moderate", "High", "Overwhelmed"]}
          />

          {/* Workload */}
          <div>
            <label className="text-xs text-[var(--sl-text-muted)] flex items-center gap-1.5 mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              <Briefcase className="w-3.5 h-3.5 text-[var(--sl-text-muted)]" /> Today's Workload
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["light", "moderate", "heavy"] as const).map(w => (
                <button
                  key={w}
                  onClick={() => setWorkload(w)}
                  className={`p-2 rounded-xl text-xs font-medium capitalize transition-all ${
                    workload === w
                      ? "bg-[var(--sl-glow-periwinkle)]/10 ring-1 ring-[var(--sl-glow-periwinkle)]/30 text-[var(--sl-glow-periwinkle)]"
                      : "bg-white/[0.03] text-[var(--sl-text-muted)] hover:bg-white/[0.05]"
                  }`}
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Caffeine */}
          <label className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] cursor-pointer">
            <input
              type="checkbox"
              checked={caffeineToday}
              onChange={e => setCaffeineToday(e.target.checked)}
              className="rounded accent-[var(--sl-glow-periwinkle)]"
            />
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-[var(--sl-text-muted)]" />
              <span className="text-sm">Planning to have caffeine today</span>
            </div>
          </label>

          {/* Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleSubmit}
              className="flex-1 pill-btn bg-gradient-to-r from-[var(--sl-glow-periwinkle)] to-[var(--sl-glow-cyan)] text-white hover:opacity-90 justify-center py-3"
            >
              Save & Plan My Day <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setPage("dashboard")}
              className="pill-btn bg-white/5 text-[var(--sl-text-muted)] hover:bg-white/10"
            >
              <SkipForward className="w-3.5 h-3.5" /> Skip
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function RatingRow({
  label, icon, value, onChange, labels
}: {
  label: string;
  icon: React.ReactNode;
  value: number;
  onChange: (v: number) => void;
  labels: string[];
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs text-[var(--sl-text-muted)] flex items-center gap-1.5" style={{ fontFamily: "var(--font-heading)" }}>
          {icon} {label}
        </label>
        <span className="text-[10px] text-[var(--sl-text-muted)]">{labels[value - 1]}</span>
      </div>
      <div className="flex items-center gap-1.5">
        {[1, 2, 3, 4, 5].map(n => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={`flex-1 h-8 rounded-lg text-xs font-medium transition-all ${
              n <= value
                ? "bg-[var(--sl-glow-periwinkle)]/20 text-[var(--sl-glow-periwinkle)]"
                : "bg-white/[0.03] text-[var(--sl-text-muted)] hover:bg-white/[0.05]"
            }`}
            style={{ fontFamily: "var(--font-mono)" }}
          >
            {n}
          </button>
        ))}
      </div>
    </div>
  );
}
