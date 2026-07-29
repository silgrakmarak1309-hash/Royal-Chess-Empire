import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, HeartCrack, Trophy, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useAdMob } from '@/hooks/use-admob';

interface ResultModalProps {
  open: boolean;
  status: 'win' | 'lose' | 'draw';
  coinsAwarded?: number;
  isPassAndPlay?: boolean;
}

type AdState = 'idle' | 'watching' | 'claimed';

const AD_DURATION = 5;

export function ResultModal({ open, status, coinsAwarded = 0, isPassAndPlay = false }: ResultModalProps) {
  const queryClient = useQueryClient();
  const [adState, setAdState] = useState<AdState>('idle');
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setAdState('idle');
      setCountdown(AD_DURATION);
      setIsLoading(false);
    }
  }, [open]);

  const claimDoubleCoins = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('chess_token');
      const res = await fetch('/api/game/double-win-coins', {
        method: 'POST',
        headers: {
          Authorization: token ? `Bearer ${token}` : '',
          'Content-Type': 'application/json',
        },
      });

      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    } catch {
      // silently fail
    } finally {
      setIsLoading(false);
      setAdState('claimed');
    }
  };

  const { showAd } = useAdMob({
    onRewarded: claimDoubleCoins,
    onCountdown: (secondsLeft) => {
      setCountdown(secondsLeft);
    },
    onError: (err) => {
      console.warn('[AdMob] failed:', err);
    },
  });

  const handleWatchAd = async () => {
    setAdState('watching');
    setCountdown(AD_DURATION);
    await showAd();
  };

  let title = 'Game Over';
  let icon = null;
  let message = '';

  if (status === 'win') {
    title = 'Victory!';
    icon = <Trophy className="w-16 h-16 text-yellow-500 mb-4" />;
    message = isPassAndPlay ? 'White wins the match!' : 'You defeated the AI!';
  } else if (status === 'lose') {
    title = 'Defeat';
    icon = <HeartCrack className="w-16 h-16 text-red-500 mb-4" />;
    message = isPassAndPlay ? 'Black wins the match!' : 'The AI outsmarted you.';
  } else {
    title = 'Draw';
    message = 'The game ended in a draw.';
  }

  const showDoubleCoinsButton = !isPassAndPlay && status === 'win' && coinsAwarded > 0;

  return (
    <Dialog open={open} onOpenChange={() => {}}>
      <DialogContent className="sm:max-w-md bg-zinc-900 border-zinc-800 text-zinc-100 p-8">
        <DialogHeader className="w-full text-center">
          <DialogTitle className="text-3xl font-serif text-center font-bold tracking-wide">
            {title}
          </DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center justify-center py-4">
          {icon}
          <p className="text-zinc-300 text-center font-sans mb-6">
            {message}
          </p>

          {!isPassAndPlay && status === 'win' && coinsAwarded > 0 && (
            <div className="flex items-center gap-2 bg-yellow-500/10 px-4 py-2 rounded-full border border-yellow-500/20 mb-4">
              <span className="text-yellow-500 font-sans font-medium">Earned</span>
              <Coins className="w-5 h-5 text-yellow-500" />
              <span className="text-yellow-500 font-sans font-bold">+{coinsAwarded} Coins</span>
            </div>
          )}

          {showDoubleCoinsButton && (
            <div className="w-full mb-6">
              {adState === 'idle' && (
                <Button
                  onClick={handleWatchAd}
                  className="w-full bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-zinc-950 font-sans font-bold py-3 flex items-center justify-center gap-2 shadow-lg shadow-yellow-500/20"
                >
                  <Play className="w-5 h-5 fill-current" />
                  Watch Ad to 2x Coins
                </Button>
              )}

              {adState === 'watching' && (
                <div className="flex items-center justify-center gap-2 py-3 bg-zinc-800 rounded-lg text-zinc-300 font-sans">
                  <Loader2 className="w-5 h-5 animate-spin text-yellow-500" />
                  <span>Showing Ad... ({countdown}s)</span>
                </div>
              )}

              {adState === 'claimed' && (
                <div className="flex items-center justify-center gap-2 py-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-lg font-sans font-medium">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Coins Doubled! (+{coinsAwarded * 2})</span>
                </div>
              )}
            </div>
          )}

          <div className="flex w-full gap-3">
            <Link href="/" className="flex-1">
              <Button variant="outline" className="w-full border-zinc-700 hover:bg-zinc-800 text-zinc-300">
                Main Menu
              </Button>
            </Link>
            <Button onClick={() => window.location.reload()} className="flex-1 bg-zinc-100 text-zinc-900 hover:bg-zinc-200">
              Play Again
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
