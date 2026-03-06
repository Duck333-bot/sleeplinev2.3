# Sleepline Plan Flow Audit Report

## Current State Analysis

### Root Problems Identified

#### 1. **AI Plan Panel UX Issues**
- **Hierarchy**: Quick prompts and welcome state lack visual distinction; all cards feel same weight
- **Spacing**: Inconsistent padding/margins between sections; feels cramped
- **Action clarity**: Apply/Discard buttons don't clearly communicate consequences
- **Loading state**: Generic spinner with minimal feedback; user doesn't know what's happening
- **Empty state**: No clear guidance on what to do first
- **Microcopy**: Generic AI buzzwords ("Parsing tasks, assigning times") instead of premium language

#### 2. **Plan Preview Card Issues**
- **Structure**: Task list is dense; hard to scan at a glance
- **Visual grouping**: No distinction between scheduled vs unscheduled tasks in preview
- **Warning display**: Warnings feel like errors; should feel more like "heads up"
- **Action buttons**: "Apply Plan" and "Discard" buttons lack visual confidence
- **Task mini cards**: Too compact; hard to understand what's being scheduled

#### 3. **Apply/Edit/Save Reliability**
- **Duplicate prevention**: applyPlan filters out unapplied previews but doesn't check for duplicates
- **Timeline stability**: After apply, timeline may reorder if sorting isn't consistent
- **State persistence**: Plans are stored in localStorage but no validation on load
- **Edit flow**: No clear "edit mode" - user must generate new plan instead of modifying existing
- **Save feedback**: No explicit "saved" confirmation; user unsure if changes persisted

#### 4. **Timeline Rendering Issues**
- **Visual rhythm**: Tasks and system blocks don't have clear visual hierarchy
- **Grouping**: No clear separation between "current", "upcoming", "completed" sections
- **Spacing**: Inconsistent padding between items
- **Quick actions**: Buttons feel cramped; hard to tap on mobile
- **Flicker**: Timeline may briefly reorder when tasks update
- **Empty state**: "No plan yet" message is too minimal

#### 5. **Missing Premium States**
- **Loading**: Just a spinner; no context
- **Empty (no plan)**: Minimal placeholder
- **Error**: Generic error message
- **Success**: No celebration or confirmation after apply
- **Transitional states**: No smooth transitions between states

#### 6. **Microcopy Issues**
- "Building your schedule..." - generic AI speak
- "Parsing tasks, assigning times, inserting breaks" - too technical
- "Plan Active" - unclear what this means to user
- "Day Plan Preview" - could be more descriptive
- Button text lacks confidence

### Files Responsible for Plan Flow

| Component | File | Responsibility |
|-----------|------|-----------------|
| AI Plan Panel | `client/src/components/AIPlanPanel.tsx` | Chat interface, plan generation, state management |
| Plan Preview Card | `client/src/components/ActionCard.tsx` | Preview display, apply/discard actions |
| Timeline | `client/src/components/Timeline.tsx` | Task rendering, visual presentation |
| Store Logic | `client/src/lib/store.ts` | applyPlan, updateTask, snoozeTask, state persistence |
| AI Planner | `client/src/lib/ai-planner.ts` | Server-side plan generation |
| Schemas | `client/src/lib/schemas.ts` | Type definitions, validation |

### Current Flow

```
User Input → generatePlanPreview (server) → setPreviewPlan → PlanPreviewCard
                                                                    ↓
                                                        User clicks "Apply Plan"
                                                                    ↓
                                                        applyPlan() in store
                                                                    ↓
                                                        Timeline re-renders
```

### Issues in Current Flow

1. **No deduplication**: If user applies same plan twice, tasks may duplicate
2. **No edit mode**: User must generate entirely new plan to make changes
3. **No save confirmation**: User doesn't know if changes persisted
4. **No rollback**: User can't undo an apply
5. **Weak loading feedback**: User doesn't know what's happening during generation
6. **Weak success feedback**: User doesn't feel confident after apply
7. **No error recovery**: If generation fails, user is stuck with generic message

## Improvement Strategy

### Phase 1: Visual Polish (High Impact)
- Improve AIPlanPanel hierarchy and spacing
- Upgrade PlanPreviewCard structure and clarity
- Enhance loading/empty/error states
- Refine microcopy throughout

### Phase 2: Reliability (High Impact)
- Add deduplication logic to applyPlan
- Add plan validation before save
- Add success/error feedback
- Add edit mode (optional for this sprint)

### Phase 3: Timeline Polish (Medium Impact)
- Improve visual grouping
- Better spacing and typography
- Clearer current/upcoming/completed distinction
- Smoother transitions

## Success Criteria

- ✅ User immediately understands what was generated
- ✅ Applying a plan feels safe and clear
- ✅ No duplicate tasks after apply
- ✅ Timeline doesn't flicker or reorder unexpectedly
- ✅ All states (loading/empty/error/success) feel intentional
- ✅ Microcopy is calm, premium, and trustworthy
- ✅ Flow feels investor-demo ready
