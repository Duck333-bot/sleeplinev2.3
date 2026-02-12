/**
 * NavHeader — Top navigation bar
 * Glass card with brand, page navigation, and user actions
 */

import { useStore } from "@/lib/store";
import { Moon, LayoutDashboard, History, Settings, LogOut } from "lucide-react";
import { motion } from "framer-motion";

export default function NavHeader() {
  const currentPage = useStore(s => s.currentPage);
  const setPage = useStore(s => s.setPage);
  const user = useStore(s => s.user);
  const resetAll = useStore(s => s.resetAll);

  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "history" as const, label: "History", icon: History },
    { id: "settings" as const, label: "Settings", icon: Settings },
  ];

  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card px-4 py-2.5 flex items-center justify-between"
    >
      {/* Brand */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[var(--sl-glow-periwinkle)] to-[var(--sl-glow-cyan)] flex items-center justify-center">
          <Moon className="w-4 h-4 text-white" />
        </div>
        <div>
          <h1 className="text-sm font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            Sleepline
          </h1>
          <p className="text-[9px] text-[var(--sl-text-muted)] tracking-widest uppercase" style={{ fontFamily: "var(--font-heading)" }}>
            Daily Command Center
          </p>
        </div>
      </div>

      {/* Nav items */}
      <nav className="hidden sm:flex items-center gap-1">
        {navItems.map(item => {
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`
                flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${isActive
                  ? "bg-white/[0.08] text-[var(--sl-text)]"
                  : "text-[var(--sl-text-muted)] hover:text-[var(--sl-text)] hover:bg-white/[0.04]"
                }
              `}
              style={{ fontFamily: "var(--font-heading)" }}
            >
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* User actions */}
      <div className="flex items-center gap-2">
        {user && (
          <span className="text-[10px] text-[var(--sl-text-muted)] hidden sm:block" style={{ fontFamily: "var(--font-mono)" }}>
            {user.name}
          </span>
        )}
        {/* Mobile nav */}
        <div className="flex sm:hidden items-center gap-1">
          {navItems.map(item => {
            const isActive = currentPage === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setPage(item.id)}
                className={`p-2 rounded-lg transition-all ${isActive ? "bg-white/[0.08] text-[var(--sl-text)]" : "text-[var(--sl-text-muted)]"}`}
              >
                <item.icon className="w-4 h-4" />
              </button>
            );
          })}
        </div>
        <button
          onClick={() => {
            if (confirm("Reset all data? This cannot be undone.")) {
              resetAll();
              window.location.reload();
            }
          }}
          className="p-2 rounded-lg text-[var(--sl-text-muted)] hover:text-[var(--sl-glow-coral)] hover:bg-white/[0.04] transition-all"
          title="Reset all data"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>
      </div>
    </motion.header>
  );
}
