import { Router, type IRouter } from "express";
import { db, usersTable, withdrawalsTable } from "@workspace/db";
import { eq, desc, sql } from "drizzle-orm";
import { requireAdmin } from "../lib/auth";
import { AdminApproveWithdrawalParams, AdminRejectWithdrawalParams } from "@workspace/api-zod";

const router: IRouter = Router();

router.get("/admin/withdrawals", requireAdmin, async (req, res): Promise<void> => {
  const withdrawals = await db.select({
    id: withdrawalsTable.id,
    userId: withdrawalsTable.userId,
    userEmail: usersTable.email,
    amount: withdrawalsTable.amount,
    upiId: withdrawalsTable.upiId,
    status: withdrawalsTable.status,
    coinsDeducted: withdrawalsTable.coinsDeducted,
    createdAt: withdrawalsTable.createdAt,
  })
    .from(withdrawalsTable)
    .leftJoin(usersTable, eq(withdrawalsTable.userId, usersTable.id))
    .orderBy(desc(withdrawalsTable.createdAt));

  res.json(withdrawals.map(w => ({
    id: w.id,
    userId: w.userId,
    userEmail: w.userEmail ?? "unknown",
    amount: w.amount,
    upiId: w.upiId,
    status: w.status,
    coinsDeducted: w.coinsDeducted,
    createdAt: w.createdAt!.toISOString(),
  })));
});

router.post("/admin/withdrawals/:id/approve", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminApproveWithdrawalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [withdrawal] = await db.select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.id, params.data.id))
    .limit(1);

  if (!withdrawal) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }

  if (withdrawal.status !== "pending") {
    res.status(400).json({ error: "Withdrawal is not pending" });
    return;
  }

  const [updated] = await db.update(withdrawalsTable)
    .set({ status: "completed" })
    .where(eq(withdrawalsTable.id, params.data.id))
    .returning();

  const userRow = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
  const userEmail = userRow[0]?.email ?? "unknown";

  res.json({
    id: updated.id,
    userId: updated.userId,
    userEmail,
    amount: updated.amount,
    upiId: updated.upiId,
    status: updated.status,
    coinsDeducted: updated.coinsDeducted,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.post("/admin/withdrawals/:id/reject", requireAdmin, async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.id) ? req.params.id[0] : req.params.id;
  const params = AdminRejectWithdrawalParams.safeParse({ id: parseInt(raw, 10) });
  if (!params.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [withdrawal] = await db.select()
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.id, params.data.id))
    .limit(1);

  if (!withdrawal) {
    res.status(404).json({ error: "Withdrawal not found" });
    return;
  }

  if (withdrawal.status !== "pending") {
    res.status(400).json({ error: "Withdrawal is not pending" });
    return;
  }

  // Refund coins back to the user
  await db.update(usersTable)
    .set({ coins: sql`${usersTable.coins} + ${withdrawal.coinsDeducted}` })
    .where(eq(usersTable.id, withdrawal.userId));

  const [updated] = await db.update(withdrawalsTable)
    .set({ status: "rejected" })
    .where(eq(withdrawalsTable.id, params.data.id))
    .returning();

  const userRow = await db.select().from(usersTable).where(eq(usersTable.id, updated.userId)).limit(1);
  const userEmail = userRow[0]?.email ?? "unknown";

  res.json({
    id: updated.id,
    userId: updated.userId,
    userEmail,
    amount: updated.amount,
    upiId: updated.upiId,
    status: updated.status,
    coinsDeducted: updated.coinsDeducted,
    createdAt: updated.createdAt.toISOString(),
  });
});

router.get("/admin/stats", requireAdmin, async (req, res): Promise<void> => {
  const [totalUsersResult] = await db.select({ count: sql<number>`count(*)::int` }).from(usersTable);
  const [totalWithdrawalsResult] = await db.select({ count: sql<number>`count(*)::int` }).from(withdrawalsTable);
  const [pendingResult] = await db.select({ count: sql<number>`count(*)::int` })
    .from(withdrawalsTable)
    .where(eq(withdrawalsTable.status, "pending"));
  const [coinsResult] = await db.select({ total: sql<number>`coalesce(sum(coins), 0)::int` }).from(usersTable);

  res.json({
    totalUsers: totalUsersResult.count,
    totalWithdrawals: totalWithdrawalsResult.count,
    pendingWithdrawals: pendingResult.count,
    totalCoinsInSystem: coinsResult.total,
  });
});

export default router;
