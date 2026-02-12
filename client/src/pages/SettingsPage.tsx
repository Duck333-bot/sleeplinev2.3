/**
 * Settings — Reminders, Timezone, Goals, Notification Toggles
 */

import { useStore } from "@/lib/store";
import { motion } from "framer-motion";
import {
  Bell, Clock, Moon, Sun, Globe, Target,
  Volume2, VolumeX, Save
} from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function SettingsPage() {
  const user = useStore(s => s.user);
  const updateReminderSettings = useStore(s => s.updateReminderSettings);
  const updateOnboarding = useStore(s => s.updateOnboarding);
  const setUser = useStore(s => s.setUser);

  const [name, setName] = useState(user?.name || "");

  if (!user) return null;

  const rs = user.reminderSettings;
  const ob = user.onboarding;

  const handleSaveName = () => {
    if (user) {
      setUser({ ...user, name });
      toast.success("Name updated");
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window) {
      const permission = await Notification.requestPermission();
      if (permission === "granted") {
        toast.success("Notifications enabled!");
      } else {
        toast.error("Notification permission denied");
      }
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <h2 className="text-lg font-bold mb-1" style={{ fontFamily: "var(--font-heading)" }}>
          Settings
        </h2>
        <p className="text-xs text-[var(--sl-text-muted)]">
          Customize your Sleepline experience.
        </p>
      </motion.div>

      {/* Profile */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
          <Globe className="w-4 h-4 text-[var(--sl-glow-periwinkle)]" />
          Profile
        </h3>
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/30"
            placeholder="Your name"
          />
          <button
            onClick={handleSaveName}
            className="pill-btn bg-[var(--sl-glow-periwinkle)]/15 text-[var(--sl-glow-periwinkle)]"
          >
            <Save className="w-3.5 h-3.5" /> Save
          </button>
        </div>
        <div className="text-xs text-[var(--sl-text-muted)] flex items-center gap-2">
          <Clock className="w-3 h-3" />
          Timezone: {user.timezone}
        </div>
      </div>

      {/* Sleep Preferences */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
          <Moon className="w-4 h-4 text-[var(--sl-glow-cyan)]" />
          Sleep Preferences
        </h3>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-[var(--sl-text-muted)] mb-1 block" style={{ fontFamily: "var(--font-heading)" }}>
              Bedtime
            </label>
            <input
              type="time"
              value={ob.preferredBedtime}
              onChange={e => updateOnboarding({ preferredBedtime: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/30"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
          <div>
            <label className="text-xs text-[var(--sl-text-muted)] mb-1 block" style={{ fontFamily: "var(--font-heading)" }}>
              Wake Time
            </label>
            <input
              type="time"
              value={ob.preferredWakeTime}
              onChange={e => updateOnboarding({ preferredWakeTime: e.target.value })}
              className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-[var(--sl-glow-periwinkle)]/30"
              style={{ fontFamily: "var(--font-mono)" }}
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-[var(--sl-text-muted)] mb-1 block" style={{ fontFamily: "var(--font-heading)" }}>
            Sleep Goal: {ob.sleepGoalHrs}h
          </label>
          <input
            type="range"
            min={4} max={12} step={0.5}
            value={ob.sleepGoalHrs}
            onChange={e => updateOnboarding({ sleepGoalHrs: parseFloat(e.target.value) })}
            className="w-full accent-[var(--sl-glow-cyan)]"
          />
        </div>
      </div>

      {/* Notifications */}
      <div className="glass-card p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
            <Bell className="w-4 h-4 text-[var(--sl-glow-amber)]" />
            Notifications
          </h3>
          <button
            onClick={requestNotificationPermission}
            className="text-[10px] pill-btn bg-[var(--sl-glow-amber)]/10 text-[var(--sl-glow-amber)]"
          >
            Enable Browser Notifications
          </button>
        </div>

        <ToggleRow
          label="Wind-down Reminder"
          description={`${rs.windDownMinsBefore} min before bedtime`}
          icon={<Moon className="w-3.5 h-3.5 text-[var(--sl-glow-cyan)]" />}
          checked={rs.windDownReminder}
          onChange={v => updateReminderSettings({ windDownReminder: v })}
        />
        <ToggleRow
          label="Bedtime Reminder"
          description="At your selected bedtime"
          icon={<Moon className="w-3.5 h-3.5 text-[var(--sl-glow-periwinkle)]" />}
          checked={rs.bedtimeReminder}
          onChange={v => updateReminderSettings({ bedtimeReminder: v })}
        />
        <ToggleRow
          label="Next Task Reminder"
          description={`${rs.nextTaskMinsBefore} min before each task`}
          icon={<Clock className="w-3.5 h-3.5 text-[var(--sl-glow-amber)]" />}
          checked={rs.nextTaskReminder}
          onChange={v => updateReminderSettings({ nextTaskReminder: v })}
        />
      </div>

      {/* Day Preferences */}
      <div className="glass-card p-4 space-y-3">
        <h3 className="text-sm font-semibold flex items-center gap-2" style={{ fontFamily: "var(--font-heading)" }}>
          <Target className="w-4 h-4 text-[var(--sl-glow-mint)]" />
          Day Preferences
        </h3>
        <div>
          <label className="text-xs text-[var(--sl-text-muted)] mb-2 block" style={{ fontFamily: "var(--font-heading)" }}>
            Break Frequency
          </label>
          <div className="grid grid-cols-4 gap-2">
            {(["every-30m", "every-60m", "every-90m", "none"] as const).map(opt => (
              <button
                key={opt}
                onClick={() => updateOnboarding({ breakFrequency: opt })}
                className={`p-2 rounded-xl text-[10px] font-medium transition-all ${
                  ob.breakFrequency === opt
                    ? "bg-[var(--sl-glow-periwinkle)]/10 ring-1 ring-[var(--sl-glow-periwinkle)]/30 text-[var(--sl-glow-periwinkle)]"
                    : "bg-white/[0.03] text-[var(--sl-text-muted)] hover:bg-white/[0.05]"
                }`}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {opt === "none" ? "None" : opt.replace("every-", "").toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  label, description, icon, checked, onChange
}: {
  label: string;
  description: string;
  icon: React.ReactNode;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex items-center justify-between p-3 rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-colors cursor-pointer">
      <div className="flex items-center gap-2.5">
        {icon}
        <div>
          <span className="text-sm font-medium block" style={{ fontFamily: "var(--font-heading)" }}>{label}</span>
          <span className="text-[10px] text-[var(--sl-text-muted)]">{description}</span>
        </div>
      </div>
      <div
        className={`w-10 h-5 rounded-full transition-colors relative ${
          checked ? "bg-[var(--sl-glow-periwinkle)]" : "bg-white/10"
        }`}
        onClick={(e) => { e.preventDefault(); onChange(!checked); }}
      >
        <div
          className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${
            checked ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );
}
