/**
 * Home page — SEO-optimized landing page
 * Displays when user is not authenticated or on initial load
 */

import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Moon, Zap, BarChart3, Clock } from "lucide-react";

export default function Home() {
  const { user } = useAuth();

  // If user is authenticated, show nothing (App.tsx will redirect to dashboard)
  if (user) {
    return null;
  }

  return (
    <div className="min-h-screen relative">
      {/* Aurora background */}
      <div className="aurora-bg" />
      <div className="noise-overlay" />

      {/* Content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero Section */}
        <div className="flex-1 flex items-center justify-center px-4 py-12">
          <div className="max-w-2xl text-center">
            {/* Logo */}
            <img
              src="https://files.manuscdn.com/user_upload_by_module/session_file/310519663348473965/FDucuNzKCkcLrRaH.png"
              alt="Sleepline logo"
              className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-8"
            />

            {/* H1 - Main heading for SEO */}
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Sleepline
            </h1>

            <p className="text-xl md:text-2xl text-periwinkle mb-8 font-light">
              Your AI-powered daily command center for better sleep and productivity
            </p>

            <p className="text-base md:text-lg text-slate-300 mb-12 max-w-xl mx-auto leading-relaxed">
              Plan your day with AI, track your sleep patterns, and optimize your schedule for peak performance. 
              Sleepline converts your goals into structured daily plans with real-time tracking.
            </p>

            {/* CTA Button */}
            <a href={getLoginUrl()}>
              <Button size="lg" className="bg-amber-400 hover:bg-amber-500 text-slate-900 font-semibold px-8 py-6 text-lg">
                Start Your Journey
              </Button>
            </a>
          </div>
        </div>

        {/* Features Section */}
        <div className="py-16 px-4">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-3xl font-bold text-white mb-12 text-center">
              Why Sleepline?
            </h2>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Feature 1 */}
              <div className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-md hover:border-amber-400/50 transition-colors">
                <div className="mb-4 p-3 bg-amber-400/10 rounded-lg w-fit">
                  <Zap className="w-6 h-6 text-amber-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">AI Planning</h3>
                <p className="text-sm text-slate-300">
                  Convert natural language into structured daily schedules instantly
                </p>
              </div>

              {/* Feature 2 */}
              <div className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-md hover:border-cyan-400/50 transition-colors">
                <div className="mb-4 p-3 bg-cyan-400/10 rounded-lg w-fit">
                  <Moon className="w-6 h-6 text-cyan-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Sleep Tracking</h3>
                <p className="text-sm text-slate-300">
                  Monitor sleep quality, duration, and energy levels daily
                </p>
              </div>

              {/* Feature 3 */}
              <div className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-md hover:border-periwinkle/50 transition-colors">
                <div className="mb-4 p-3 bg-periwinkle/10 rounded-lg w-fit">
                  <Clock className="w-6 h-6 text-periwinkle" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Real-time Clock</h3>
                <p className="text-sm text-slate-300">
                  Visual timeline with live countdown to your next task
                </p>
              </div>

              {/* Feature 4 */}
              <div className="glass-card p-6 rounded-xl border border-white/10 backdrop-blur-md hover:border-emerald-400/50 transition-colors">
                <div className="mb-4 p-3 bg-emerald-400/10 rounded-lg w-fit">
                  <BarChart3 className="w-6 h-6 text-emerald-400" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">Analytics</h3>
                <p className="text-sm text-slate-300">
                  Visualize sleep trends and productivity patterns over time
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="py-8 px-4 text-center text-slate-400 text-sm border-t border-white/5">
          <p>
            Sleepline — Your AI-powered daily command center for sleep optimization and productivity
          </p>
        </footer>
      </div>
    </div>
  );
}
