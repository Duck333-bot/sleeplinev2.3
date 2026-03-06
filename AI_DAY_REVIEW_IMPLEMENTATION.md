# AI Day Review — Implementation Guide

## Feature Overview

The "AI Day Review" feature analyzes how the user's day went and generates intelligent coaching insights. It provides three key insights:
1. **Productivity Observation**: Analysis of task completion and focus patterns
2. **Tomorrow's Suggestion**: Specific, actionable recommendation for improving tomorrow's schedule
3. **Sleep Insight**: Observation about sleep timing and its impact on the day

The feature also assigns an overall mood rating (great, good, neutral, challenging) to contextualize the day.

## Architecture

### Backend Components

#### 1. **ai-day-review.ts** (`server/ai-day-review.ts`)
Core module for day review generation:

- **DAY_REVIEW_SYSTEM_PROMPT**: Optimized LLM prompt
  - Acts as an intelligent sleep and productivity coach
  - Provides clear JSON schema for responses
  - Emphasizes warm, supportive, and practical tone
  - Never judgmental or discouraging

- **DayReviewSchema**: Zod schema for validated reviews
  - `productivityObservation`: 10-200 characters
  - `tomorrowSuggestion`: 10-200 characters
  - `sleepInsight`: 10-200 characters
  - `overallMood`: "great" | "good" | "neutral" | "challenging"

- **generateDayReview()**: Main function
  - Takes tasks, completion count, sleep goal, and timing data
  - Formats task data for LLM context
  - Calls LLM with optimized prompt
  - Validates response against schema
  - Returns structured review or error

- **Helper functions**:
  - `getMoodEmoji()`: Returns emoji for mood display (🌟, 😊, 😐, 💪)
  - `getMoodColor()`: Returns Tailwind color class for mood

#### 2. **day-review-router.ts** (`server/day-review-router.ts`)
tRPC endpoint:
- `generateReview`: Mutation that generates a review from task data

#### 3. **routers.ts** (updated)
Integrated dayReviewRouter into main app router as `trpc.dayReview`

### Frontend Components

#### 1. **TodaysReview.tsx** (`client/src/components/TodaysReview.tsx`)
Review display component with:

**States**:
- **Loading**: Animated spinner with "Generating your review..." message
- **Error**: Error card with retry button
- **Empty**: "No review available yet" with generate button
- **Ready**: Full review with all three insights

**UI Elements**:
- Header with "Today's Review" title and mood emoji
- Three insight cards with icons:
  - Productivity (TrendingUp icon, periwinkle color)
  - Tomorrow (Lightbulb icon, cyan color)
  - Sleep (Moon icon, mint color)
- Regenerate button to create new review
- Auto-generates review on mount if data available

**Features**:
- Smooth animations (Framer Motion)
- Toast notifications for success/error
- Accessible error messages
- Responsive design

#### 2. **TodayDashboard.tsx** (updated)
Integrated TodaysReview component:
- Added import for TodaysReview
- Placed review card in Row 3 alongside Timeline Preview
- Uses 2-column grid layout (md breakpoint)
- Maintains consistent styling with other dashboard cards

## AI Prompt Design

The system prompt is carefully engineered to:

1. **Act as a coach**: Warm, supportive, practical tone
2. **Analyze patterns**: Not just individual tasks but overall patterns
3. **Be encouraging**: Honest but never discouraging
4. **Provide actionable insights**: Specific, implementable suggestions
5. **Consider sleep**: Emphasize sleep's role in productivity

### Prompt Key Features

**Analysis Factors**:
- Task completion rate
- Task types and priorities
- Sleep timing and duration
- Energy patterns
- Realistic assessment of productivity

**Output Requirements**:
- Exactly 3 insights (observation, suggestion, insight)
- JSON format only
- 200 character limit per insight
- Mood categorization

## Data Flow

### Generation Flow

```
User's Daily Data
  ↓
TodaysReview Component
  ↓
trpc.dayReview.generateReview()
  ↓
generateDayReview() function
  ↓
Format task data for LLM
  ↓
Call LLM with system prompt
  ↓
Extract and validate JSON
  ↓
Return DayReview object
  ↓
Display in UI with animations
```

### Data Structure

