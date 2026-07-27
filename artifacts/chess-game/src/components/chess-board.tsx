import React, { useState, useEffect } from 'react';
import { Chess, Square, Move } from 'chess.js';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

const PIECE_SYMBOLS: Record<string, Record<string, string>> = {
  w: { p: '♙', n: '♘', b: '♗', r: '♖', q: '♕', k: '♔' },
  b: { p: '♟', n: '♞', b: '♝', r: '♜', q: '♛', k: '♚' }
};

interface ChessBoardProps {
  game: Chess;
  onMove: (move: { from: string; to: string; promotion?: string }) => void;
  orientation?: 'w' | 'b';
  disabled?: boolean;
}

export function ChessBoard({ game, onMove, orientation = 'w', disabled = false }: ChessBoardProps) {
  const [selectedSquare, setSelectedSquare] = useState<Square | null>(null);
  const [validMoves, setValidMoves] = useState<Square[]>([]);
  const [board, setBoard] = useState(game.board());
  const [lastMove, setLastMove] = useState<{from: string, to: string} | null>(null);

  // Sync board with game state
  useEffect(() => {
    setBoard(game.board());
    const history = game.history({ verbose: true });
    if (history.length > 0) {
      const last = history[history.length - 1];
      setLastMove({ from: last.from, to: last.to });
    } else {
      setLastMove(null);
    }
  }, [game, game.fen()]);

  const handleSquareClick = (square: Square) => {
    if (disabled) return;

    if (selectedSquare) {
      // Try to move
      try {
        const move = game.moves({ verbose: true }).find(m => m.from === selectedSquare && m.to === square);
        if (move) {
          // If promotion, auto-queen for simplicity
          const moveData = {
            from: selectedSquare,
            to: square,
            promotion: move.promotion ? 'q' : undefined
          };
          onMove(moveData);
          setSelectedSquare(null);
          setValidMoves([]);
          return;
        }
      } catch (e) {
        // invalid move
      }
    }

    // Select piece
    const piece = game.get(square);
    if (piece && piece.color === game.turn()) {
      setSelectedSquare(square);
      const moves = game.moves({ square, verbose: true });
      setValidMoves(moves.map(m => m.to as Square));
    } else {
      setSelectedSquare(null);
      setValidMoves([]);
    }
  };

  const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  const getSquareColor = (fileIndex: number, rankIndex: number) => {
    const isLight = (fileIndex + rankIndex) % 2 === 0;
    return isLight ? 'bg-[#D4A97F]' : 'bg-[#8B5E3C]';
  };

  const renderSquare = (fileIndex: number, rankIndex: number) => {
    const file = files[fileIndex];
    const rank = ranks[rankIndex];
    const square = `${file}${rank}` as Square;
    const piece = board[rankIndex][fileIndex];

    const isSelected = selectedSquare === square;
    const isValidMove = validMoves.includes(square);
    const isLastMove = lastMove?.from === square || lastMove?.to === square;

    return (
      <div
        key={square}
        className={twMerge(
          "relative flex items-center justify-center w-full aspect-square text-4xl sm:text-5xl cursor-pointer select-none",
          getSquareColor(fileIndex, rankIndex),
          isSelected && "after:absolute after:inset-0 after:bg-[#FFD700] after:opacity-60",
          isLastMove && !isSelected && "after:absolute after:inset-0 after:bg-blue-400 after:opacity-40"
        )}
        onClick={() => handleSquareClick(square)}
      >
        {isValidMove && (
          <div className="absolute z-10 w-3 h-3 sm:w-4 sm:h-4 bg-green-500 rounded-full opacity-60 pointer-events-none" />
        )}
        {piece && (
          <span 
            className={twMerge(
              "chess-piece relative z-20 font-serif leading-none",
              piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'
            )}
          >
            {PIECE_SYMBOLS[piece.color][piece.type]}
          </span>
        )}
      </div>
    );
  };

  // Adjust rendering order based on orientation
  const renderRanks = orientation === 'w' ? ranks : [...ranks].reverse();
  const renderFiles = orientation === 'w' ? files : [...files].reverse();

  return (
    <div className="chess-board-outer p-4 sm:p-6 w-full max-w-[520px] mx-auto select-none">
      <div className="chess-board-inner border-2 border-[#1c0e01] bg-[#4A2C0A] relative">
        {/* Top/Bottom File Labels */}
        <div className="absolute -top-5 sm:-top-6 left-0 right-0 flex text-[#E6CBA8] font-serif text-xs sm:text-sm font-semibold px-0.5">
          {renderFiles.map(f => <div key={f} className="flex-1 text-center">{f}</div>)}
        </div>
        <div className="absolute -bottom-5 sm:-bottom-6 left-0 right-0 flex text-[#E6CBA8] font-serif text-xs sm:text-sm font-semibold px-0.5">
          {renderFiles.map(f => <div key={f} className="flex-1 text-center">{f}</div>)}
        </div>

        {/* Left/Right Rank Labels */}
        <div className="absolute top-0 bottom-0 -left-4 sm:-left-5 flex flex-col text-[#E6CBA8] font-serif text-xs sm:text-sm font-semibold py-0.5">
          {renderRanks.map(r => <div key={r} className="flex-1 flex items-center justify-center w-4 sm:w-5">{r}</div>)}
        </div>
        <div className="absolute top-0 bottom-0 -right-4 sm:-right-5 flex flex-col text-[#E6CBA8] font-serif text-xs sm:text-sm font-semibold py-0.5">
          {renderRanks.map(r => <div key={r} className="flex-1 flex items-center justify-center w-4 sm:w-5">{r}</div>)}
        </div>

        {/* Grid */}
        <div className="grid grid-cols-8 grid-rows-8 w-full">
          {renderRanks.map((r) => 
            renderFiles.map((f) => 
              renderSquare(files.indexOf(f), ranks.indexOf(r))
            )
          )}
        </div>
      </div>
    </div>
  );
}
