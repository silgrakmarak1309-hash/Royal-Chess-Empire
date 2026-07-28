import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Coins, HeartCrack, Trophy, Play, CheckCircle2, Loader2 } from 'lucide-react';
import { Link } from 'wouter';
import { getGetMeQueryKey } from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';

interface ResultModalProps {
  open: boolean;
  status: 'win' | 'lose' | 'draw';
  coinsAwarded?: number;
  isPassAndPlay?: boolean;
}

type AdState = 'idle' | 'watching' | 'claimed';

const AD_DURATION = 5; // seconds

export function ResultModal({ open, status, coinsAwarded = 0, isPassAndPlay = false }: ResultModalProps) {
  const queryClient = useQueryClient();
  const [adState, setAdState] = useState<AdState>('idle');
  const [countdown, setCountdown] = useState(AD_DURATION);
  const [isLoading, setIsLoading] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Reset ad state whenever modal opens fresh
  useEffect(() => {
    if (open) {
      setAdState('idle');
      setCountdown(AD_DURATION);
      setIsLoading(false);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, []);

  const startAd = () => {
    setAdState('watching');
    setCountdown(AD_DURATION);
    timerRef.current = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          claimDoubleCoins();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const claimDoubleCoins = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('chess_token');
      const res = await fetch('/api/game/double-win-coins', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ amount: coinsAwarded }),
      });
      if (res.ok) {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
      }
    } catch {
      // silently fail — UI still shows claimed state
    } finally {
      setIsLoading(false);
      setAdState('claimed');
    }
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
              <span className="text-yellow-500 font-bold font-sans">+{coinsAwarded}</span>
            </div>
          )}

          {!isPassAndPlay && status === 'lose' && (
            <div className="flex items-center gap-2 bg-red-500/10 px-4 py-2 rounded-full border border-red-500/20 mb-4">
              <span className="text-red-500 font-sans font-medium">Lost 1 Life</span>
            </div>
          )}

          {/* ── Watch Ad (2x Coins) button — always visible on win ── */}
          {showDoubleCoinsButton && (
            <div className="w-full mb-4">
              {adState === 'idle' && (
                <Button
                  onClick={startAd}
                  className="w-full h-12 bg-yellow-500 hover:bg-yellow-400 text-zinc-900 font-bold font-sans text-base rounded-xl shadow-lg shadow-yellow-500/20 flex items-center justify-center gap-2 transition-all"
                >
                  <Play className="w-5 h-5 fill-zinc-900 stroke-zinc-900" />
                  Watch Ad (2× Coins)
                </Button>
              )}

              {adState === 'watching' && (
                <div className="w-full h-12 rounded-xl bg-zinc-800 border border-yellow-500/40 flex items-center justify-center gap-3">
                  <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
                  <span className="text-yellow-400 font-sans font-medium">
                    Ad playing… {countdown}s
                  </span>
                  {/* Animated progress bar */}
                  <div className="absolute bottom-0 left-0 h-0.5 bg-yellow-500 transition-all duration-1000"
                    style={{ width: `${((AD_DURATION - countdown) / AD_DURATION) * 100}%` }} />
                </div>
              )}

              {adState === 'claimed' && (
                <div className="w-full h-12 rounded-xl bg-green-500/10 border border-green-500/30 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-green-400" />
                  <span className="text-green-400 font-sans font-semibold">
                    +{coinsAwarded} bonus coins added!
                  </span>
                </div>
              )}
            </div>
          )}

          <div className="flex gap-4 w-full justify-center">
            <Link href="/home" className="w-full">
              <Button className="w-full bg-zinc-800 text-zinc-100 hover:bg-zinc-700 font-sans">
                Main Menu
              </Button>
            </Link>
            {!isPassAndPlay && (
              <Link href="/campaign" className="w-full">
                <Button className="w-full bg-[#4A2C0A] hover:bg-[#3A2208] text-[#E6CBA8] font-sans border border-[#2A1703]">
                  Campaign
                </Button>
              </Link>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
