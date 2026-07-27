import React, { useState } from "react";
import { Chess } from "chess.js";
import { ChessBoard } from "@/components/chess-board";
import { GameHeader } from "@/components/game-header";
import { ResultModal } from "@/components/result-modal";
import { AdModal } from "@/components/ad-modal";
import { useToast } from "@/hooks/use-toast";

export function PassPlayGame() {
  const { toast } = useToast();

  const [game, setGame] = useState(new Chess());
  const [resultStatus, setResultStatus] = useState<
    "win" | "lose" | "draw" | null
  >(null);
  const [showEndAd, setShowEndAd] = useState(false);
  const [adCompleted, setAdCompleted] = useState(false);

  const checkGameOver = (currGame: Chess) => {
    if (currGame.isGameOver()) {
      setShowEndAd(true);
      if (currGame.isCheckmate()) {
        const didWhiteWin = currGame.turn() === "b";
        setResultStatus(didWhiteWin ? "win" : "lose");
      } else {
        setResultStatus("draw");
      }
    }
  };

  const handleMove = (move: {
    from: string;
    to: string;
    promotion?: string;
  }) => {
    try {
      const newGame = new Chess(game.fen());
      const result = newGame.move(move);
      if (result) {
        setGame(newGame);
        checkGameOver(newGame);
      }
    } catch (e) {
      // Invalid move
    }
  };

  const handleUndoRequest = () => {
    if (game.history().length < 1) {
      toast({ title: "Cannot undo", description: "No moves to undo yet." });
      return;
    }
    const newGame = new Chess(game.fen());
    newGame.undo();
    setGame(newGame);
  };

  const handleEndAdComplete = () => {
    setShowEndAd(false);
    setAdCompleted(true);
  };

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col">
      <GameHeader isPassAndPlay={true} onUndo={handleUndoRequest} />

      <div className="flex-1 flex flex-col items-center justify-center p-1 sm:p-4 w-full">
        <div className="w-full max-w-[95vw] sm:max-w-[520px] mb-2 flex justify-between px-2 opacity-50">
          <div
            className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 transition-opacity"
            style={{ opacity: game.turn() === "b" ? 1 : 0.5 }}
          >
            <div className="w-8 h-8 bg-zinc-800 rounded flex items-center justify-center font-serif text-zinc-100 text-xl">
              ♚
            </div>
            <div className="font-sans">
              <p className="text-sm text-zinc-100 font-medium">Black</p>
            </div>
          </div>
        </div>

        <ChessBoard
          game={game}
          onMove={handleMove}
          disabled={!!resultStatus && !showEndAd}
        />

        <div className="w-full max-w-lg mt-6 flex justify-between px-2">
          <div
            className="flex items-center gap-3 bg-zinc-900 px-4 py-2 rounded-lg border border-zinc-800 transition-opacity"
            style={{ opacity: game.turn() === "w" ? 1 : 0.5 }}
          >
            <div className="w-8 h-8 bg-zinc-200 rounded flex items-center justify-center font-serif text-zinc-900 text-xl">
              ♔
            </div>
            <div className="font-sans">
              <p className="text-sm text-zinc-100 font-medium">White</p>
            </div>
          </div>
        </div>
      </div>

      <AdModal
        open={showEndAd}
        onComplete={handleEndAdComplete}
        title="Advertisement"
      />
      {/* Show result modal only after ad completes */}
      {adCompleted && (
        <ResultModal
          open={true}
          status={resultStatus || "draw"}
          isPassAndPlay={true}
        />
      )}
    </div>
  );
}
