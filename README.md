# Sleepline — Daily Command Center

A dreamy, premium AI-powered daily command center that converts natural language into structured schedules visible on a real-time dashboard. Built with React, TypeScript, tRPC, and a Celestial Observatory design system.

## Features

### Dashboard (Home)
- **Real-time Clock Ring** — SVG clock that updates every second, shows day progress, highlights the current block, and displays a countdown to the next event
- **Bedtime/Wake Options** — Three AI-generated sleep profiles (Performance / Balanced / Recovery) with predicted energy levels and rationale
- **Today's Timeline** — Chronological view of tasks and system blocks (breaks, snacks, wind-down) with quick actions (Done, Snooze +10m)
- **AI Plan Panel** — Describe your day in natural language and get a structured schedule with action cards (Preview → Apply → Edit → Discard)

### AI Planning Pipeline
- Server-side LLM integration via tRPC for structured plan generation
- Smart fallback text parser for offline/demo use (handles "Work 9-5", "gym after work 1h", etc.)
- Strict Zod schemas for Task, SystemBlock, SleepOption, and DayPlan
- Deterministic scheduler that assigns times, inserts breaks/snacks/wind-down, avoids overlaps, and produces overflow warnings

### Daily Loop
1. **Onboarding Survey** — Name, sleep preferences, chronotype, break frequency, goals
2. **Daily Check-in** — Sleep hours, quality, energy, stress, workload
3. **Plan Generation** — AI generates bedtime/wake options and a full day plan
4. **Timeline Execution** — Track tasks in real time with the clock ring and timeline
5. **Reminders** — Browser notifications for wind-down, bedtime, and next-task alerts

### Design System: Celestial Observatory
- Dark-first UI with deep indigo night-sky gradient
- Glass morphism cards with backdrop blur and soft glow
- Subtle noise overlay for texture
- Consistent design tokens (colors, typography, spacing)
- Responsive: 3-column desktop, stacked mobile
- Smooth animations with `prefers-reduced-motion` support

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| State | Zustand with localStorage persistence |
| Backend | Express 4, tRPC 11, Node.js |
| Database | MySQL/TiDB via Drizzle ORM |
| AI | Built-in LLM API (OpenAI-compatible) |
| Auth | Manus OAuth |
| Validation | Zod schemas |
| Testing | Vitest |

## Project Structure

```
client/
  src/
    components/     ← ClockRing, Timeline, ActionCard, AIPlanPanel, NavHeader
    pages/          ← Dashboard, Onboarding, CheckIn, History, Settings
    lib/            ← schemas, scheduler, store, ai-planner, notifications
server/
  ai-planner.ts    ← Server-side AI planning with LLM
  data-router.ts   ← tRPC procedures for CRUD operations
  db.ts            ← Database query helpers
  routers.ts       ← Main tRPC router
drizzle/
  schema.ts        ← Database tables (users, onboardings, checkIns, dayPlans, reminderSettings)
```

## Database Schema

| Table | Purpose |
|-------|---------|
| `users` | OAuth user accounts |
| `onboardings` | Sleep preferences, chronotype, goals |
| `checkIns` | Daily sleep/energy/stress check-ins |
| `dayPlans` | Full day plans with tasks, blocks, sleep options |
| `reminderSettings` | Per-user notification preferences |

## API Endpoints (tRPC)

| Procedure | Type | Description |
|-----------|------|-------------|
| `ai.generatePlan` | Mutation | Generate a structured day plan from natural language |
| `data.saveOnboarding` | Mutation | Save onboarding preferences |
| `data.getOnboarding` | Query | Get user's onboarding data |
| `data.saveCheckIn` | Mutation | Save daily check-in |
| `data.getCheckIns` | Query | Get check-in history |
| `data.saveDayPlan` | Mutation | Persist a day plan |
| `data.getTodayPlan` | Query | Get today's plan |
| `data.updateDayPlan` | Mutation | Update task status or sleep option |
| `data.saveReminderSettings` | Mutation | Save notification preferences |

## Demo Flow

1. **Onboarding** — Enter your name, set sleep goal (e.g., 8h), preferred bedtime (10:30 PM) and wake time (6:30 AM), choose chronotype, set break frequency, and select goals
2. **Check-in** — Report last night's sleep (hours, quality 1-5, energy 1-5, stress 1-5, workload)
3. **Plan My Day** — Click a quick-start prompt like "Office Worker" or type your own description (e.g., "Work 9-5, gym after work 1h, dinner prep 45m")
4. **Review & Apply** — Preview the generated plan with tasks, breaks, snacks, and wind-down blocks, then click Apply
5. **Track** — Watch the clock ring progress through your day, mark tasks as Done, snooze +10m
6. **Sleep Options** — Choose Performance, Balanced, or Recovery sleep profile
7. **Reminders** — Get browser notifications for wind-down and bedtime

## Zod Schemas

All AI outputs are validated against strict Zod schemas:

- `TaskSchema` — id, title, startMin, endMin, type, priority, status, locked
- `SystemBlockSchema` — id, type (break/snack/wind-down/wake-up/sleep), title, startMin, endMin
- `SleepOptionSchema` — id, mode, bedtimeMin, wakeMin, sleepDurationHrs, predictedEnergy, rationale
- `DayPlanSchema` — id, date, tasks[], systemBlocks[], sleepOptions[], warnings[]
- `AIPlanPreviewSchema` — tasks[], constraints, sleepOptions[], warnings[]

## Testing

```bash
pnpm test
```

Runs 20 tests covering:
- Time conversion helpers
- Free slot detection algorithm
- Break insertion logic
- Sleep option generation with bounds clamping
- Overlap detection
- Natural language time range parsing ("Work 9-5", "school 8-3", "meetings 10-12")
- Task type detection
- Zod schema validation
- AI router input validation

## Development

```bash
pnpm install
pnpm dev
```

## Environment Variables

All environment variables are managed through the platform. Key variables:

- `DATABASE_URL` — MySQL/TiDB connection string
- `JWT_SECRET` — Session cookie signing
- `BUILT_IN_FORGE_API_URL` — LLM API endpoint
- `BUILT_IN_FORGE_API_KEY` — LLM API authentication
- `VITE_APP_ID` — OAuth application ID
- `OAUTH_SERVER_URL` — OAuth backend URL