```typescript
// Input
{
  tasks: Task[],           // Array of tasks with status
  completedTasks: number,  // Count of completed tasks
  sleepGoal: number,       // Hours
  actualBedtime?: number,  // Minutes from midnight
  wakeTime?: number        // Minutes from midnight
}

// Output
{
  productivityObservation: string,  // Observation about today
  tomorrowSuggestion: string,       // Suggestion for tomorrow
  sleepInsight: string,             // Insight about sleep
  overallMood: "great" | "good" | "neutral" | "challenging"
}
```

## Testing

### Test Coverage
- 10 comprehensive tests for review validation
- Tests cover:
  - Valid reviews (pass)
  - Missing fields (fail)
  - Text too short (fail)
  - Text too long (fail)
  - All mood types (pass)
  - Emoji mapping (correct)
  - Color mapping (correct)
  - Realistic content examples (pass)

### All Tests Passing
- 230 total tests passing
- Zero TypeScript errors
- No regressions in existing features

## Files Changed

| File | Type | Changes |
|------|------|---------|
| `server/ai-day-review.ts` | New | Core review generation logic |
| `server/day-review-router.ts` | New | tRPC endpoint |
| `server/ai-day-review.test.ts` | New | 10 comprehensive tests |
| `server/routers.ts` | Modified | Added dayReviewRouter |
| `client/src/components/TodaysReview.tsx` | New | Review display UI |
| `client/src/components/TodayDashboard.tsx` | Modified | Integrated review card |
| `todo.md` | Modified | Feature tracking |

## User Experience Flow

### 1. Dashboard Load
- User opens dashboard
- TodaysReview component mounts
- Auto-generates review if plan data available

### 2. Review Generation
- Component calls `trpc.dayReview.generateReview()`
- Loading state shows spinner
- LLM analyzes day (2-5 seconds)
- Toast notification on success

### 3. Review Display
- Three insight cards appear with animations
- Mood emoji displayed in header
- Each insight has icon and color coding
- Regenerate button available

### 4. Regeneration
- User clicks "New review" button
- Component generates fresh review
- New insights displayed with animations

## Safe Fallbacks

**No Plan Available**:
```
"No review available yet."
```

**Generation Failed**:
```
"Review unavailable"
[Error message]
[Try again button]
```

**Missing Data**:
- Component checks for required fields
- Returns graceful error if data incomplete
- Allows retry

## UI Quality

### Design Principles
- **Consistent with dashboard**: Matches card styling, spacing, typography
- **Color-coded insights**: Each insight has distinct color for visual hierarchy
- **Smooth animations**: Framer Motion for entrance and state transitions
- **Accessible**: Clear labels, readable text, proper contrast
- **Responsive**: Works on mobile and desktop

### Visual Hierarchy
1. Header with title and mood emoji (most prominent)
2. Three insight cards (equal visual weight)
3. Regenerate button (secondary action)

## Performance Considerations

- **LLM calls**: Async mutation, doesn't block UI
- **Auto-generation**: Only on mount, not on every render
- **Caching**: Could be added to store for same-day reviews
- **Error handling**: Graceful fallbacks, no crashes

## Future Enhancements

1. **Review history**: Show past reviews for comparison
2. **Trend analysis**: "You've been more productive on Mondays"
3. **Personalization**: Adjust coaching style based on user preference
4. **Weekly summary**: Aggregate insights for the week
5. **Export**: Share reviews as text or image
6. **Notifications**: Send review as daily notification
7. **Coaching goals**: Track progress toward user-defined goals

## Manual Testing Checklist

- [ ] Dashboard loads without errors
- [ ] Review auto-generates on mount
- [ ] Loading state displays correctly
- [ ] Review displays all three insights
- [ ] Mood emoji shows correctly
- [ ] Regenerate button works
- [ ] Error state displays on failure
- [ ] Retry button works
- [ ] Mobile layout responsive
- [ ] Animations smooth
- [ ] Toast notifications appear
- [ ] No TypeScript errors
- [ ] All tests pass

## Technical Notes

- Component uses `any` type for review object (could be moved to shared types)
- LLM prompt could be versioned for A/B testing
- Consider rate limiting for high-volume usage
- Monitor LLM response times and costs
- Review data could be persisted to database for history

## Conclusion

The AI Day Review feature transforms Sleepline from a task tracker into an intelligent coaching assistant. By providing personalized, data-driven insights about productivity and sleep, it helps users continuously improve their daily routines. The feature is lightweight, reliable, and integrates seamlessly into the existing dashboard without disrupting the user experience.
