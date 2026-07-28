import { Router, type IRouter } from "express";
import { db, usersTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { CompleteCampaignLevelBody } from "@workspace/api-zod";

const router: IRouter = Router();

const CAMPAIGN_COINS = 15;
const HINT_COST = 50;

router.post("/game/campaign/complete", requireAuth, async (req, res): Promise<void> => {
  const parsed = CompleteCampaignLevelBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { level } = parsed.data;

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Validate level is reachable
  if (level < 1 || level > 100 || level > user.unlockedLevel) {
    res.status(400).json({ error: "Invalid or locked level" });
    return;
  }

  const newUnlockedLevel = Math.min(100, Math.max(user.unlockedLevel, level + 1));
  const newCoins = user.coins + CAMPAIGN_COINS;

  await db.update(usersTable)
    .set({ coins: newCoins, unlockedLevel: newUnlockedLevel })
    .where(eq(usersTable.id, user.id));

  res.json({ coins: newCoins, coinsAdded: CAMPAIGN_COINS, unlockedLevel: newUnlockedLevel });
});

router.post("/game/campaign/lose", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (user.lives <= 0) {
    res.status(400).json({ error: "No lives remaining" });
    return;
  }

  const newLives = user.lives - 1;
  await db.update(usersTable).set({ lives: newLives }).where(eq(usersTable.id, user.id));
  res.json({ lives: newLives, message: `${newLives} lives remaining` });
});

router.post("/game/undo", requireAuth, async (req, res): Promise<void> => {
  // Server validates that ad was presumably watched (client calls this only after ad completes)
  // In a production scenario, you'd track a server-issued ad token
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }
  res.json({ allowed: true });
});

router.post("/game/hint", requireAuth, async (req, res): Promise<void> => {
  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  if (user.coins < HINT_COST) {
    res.status(402).json({ error: `Insufficient coins. Hint costs ${HINT_COST} coins.` });
    return;
  }

  const newCoins = user.coins - HINT_COST;
  await db.update(usersTable).set({ coins: newCoins }).where(eq(usersTable.id, user.id));
  res.json({ coins: newCoins, coinsAdded: -HINT_COST, message: "Hint granted!" });
});

router.post("/game/double-win-coins", requireAuth, async (req, res): Promise<void> => {
  const { amount } = req.body as { amount?: number };
  if (typeof amount !== "number" || amount < 1 || amount > 500) {
    res.status(400).json({ error: "Invalid amount" });
    return;
  }

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  const newCoins = user.coins + amount;
  await db.update(usersTable).set({ coins: newCoins }).where(eq(usersTable.id, user.id));
  res.json({ coins: newCoins, coinsAdded: amount });
});

export default router;
