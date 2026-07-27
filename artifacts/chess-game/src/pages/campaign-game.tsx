import React, { useState, useEffect, useRef } from 'react';
import { useRoute } from 'wouter';
import { Chess } from 'chess.js';
import { ChessBoard } from '@/components/chess-board';
import { GameHeader } from '@/components/game-header';
import { ResultModal } from '@/components/result-modal';
import { AdModal } from '@/components/ad-modal';
import { useAuth } from '@/hooks/use-auth';
import { 
  useCompleteCampaignLevel, 
  useLoseCampaignLevel, 
  useConfirmUndo, 
  useUseHint,
  getGetMeQueryKey 
} from '@workspace/api-client-react';
import { useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';
import { getAIMove } from '@/lib/engine';

export function CampaignGame() {
  const [, params] = useRoute('/game/campaign/:level');
  const level = parseInt(params?.level || '1', 10);
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const [game, setGame] = useState(new Chess());
  const [isPlayerTurn, setIsPlayerTurn] = useState(true);
  const [resultStatus, setResultStatus] = useState<'win' | 'lose' | 'draw' | null>(null);
  const [showUndoAd, setShowUndoAd] = useState(false);
  const [earnedCoins, setEarnedCoins] = useState(0);

  const completeMutation = useCompleteCampaignLevel();
  const loseMutation = useLoseCampaignLevel();
  const undoMutation = useConfirmUndo();
  const hintMutation = useUseHint();

  // Engine turn
  useEffect(() => {
    if (!isPlayerTurn && !game.isGameOver()) {
      const timer = setTimeout(() => {
        const aiMove = getAIMove(game, level);
        if (aiMove) {
          const newGame = new Chess(game.fen());
          newGame.move(aiMove);
          setGame(newGame);
        }
        setIsPlayerTurn(true);
        checkGameOver(game);
      }, 500); // Small delay for realism
      return () => clearTimeout(timer);
    }
  }, [isPlayerTurn, game, level]);

  const checkGameOver = (currGame: Chess) => {
    if (currGame.isGameOver()) {
      if (currGame.isCheckmate()) {
        const didPlayerWin = currGame.turn() === 'b'; // if it's black's turn and checkmate, white (player) won
        if (didPlayerWin) {
          completeMutation.mutate({ data: { level } }, {
            onSuccess: (res) => {
              setEarnedCoins(res.coinsAdded);
              setResultStatus('win');
              queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            },
            onError: () => {
              setResultStatus('win');
            }
          });
        } else {
          loseMutation.mutate(undefined, {
            onSuccess: () => {
              setResultStatus('lose');
              queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
            },
            onError: () => setResultStatus('lose')
          });
        }
      } else {
        setResultStatus('draw');
      }
    }
  };

  const handleMove = (move: { from: string; to: string; promotion?: string }) => {
    if (!isPlayerTurn) return;
    
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      if (result) {
        setGame(newGame);
        setIsPlayerTurn(false);
        checkGameOver(newGame);
      }
    } catch (e) {
      // Invalid move
    }
  };

  const handleUndoRequest = () => {
    if (game.history().length < 2) {
      toast({ title: "Cannot undo", description: "No moves to undo yet." });
      return;
    }
    setShowUndoAd(true);
  };

  const handleUndoAdComplete = () => {
    setShowUndoAd(false);
    undoMutation.mutate(undefined, {
      onSuccess: (res) => {
        if (res.allowed) {
          const newGame = new Chess(game.fen());
          newGame.undo(); // undo AI move
          newGame.undo(); // undo player move
          setGame(newGame);
          setIsPlayerTurn(true);
        }
      },
      onError: (err) => {
        toast({ title: "Undo failed", description: err.message, variant: "destructive" });
      }
    });
  };

  const handleHint = () => {
    if ((user?.coins || 0) < 50) {
      toast({ title: "Not enough coins", description: "A hint costs 50 coins.", variant: "destructive" });
      return;
    }
    hintMutation.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
        const hintMove = getAIMove(game, 100); // High level AI for hint
        if (hintMove) {
          toast({ title: "Hint", description: `Try moving to ${hintMove.to}` });
        }
      },
      onError: (err) => {
        toast({ title: "Hint failed", description: err.message, variant: "destructive" });
      }
    });
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <GameHeader 
        lives={user?.lives || 0} 
        coins={user?.coins || 0} 
        onUndo={handleUndoRequest}
        onHint={handleHint}
      />
      
<div className="w-full select-none" style={{ maxWidth: 'min(98vw, 82vh)', margin: '0 auto' }}>
      <div className="w-full max-w-[95vw] sm:max-w-[520px] mb-2 flex justify-between px-2">
          <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
            <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center font-serif text-zinc-100 text-xl">
              ♚
            </div>
            <div className="font-sans">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">Opponent</p>
              <p className="text-sm text-zinc-100 font-medium">Level {level} AI</p>
            </div>
          </div>
        </div>

        <ChessBoard game={game} onMove={handleMove} disabled={!isPlayerTurn || !!resultStatus} />

        <div className="w-full max-w-lg mt-6 flex justify-between px-2">
           <div className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800">
            <div className="w-8 h-8 bg-zinc-200 rounded flex items-center justify-center font-serif text-zinc-900 text-xl">
              ♔
            </div>
            <div className="font-sans">
              <p className="text-xs text-zinc-400 uppercase tracking-wider">You</p>
              <p className="text-sm text-zinc-100 font-medium">{user?.email.split('@')[0] || 'Player'}</p>
            </div>
          </div>
        </div>
      </div>

      <AdModal open={showUndoAd} onComplete={handleUndoAdComplete} title="Watch Ad to Undo" />
      <ResultModal open={!!resultStatus} status={resultStatus || 'draw'} coinsAwarded={earnedCoins} />
    </div>
  );
}
