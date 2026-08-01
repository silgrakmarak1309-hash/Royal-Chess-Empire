import React, { useState } from 'react';
import { ChessBoard } from '@/components/chess-board';
import { GameHeader } from '@/components/game-header';
import { ResultModal } from '@/components/result-modal';
import { AdModal } from '@/components/ad-modal';
import { useAdMob } from '@/hooks/use-admob';

export function PassPlayGame() {
  const [showAd, setShowAd] = useState(false);
  const [showResult, setShowResult] = useState(false);
  const [gameResult, setGameResult] = useState<'win' | 'lose' | 'draw'>('draw');

  const { showAd: triggerAdMob } = useAdMob({
    onRewarded: () => {},
    onError: (err) => console.warn('[AdMob Pass&Play] error:', err)
  });

  const handleMoveCount = (moves: number) => {
    if (moves > 0 && moves % 5 === 0) {
      triggerAdMob();
    }
  };

  const handleGameOver = (result: 'win' | 'lose' | 'draw') => {
    setGameResult(result);
    setShowResult(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col justify-between">
      <GameHeader title="Pass & Play" />
      <main className="flex-1 flex flex-col items-center justify-center p-4">
        <ChessBoard
          isPassAndPlay={true}
          onGameOver={handleGameOver}
          onMove={handleMoveCount}
        />
      </main>
      <ResultModal
        open={showResult}
        status={gameResult}
        isPassAndPlay={true}
      />
      <AdModal isOpen={showAd} onClose={() => setShowAd(false)} />
    </div>
  );
}
