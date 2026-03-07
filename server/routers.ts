import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { aiRouter } from "./ai-planner";
import { aiDayPlannerRouter } from "./ai-day-planner-router";
import { dayReviewRouter } from "./day-review-router";

import { bedtimeExplanationRouter } from "./bedtime-explanation-router";
import { planningConversationRouter } from "./planning-conversation-router";
import { dataRouter } from "./data-router";
import { taskRouter } from "./task-router";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),
  ai: aiRouter,
  aiDayPlanner: aiDayPlannerRouter,
  dayReview: dayReviewRouter,
  planningConversation: planningConversationRouter,
  bedtimeExplanation: bedtimeExplanationRouter,
  data: dataRouter,
  task: taskRouter,
});

export type AppRouter = typeof appRouter;
