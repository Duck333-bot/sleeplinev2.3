/**
 * Sleepline — App Root
 * Celestial Observatory Design System
 * Dark-first, dreamy UI with aurora background
 */

import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useStore } from "@/lib/store";
import { useEffect } from "react";
import { scheduleReminders, clearAllNotifications } from "@/lib/notifications";

// Pages
import OnboardingPage from "@/pages/Onboarding";
import CheckInPage from "@/pages/CheckIn";
import Dashboard from "@/pages/Dashboard";
import HistoryPage from "@/pages/HistoryPage";
import SettingsPage from "@/pages/SettingsPage";
import NavHeader from "@/components/NavHeader";
function AppContent() {
  const currentPage = useStore(s => s.currentPage);
  const user = useStore(s => s.user);
  const todayPlan = useStore(s => s.todayPlan());

  // Auto-redirect logic
  useEffect(() => {
    if (!user) {
      useStore.getState().setPage("onboarding");
    }
  }, [user]);

  // Schedule notifications when plan changes
  useEffect(() => {
    if (todayPlan && user) {
      scheduleReminders(todayPlan, user.reminderSettings);
    }
    return () => clearAllNotifications();
  }, [todayPlan, user]);

  // Determine which page to show
  const page = !user ? "onboarding" : currentPage;

  // make sure to consider if you need authentication for certain routes
  return (
    <div className="min-h-screen relative">
      {/* Aurora background */}
      <div className="aurora-bg" />

      {/* Noise overlay */}
      <div className="noise-overlay" />

      {/* Content */}
      <div className="relative z-10 min-h-screen">
        {page !== "onboarding" && page !== "checkin" && (
          <div className="container pt-4 pb-2">
            <NavHeader />
          </div>
        )}

        <main className={`container ${page !== "onboarding" && page !== "checkin" ? "pt-4 pb-8" : ""}`}>
          {page === "onboarding" && <OnboardingPage />}
          {page === "checkin" && <CheckInPage />}
          {page === "dashboard" && <Dashboard />}
          {page === "history" && <HistoryPage />}
          {page === "settings" && <SettingsPage />}
        </main>
      </div>
    </div>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <TooltipProvider>
          <Toaster
            position="top-right"
            toastOptions={{
              style: {
                background: "rgba(15, 24, 63, 0.9)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                color: "#e9f1fb",
                backdropFilter: "blur(20px)",
                fontFamily: "'DM Sans', system-ui, sans-serif",
              },
            }}
          />
          <AppContent />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
