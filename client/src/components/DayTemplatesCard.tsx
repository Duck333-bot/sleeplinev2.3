/**
 * Day Templates Card — Quick schedule setup
 * Displays 3 template buttons for instant day structure
 */

import { useState } from "react";
import { useStore } from "@/lib/store";
import {
  ALL_TEMPLATES,
  templateToBlocks,
  getTemplateTimeSummary,
  type TemplateType,
} from "@/lib/day-templates";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { motion } from "framer-motion";

export default function DayTemplatesCard() {
  const todayPlan = useStore(s => s.todayPlan());
  const applyTemplate = useStore(s => s.applyTemplate);
  const [selectedTemplate, setSelectedTemplate] = useState<TemplateType | null>(null);
  const [showConfirm, setShowConfirm] = useState(false);

  const hasExistingTasks = (todayPlan?.tasks?.length ?? 0) > 0 || (todayPlan?.systemBlocks?.length ?? 0) > 0;

  const handleTemplateClick = (templateId: TemplateType) => {
    if (hasExistingTasks) {
      // Show confirmation modal if there are existing tasks
      setSelectedTemplate(templateId);
      setShowConfirm(true);
    } else {
      // Apply directly if no existing tasks
      applyTemplate(templateId);
    }
  };

  const handleConfirm = () => {
    if (selectedTemplate) {
      applyTemplate(selectedTemplate);
      setShowConfirm(false);
      setSelectedTemplate(null);
    }
  };

  const handleCancel = () => {
    setShowConfirm(false);
    setSelectedTemplate(null);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-4 rounded-xl bg-white/[0.02] border border-white/10 backdrop-blur-sm"
      >
        <div className="mb-3">
          <h3 className="text-xs font-semibold tracking-[0.15em] uppercase text-[var(--sl-text-muted)]" style={{ fontFamily: "var(--font-heading)" }}>
            Quick Start
          </h3>
          <p className="text-[10px] text-[var(--sl-text-muted)]/60 mt-1">
            Generate a full day in one tap
          </p>
        </div>

        <div className="grid grid-cols-3 gap-2">
          {ALL_TEMPLATES.map(template => (
            <button
              key={template.id}
              onClick={() => handleTemplateClick(template.id as TemplateType)}
              className="
                flex flex-col items-center justify-center gap-1.5 p-3 rounded-lg
                bg-white/[0.03] hover:bg-white/[0.06] border border-white/5 hover:border-white/10
                transition-all duration-200 cursor-pointer group
              "
              title={getTemplateTimeSummary(template)}
            >
              <span className="text-lg group-hover:scale-110 transition-transform">
                {template.icon}
              </span>
              <span className="text-[10px] font-medium text-[var(--sl-text-muted)] text-center leading-tight">
                {template.name}
              </span>
            </button>
          ))}
        </div>
      </motion.div>

      {/* Confirmation Modal */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent className="bg-slate-950 border border-white/10">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-white">Replace Today's Plan?</AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400">
              You already have tasks scheduled. Applying this template will replace your current plan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="flex gap-3 justify-end">
            <AlertDialogCancel onClick={handleCancel} className="bg-white/5 hover:bg-white/10 text-white border-white/10">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm} className="bg-amber-400 hover:bg-amber-500 text-slate-900">
              Replace
            </AlertDialogAction>
          </div>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
