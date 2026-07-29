import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import {
  Coins,
  Play,
  Gift,
  Swords,
  CheckCircle2,
  Loader2,
  ChevronRight,
} from 'lucide-react';
import { Link } from 'wouter';
import { twMerge } from 'tailwind-merge';
import { useWatchAd, useClaimDailyBonus, getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { useAdMob } from '@/hooks/use-admob';

// Must stay in sync with server's DAILY_BONUS_AMOUNTS
const DAILY_BONUS_AMOUNTS = [20, 30, 40, 50, 60, 70, 100];
const DAILY_AD_LIMIT = 20;
const AD_DURATION = 5;

interface GetMoreCoinsModalProps {
  open: boolean;
  onClose: () => void;
  coins: number;
  lives: number;
  dailyBonusDay: number;
  lastDailyBonusDate: string | null | undefined;
  /** Real-time daily ads watched today (server resets at midnight) */
  dailyAdsWatched: number;
}

// ─── Watch Ad tile ────────────────────────────────────────────────────────────

function WatchAdTile({
  adsWatched,
  onSuccess,
}: {
  adsWatched: number;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const watchAdMutation = useWatchAd();
  const queryClient = useQueryClient();

  const [adPlaying, setAdPlaying] = useState(false);
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [claimed, setClaimed] = useState(false);

  const remaining = Math.max(0, DAILY_AD_LIMIT - adsWatched);
  const exhausted = remaining === 0;

  const handleRewarded = () => {
    setAdPlaying(false);
    watchAdMutation.mutate(undefined, {
      onSuccess: (res) => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        setClaimed(true);
        setTimeout(() => setClaimed(false), 2500);
        onSuccess();
        toast({
          title: '+10 Coins!',
          description: res.message,
        });
      },
      onError: (err) => {
        toast({ title: 'Error', description: err.message, variant: 'destructive' });
      },
    });
  };

  const { showAd } = useAdMob({
    onRewarded: handleRewarded,
    onCountdown: (s) => setCountdown(s),
  });

  const handleWatch = () => {
    if (exhausted || adPlaying) return;
    setAdPlaying(true);
    setCountdown(AD_DURATION);
    showAd();
  };

  return (
    <div className={twMerge(
      'rounded-2xl border p-4 flex items-center gap-4 transition-colors',
      exhausted
        ? 'border-zinc-800 bg-zinc-900/50 opacity-60'
        : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600',
    )}>
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
        <Play className="w-6 h-6 text-blue-400 fill-blue-400" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 font-sans text-sm">Watch Ad</p>
        <p className="text-zinc-400 font-sans text-xs mt-0.5">+10 coins per ad</p>

        {/* Progress bar — ads remaining today */}
        <div className="mt-2 space-y-1">
          <Progress
            value={(adsWatched / DAILY_AD_LIMIT) * 100}
            className="h-1.5 bg-zinc-800"
          />
          <p className="text-[10px] text-zinc-500 font-sans">
            {exhausted ? 'Daily limit reached — come back tomorrow' : `${remaining} of ${DAILY_AD_LIMIT} remaining today`}
          </p>
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0">
        {adPlaying ? (
          <div className="flex flex-col items-center gap-1 min-w-[56px]">
            <Loader2 className="w-5 h-5 text-blue-400 animate-spin" />
            <span className="text-blue-400 font-mono text-xs">{countdown}s</span>
          </div>
        ) : claimed ? (
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        ) : (
          <Button
            size="sm"
            disabled={exhausted}
            onClick={handleWatch}
            className="bg-blue-500 hover:bg-blue-400 text-white font-sans font-semibold rounded-xl px-4 disabled:opacity-40"
          >
            +10
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Daily Bonus tile ─────────────────────────────────────────────────────────

function DailyBonusTile({
  dailyBonusDay,
  lastDailyBonusDate,
  onSuccess,
}: {
  dailyBonusDay: number;
  lastDailyBonusDate: string | null | undefined;
  onSuccess: () => void;
}) {
  const { toast } = useToast();
  const claimMutation = useClaimDailyBonus();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().slice(0, 10);
  const alreadyClaimed = lastDailyBonusDate === today;

  // Which day the NEXT claim will be
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().slice(0, 10);
  const nextDay =
    lastDailyBonusDate === yesterdayStr ? (dailyBonusDay % 7) + 1 : 1;

  const nextAmount = DAILY_BONUS_AMOUNTS[nextDay - 1];
  const currentStreakDay = alreadyClaimed ? dailyBonusDay : nextDay;

  const handleClaim = () => {
    claimMutation.mutate(
      { data: { doubled: false } },
      {
        onSuccess: (res) => {
          queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
          onSuccess();
          toast({
            title: `Day ${currentStreakDay} Bonus!`,
            description: `+${res.coinsAdded} coins added to your balance.`,
          });
        },
        onError: (err) => {
          toast({ title: 'Error', description: err.message, variant: 'destructive' });
        },
      },
    );
  };

  // Seven-day streak dots
  const dots = Array.from({ length: 7 }, (_, i) => {
    const dayNum = i + 1;
    const isDone = alreadyClaimed ? dayNum <= dailyBonusDay : dayNum < nextDay;
    const isCurrent = alreadyClaimed ? dayNum === dailyBonusDay : dayNum === nextDay;
    return { dayNum, isDone, isCurrent };
  });

  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 flex items-start gap-4">
      {/* Icon */}
      <div className="w-12 h-12 rounded-xl bg-yellow-500/10 flex items-center justify-center shrink-0 mt-0.5">
        <Gift className="w-6 h-6 text-yellow-400" />
      </div>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-semibold text-zinc-100 font-sans text-sm">Daily Bonus</p>
          {alreadyClaimed && (
            <span className="text-[10px] text-green-400 font-sans bg-green-500/10 px-2 py-0.5 rounded-full border border-green-500/20">
              Claimed ✓
            </span>
          )}
        </div>
        <p className="text-zinc-400 font-sans text-xs mt-0.5">
          {alreadyClaimed
            ? `Day ${dailyBonusDay} streak — come back tomorrow`
            : `Day ${nextDay} — claim +${nextAmount} coins`}
        </p>

        {/* 7-day streak dots */}
        <div className="flex items-center gap-1.5 mt-3">
          {dots.map(({ dayNum, isDone, isCurrent }) => (
            <div key={dayNum} className="flex flex-col items-center gap-0.5">
              <div className={twMerge(
                'w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold transition-all',
                isDone
                  ? 'bg-yellow-500 text-zinc-900'
                  : isCurrent
                  ? 'bg-yellow-500/30 border-2 border-yellow-500 text-yellow-400'
                  : 'bg-zinc-800 text-zinc-600',
              )}>
                {isDone ? '✓' : dayNum}
              </div>
              {isCurrent && !alreadyClaimed && (
                <div className="w-1 h-1 rounded-full bg-yellow-500" />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Action */}
      <div className="shrink-0 mt-0.5">
        {alreadyClaimed ? (
          <CheckCircle2 className="w-7 h-7 text-green-400" />
        ) : (
          <Button
            size="sm"
            onClick={handleClaim}
            disabled={claimMutation.isPending}
            className="bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-sans font-bold rounded-xl px-3 disabled:opacity-50"
          >
            {claimMutation.isPending ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              `+${nextAmount}`
            )}
          </Button>
        )}
      </div>
    </div>
  );
}

// ─── Campaign tile ────────────────────────────────────────────────────────────

function CampaignTile({ onClose }: { onClose: () => void }) {
  return (
    <div className="rounded-2xl border border-zinc-700 bg-zinc-900 p-4 flex items-center gap-4">
      <div className="w-12 h-12 rounded-xl bg-amber-700/20 flex items-center justify-center shrink-0">
        <Swords className="w-6 h-6 text-amber-500" />
      </div>

      <div className="flex-1 min-w-0">
        <p className="font-semibold text-zinc-100 font-sans text-sm">Play Campaign</p>
        <p className="text-zinc-400 font-sans text-xs mt-0.5">Win any level to earn +15 coins</p>
      </div>

      <Link href="/campaign" onClick={onClose}>
        <Button
          size="sm"
          variant="outline"
          className="border-zinc-700 bg-zinc-800 text-zinc-200 hover:bg-zinc-700 hover:text-white font-sans rounded-xl px-3 shrink-0 flex items-center gap-1"
        >
          Play
          <ChevronRight className="w-3.5 h-3.5" />
        </Button>
      </Link>
    </div>
  );
}

// ─── Modal shell ──────────────────────────────────────────────────────────────

export function GetMoreCoinsModal({
  open,
  onClose,
  coins,
  dailyBonusDay,
  lastDailyBonusDate,
  dailyAdsWatched,
}: GetMoreCoinsModalProps) {
  const handleTileSuccess = () => {
    // Keep modal open so the user can claim multiple rewards
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="sm:max-w-md bg-zinc-950 border-zinc-800 text-zinc-100 p-6 gap-0">
        <DialogHeader className="mb-4">
          <DialogTitle className="text-xl font-serif font-bold tracking-wide flex items-center gap-2">
            <Coins className="w-5 h-5 text-yellow-500" />
            Get More Coins
          </DialogTitle>
          {/* Current balance */}
          <p className="text-zinc-400 font-sans text-sm mt-1">
            Balance: <span className="text-yellow-400 font-bold">{coins.toLocaleString()}</span> coins
          </p>
        </DialogHeader>

        <div className="flex flex-col gap-3">
          <WatchAdTile
            adsWatched={dailyAdsWatched}
            onSuccess={handleTileSuccess}
          />

          <DailyBonusTile
            dailyBonusDay={dailyBonusDay}
            lastDailyBonusDate={lastDailyBonusDate}
            onSuccess={handleTileSuccess}
          />

          <CampaignTile onClose={onClose} />
        </div>
      </DialogContent>
    </Dialog>
  );
}
