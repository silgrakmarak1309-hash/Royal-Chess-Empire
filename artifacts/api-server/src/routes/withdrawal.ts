import { Router, type IRouter } from "express";
import { db, usersTable, withdrawalsTable } from "@workspace/db";
import { eq, desc } from "drizzle-orm";
import { requireAuth } from "../lib/auth";
import { RequestWithdrawalBody } from "@workspace/api-zod";

const router: IRouter = Router();

// Coin costs per INR amount
const COIN_COST: Record<number, number> = {
  10: 750,
  20: 1500,
  50: 3750,
};

function todayStr(): string {
  return new Date().toISOString().slice(0, 10);
}

router.post("/withdrawal/request", requireAuth, async (req, res): Promise<void> => {
  const parsed = RequestWithdrawalBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const { amount, upiId } = parsed.data;
  const today = todayStr();

  const [user] = await db.select().from(usersTable).where(eq(usersTable.id, req.user!.userId)).limit(1);
  if (!user) {
    res.status(401).json({ error: "User not found" });
    return;
  }

  // Anti-hack daily limit
  if (user.lastWithdrawalDate === today) {
    res.status(400).json({ error: "Aap din mein sirf ek hi baar withdrawal request laga sakte hain. Kripya kal try karein!" });
    return;
  }

  const coinsNeeded = COIN_COST[amount];
  if (!coinsNeeded) {
    res.status(400).json({ error: "Invalid withdrawal amount" });
    return;
  }

  if (user.coins < coinsNeeded) {
    res.status(400).json({ error: `Insufficient coins. You need ${coinsNeeded} coins for ₹${amount} withdrawal.` });
    return;
  }

  const newCoins = user.coins - coinsNeeded;

  // Deduct coins and record withdrawal date
  await db.update(usersTable)
    .set({ coins: newCoins, lastWithdrawalDate: today })
    .where(eq(usersTable.id, user.id));

  const [withdrawal] = await db.insert(withdrawalsTable).values({
    userId: user.id,
    amount,
    upiId,
    coinsDeducted: coinsNeeded,
    status: "pending",
  }).returning();

  res.status(201).json({
    id: withdrawal.id,
    amount: withdrawal.amount,
    status: withdrawal.status,
    coins: newCoins,
  });
});

router.get("/withdrawal/my", requireAuth, async (req, res): Promise<void> => {
  const withdrawals = await db.select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.userId, req.user!.userId))
    .orderBy(desc(withdrawalsTable.createdAt));

  res.json(withdrawals.map(w => ({
    id: w.id,
    amount: w.amount,
    upiId: w.upiId,
    status: w.status,
    createdAt: w.createdAt.toISOString(),
    coinsDeducted: w.coinsDeducted,
  })));
});

export default router;
