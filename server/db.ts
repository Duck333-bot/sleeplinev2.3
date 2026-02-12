import { eq, and, desc } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users, onboardings, checkIns, dayPlans, reminderSettings } from "../drizzle/schema";
import type { InsertOnboarding, InsertCheckIn, InsertDayPlan, InsertReminderSetting } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// ─── Onboarding ─────────────────────────────────────────────

export async function saveOnboarding(data: InsertOnboarding) {
  const db = await getDb();
  if (!db) return;
  await db.insert(onboardings).values(data);
}

export async function getOnboarding(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(onboardings).where(eq(onboardings.userId, userId)).limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateOnboarding(userId: number, data: Partial<InsertOnboarding>) {
  const db = await getDb();
  if (!db) return;
  await db.update(onboardings).set(data).where(eq(onboardings.userId, userId));
}

// ─── Check-ins ──────────────────────────────────────────────

export async function saveCheckIn(data: InsertCheckIn) {
  const db = await getDb();
  if (!db) return;
  await db.insert(checkIns).values(data);
}

export async function getCheckInsByUser(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(checkIns)
    .where(eq(checkIns.userId, userId))
    .orderBy(desc(checkIns.createdAt))
    .limit(limit);
}

export async function getCheckInByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(checkIns)
    .where(and(eq(checkIns.userId, userId), eq(checkIns.date, date)))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

// ─── Day Plans ──────────────────────────────────────────────

export async function saveDayPlan(data: InsertDayPlan) {
  const db = await getDb();
  if (!db) return;
  await db.insert(dayPlans).values(data);
}

export async function getDayPlanByDate(userId: number, date: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(dayPlans)
    .where(and(eq(dayPlans.userId, userId), eq(dayPlans.date, date)))
    .orderBy(desc(dayPlans.createdAt))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function getDayPlansByUser(userId: number, limit = 30) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(dayPlans)
    .where(eq(dayPlans.userId, userId))
    .orderBy(desc(dayPlans.createdAt))
    .limit(limit);
}

export async function updateDayPlan(planId: string, data: Partial<InsertDayPlan>) {
  const db = await getDb();
  if (!db) return;
  await db.update(dayPlans).set(data).where(eq(dayPlans.planId, planId));
}

// ─── Reminder Settings ──────────────────────────────────────

export async function saveReminderSettings(data: InsertReminderSetting) {
  const db = await getDb();
  if (!db) return;
  await db.insert(reminderSettings).values(data);
}

export async function getReminderSettings(userId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(reminderSettings)
    .where(eq(reminderSettings.userId, userId))
    .limit(1);
  return result.length > 0 ? result[0] : undefined;
}

export async function updateReminderSettings(userId: number, data: Partial<InsertReminderSetting>) {
  const db = await getDb();
  if (!db) return;
  await db.update(reminderSettings).set(data).where(eq(reminderSettings.userId, userId));
}
