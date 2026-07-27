---
name: Chess DB Schema
description: Database tables and key business logic for the chess game
---

## Tables
- `users`: id, email, passwordHash, coins (default 100), lives (default 3), unlockedLevel (default 1), dailyBonusDay (1-7 int), lastDailyBonusDate (date string), lastWithdrawalDate (date string)
- `withdrawals`: id, userId, amount (INR), upiId, coinsDeducted, status (pending/completed/rejected), createdAt

## Key business rules baked into server routes
- Hint cost: 50 coins (deducted server-side at /game/hint)
- Campaign win: +15 coins, unlocks next level (capped at 100)
- Watch ad: +10 coins
- Daily bonus: 20/30/40/50/60/70/100 per day 1-7; doubled=true gives 2x
- Withdrawal coin costs: ₹10=750, ₹20=1500, ₹50=3750
- Daily withdrawal limit: checked via lastWithdrawalDate === today (YYYY-MM-DD)
- Reject withdrawal refunds coins back via SQL: coins + coinsDeducted

**Why:** All balances and limits enforced server-side only; client cannot spoof.
