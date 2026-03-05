/**
 * ManualTaskForm — Modal for creating tasks manually
 * 
 * Allows users to:
 * - Enter task title
 * - Select task type (work, study, exercise, etc.)
 * - Select priority (low, med, high)
 * - Set start time and duration
 * - Toggle locked status
 */

import { useState } from "react";
import { nanoid } from "nanoid";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import type { Task } from "@/lib/schemas";
import { minToDisplay, timeToMin } from "@/lib/schemas";
import { X } from "lucide-react";

interface ManualTaskFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTaskCreate: (task: Task) => void;
}

export default function ManualTaskForm({ open, onOpenChange, onTaskCreate }: ManualTaskFormProps) {
  const [title, setTitle] = useState("");
  const [type, setType] = useState<"work" | "study" | "class" | "exercise" | "commute" | "errand" | "creative" | "social" | "other">("study");
  const [priority, setPriority] = useState<"low" | "med" | "high">("med");
  const [startTime, setStartTime] = useState("09:00");
  const [duration, setDuration] = useState("60");
  const [locked, setLocked] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = () => {
    setError("");

    // Validation
    if (!title.trim()) {
      setError("Task title is required");
      return;
    }

    if (duration === "" || isNaN(Number(duration)) || Number(duration) <= 0) {
      setError("Duration must be a positive number");
      return;
    }

    try {
      const startMin = timeToMin(startTime);
      const durationMin = Math.min(Number(duration), 1440); // Cap at 24 hours
      const endMin = Math.min(startMin + durationMin, 1440);

      if (startMin < 0 || startMin >= 1440) {
        setError("Start time must be between 00:00 and 23:59");
        return;
      }

      if (endMin <= startMin) {
        setError("End time must be after start time");
        return;
      }

      const newTask: Task = {
        id: nanoid(),
        title: title.trim(),
        type,
        priority,
        startMin,
        endMin,
        locked,
        status: "pending",
        notes: "",
      };

      onTaskCreate(newTask);

      // Reset form
      setTitle("");
      setType("study");
      setPriority("med");
      setStartTime("09:00");
      setDuration("60");
      setLocked(false);
      onOpenChange(false);
    } catch (err) {
      setError("Invalid time format. Use HH:MM (24-hour format)");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const endMin = Math.min(timeToMin(startTime) + Number(duration || 0), 1440);
  const endTime = minToDisplay(endMin);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-gradient-to-br from-[var(--sl-bg-dark)] to-[var(--sl-bg-darker)] border border-white/10 shadow-2xl">
        <DialogHeader>
          <DialogTitle className="text-base font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
            Add Task Manually
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Title */}
          <div className="space-y-2">
            <Label htmlFor="task-title" className="text-xs font-medium text-[var(--sl-text-muted)]">
              Task Title *
            </Label>
            <Input
              id="task-title"
              placeholder="e.g., Math homework, Gym session"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              className="bg-white/5 border-white/10 text-sm focus:ring-[var(--sl-glow-periwinkle)]/50"
              autoFocus
            />
          </div>

          {/* Type and Priority */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-type" className="text-xs font-medium text-[var(--sl-text-muted)]">
                Type
              </Label>
              <Select value={type} onValueChange={(v: any) => setType(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--sl-bg-darker)] border-white/10">
                  <SelectItem value="work">Work</SelectItem>
                  <SelectItem value="study">Study</SelectItem>
                  <SelectItem value="class">Class</SelectItem>
                  <SelectItem value="exercise">Exercise</SelectItem>
                  <SelectItem value="commute">Commute</SelectItem>
                  <SelectItem value="errand">Errand</SelectItem>
                  <SelectItem value="creative">Creative</SelectItem>
                  <SelectItem value="social">Social</SelectItem>
                  <SelectItem value="other">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-priority" className="text-xs font-medium text-[var(--sl-text-muted)]">
                Priority
              </Label>
              <Select value={priority} onValueChange={(v: any) => setPriority(v)}>
                <SelectTrigger className="bg-white/5 border-white/10 text-sm h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-[var(--sl-bg-darker)] border-white/10">
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="med">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Time and Duration */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="task-start" className="text-xs font-medium text-[var(--sl-text-muted)]">
                Start Time *
              </Label>
              <Input
                id="task-start"
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="bg-white/5 border-white/10 text-sm focus:ring-[var(--sl-glow-periwinkle)]/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="task-duration" className="text-xs font-medium text-[var(--sl-text-muted)]">
                Duration (min) *
              </Label>
              <Input
                id="task-duration"
                type="number"
                min="5"
                max="1440"
                step="5"
                placeholder="60"
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="bg-white/5 border-white/10 text-sm focus:ring-[var(--sl-glow-periwinkle)]/50"
              />
            </div>
          </div>

          {/* End time display */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <span className="text-xs text-[var(--sl-text-muted)]">End time:</span>
            <span className="text-sm font-medium text-[var(--sl-glow-periwinkle)]" style={{ fontFamily: "var(--font-mono)" }}>
              {endTime}
            </span>
          </div>

          {/* Locked toggle */}
          <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-white/5 border border-white/10">
            <Checkbox
              id="task-locked"
              checked={locked}
              onCheckedChange={(checked) => setLocked(checked as boolean)}
            />
            <Label htmlFor="task-locked" className="text-xs font-medium text-[var(--sl-text-muted)] cursor-pointer">
              Lock this task (cannot be moved)
            </Label>
          </div>

          {/* Error message */}
          {error && (
            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/20">
              <X className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <span className="text-xs text-red-400">{error}</span>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="bg-white/5 border-white/10 text-sm"
          >
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-gradient-to-r from-[var(--sl-glow-periwinkle)] to-[var(--sl-glow-mint)] text-white text-sm font-medium hover:opacity-90"
          >
            Add Task
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
