# Sleepline — Daily Command Center TODO

## Core Features
- [x] Onboarding survey (multi-step: name, sleep prefs, chronotype, goals)
- [x] Daily check-in form (sleep hours, quality, energy, stress, workload)
- [x] Dashboard 3-column layout (AI panel, clock ring, timeline)
- [x] Real-time clock ring with day progress and current block highlight
- [x] Now/Next countdown display
- [x] Bedtime/wake options (Performance/Balanced/Recovery)
- [x] Today timeline with tasks + system blocks
- [x] AI Plan panel with structured action cards (preview/apply/discard)
- [x] Quick action buttons: Done, Snooze 10m
- [x] Focus timer (start/pause/stop)
- [x] Smart text parser for natural language day descriptions
- [x] Deterministic scheduler (assigns times, inserts breaks/snacks/wind-down)
- [x] Zod schemas for Task, SystemBlock, SleepOption, DayPlan
- [x] History page (check-in + plan history with stats)
- [x] Settings page (profile, sleep prefs, notifications, day prefs)
- [x] Browser notification service (wind-down, bedtime, next-task reminders)
- [x] Dreamy dark UI with aurora background, glass cards, noise overlay
- [x] Responsive design (3 columns desktop, stacked mobile)
- [x] Smooth animations with prefers-reduced-motion support

## Backend Integration (web-db-user upgrade)
- [x] Create server-side AI planning endpoint using invokeLLM
- [x] Create database tables for plans, check-ins, tasks, sleep options
- [x] Wire AI planner to use server-side LLM instead of client-side API calls
- [x] Add tRPC procedures for plan CRUD, check-in CRUD
- [x] Fix Home.tsx conflict from upgrade
- [x] Write vitest tests for scheduler and AI planning (20 tests passing)
- [x] Create README with setup instructions


## Critical Bug Fixes (Scheduling)

- [ ] Audit task parsing logic for natural language time conversion (e.g., "4:00-5:00 PM", "30m after school")
- [ ] Fix state management to ensure immutability and proper task merging
- [ ] Add validation to prevent overlapping tasks from corrupting timeline
- [ ] Implement defensive logic so new tasks append/update without deleting existing entries
- [ ] Add logging around task creation, update, delete events
- [ ] Verify tasks use stable unique IDs and aren't overwritten by index-based updates
- [ ] Test task creation, updates, and multiple edits to ensure consistency


## Deterministic Scheduling Engine (v3)

- [ ] Implement patch-based scheduler (not rebuild) with generate/edit modes
- [ ] Add 24-hour minute-based time handling (0-1440 minutes)
- [ ] Implement sleep integrity rules (never remove/shorten sleep block)
- [ ] Add fixed block rules (cannot move/resize if fixed=true)
- [ ] Implement overlap resolution with conflict reporting
- [ ] Update AI planner to extract intent only (not time math)
- [ ] Add comprehensive scheduling tests (clock logic, bedtime, pre-sleep stacking)
- [ ] Test overlap detection and conflict reporting
- [ ] Verify time integrity across all scenarios
- [ ] Test AM/PM handling and bedtime context awareness

## Daily Sleep Score Feature
- [ ] Create sleep score utility with scoring logic and feedback generation
- [ ] Add Sleep Score UI component to homepage
- [ ] Write comprehensive tests for scoring utility
- [ ] Integrate with existing check-in data and verify end-to-end
- [ ] Save checkpoint and deliver feature


## Daily Sleep Score Feature (COMPLETED)
- [x] Create sleep score utility with scoring logic and feedback generation
- [x] Add Sleep Score UI component to homepage
- [x] Write comprehensive tests for scoring utility (23 tests)
- [x] Integrate with existing check-in data via tRPC procedures
- [x] All 114 tests passing, zero TypeScript errors


## Schedule Conflict Detection & Resolution
- [x] Create conflict detection and auto-resolution utility functions
- [x] Integrate conflict detection into task scheduler
- [x] Write comprehensive tests for conflict detection and resolution (27 tests)
- [x] Verify integration and test end-to-end (141 total tests passing)
- [ ] Save checkpoint and deliver feature
