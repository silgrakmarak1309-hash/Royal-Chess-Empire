import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth, isAdminEmail } from "../lib/auth";
import { ClaimDailyBonusBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Daily bonus amounts per day (1-7)
const DAILY_BONUS_AMOUNTS = [20, 30, 40, 50, 60, 70, 100];

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

router.get("/user/me", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  const today = todayStr();
  const dailyAdsWatched = user.lastAdWatchDate === today ? user.dailyAdsWatched : 0;
  res.json({
    id: user.id,
    email: user.email,
    coins: user.coins,
    lives: user.lives,
    unlockedLevel: user.unlockedLevel,
    dailyBonusDay: user.dailyBonusDay,
    lastDailyBonusDate: user.lastDailyBonusDate,
    lastWithdrawalDate: user.lastWithdrawalDate,
    dailyAdsWatched,
    isAdmin: isAdminEmail(user.email),
  });
});

router.post("/user/daily-bonus", requireAuth, async (req, res): Promise<void> => {
  const parsed = ClaimDailyBonusBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { doubled } = parsed.data;
  const today = todayStr();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (user.lastDailyBonusDate === today) {
    res.status(400).json({ error: "Daily bonus already claimed today" });
    return;
  }

  // Calculate which day in the streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);

  let nextDay: number;
  if (user.lastDailyBonusDate === yesterdayStr) {
    // Continuing streak
    nextDay = (user.dailyBonusDay % 7) + 1;
  } else {
    // Streak broken or first time
    nextDay = 1;
  }

  const baseAmount = DAILY_BONUS_AMOUNTS[nextDay - 1];
  const coinsAdded = doubled ? baseAmount * 2 : baseAmount;
  const newCoins = user.coins + coinsAdded;

  await db.update(usersTable)
    .set({ coins: newCoins, dailyBonusDay: nextDay, lastDailyBonusDate: today })
    .where(eq(usersTable.id, user.id));

  res.json({ coins: newCoins, coinsAdded, message: `Daily bonus Day ${nextDay} claimed!` });
});

const DAILY_AD_LIMIT = 20;

router.post("/user/watch-ad", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const today = todayStr();

  // Reset counter if it's a new day
  const currentAdsWatched = user.lastAdWatchDate === today ? user.dailyAdsWatched : 0;

  if (currentAdsWatched >= DAILY_AD_LIMIT) {
    res.status(429).json({
      error: "Aapne aaj ki ad dekhte ki limit (20 Ads) poori kar li hai! Kal dubara try karein.",
    });
    return;
  }

  const newAdsWatched = currentAdsWatched + 1;
  const coinsAdded = 10;
  const newCoins = user.coins + coinsAdded;

  await db.update(usersTable)
    .set({ coins: newCoins, dailyAdsWatched: newAdsWatched, lastAdWatchDate: today })
    .where(eq(usersTable.id, user.id));

  res.json({
    coins: newCoins,
    coinsAdded,
    message: `+10 coins! (${newAdsWatched}/${DAILY_AD_LIMIT} ads watched today)`,
  });
});

export default router;
