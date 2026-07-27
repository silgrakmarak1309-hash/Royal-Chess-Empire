import React, { useState, useEffect } from 'react';
import { Chess, Square } from 'chess.js';
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
      try {
        const move = game.moves({ verbose: true }).find(m => m.from === selectedSquare && m.to === square);
        if (move) {
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

  const renderRanks = orientation === 'w' ? ranks : [...ranks].reverse();
  const renderFiles = orientation === 'w' ? files : [...files].reverse();

  return (
    /* 
      Outer wrapper: fills available width, capped at 560px on larger screens.
      Uses padding to make room for the rank/file labels that sit outside the board grid.
    */
    <div className="w-full select-none" style={{ maxWidth: 'min(100%, 560px)', margin: '0 auto' }}>
      {/* File labels — top */}
      <div className="flex pl-6 pr-0 mb-0.5">
        {renderFiles.map(f => (
          <div key={f} className="flex-1 text-center text-[#8B6914] font-serif text-[10px] sm:text-xs font-semibold">{f}</div>
        ))}
      </div>

      <div className="flex">
        {/* Rank labels — left */}
        <div className="flex flex-col justify-around w-6 shrink-0 pr-1">
          {renderRanks.map(r => (
            <div key={r} className="flex items-center justify-center text-[#8B6914] font-serif text-[10px] sm:text-xs font-semibold" style={{ height: '12.5%' }}>{r}</div>
          ))}
        </div>

        {/* Board grid */}
        <div
          className="flex-1 border-2 border-[#3B1E08] shadow-2xl"
          style={{ boxShadow: '0 4px 24px rgba(0,0,0,0.7), inset 0 1px 0 rgba(255,255,255,0.08)' }}
        >
          <div className="grid grid-cols-8 w-full aspect-square">
            {renderRanks.map((r) =>
              renderFiles.map((f) => {
                const fileIndex = files.indexOf(f);
                const rankIndex = ranks.indexOf(r);
                const square = `${f}${r}` as Square;
                const piece = board[rankIndex][fileIndex];

                const isSelected = selectedSquare === square;
                const isValidMove = validMoves.includes(square);
                const isLastMove = lastMove?.from === square || lastMove?.to === square;

                return (
                  <div
                    key={square}
                    className={twMerge(
                      "relative flex items-center justify-center cursor-pointer select-none",
                      getSquareColor(fileIndex, rankIndex)
                    )}
                    style={{ aspectRatio: '1' }}
                    onClick={() => handleSquareClick(square)}
                  >
                    {/* Highlights */}
                    {isSelected && (
                      <div className="absolute inset-0 bg-[#FFD700] opacity-60 pointer-events-none" />
                    )}
                    {isLastMove && !isSelected && (
                      <div className="absolute inset-0 bg-blue-400 opacity-35 pointer-events-none" />
                    )}

                    {/* Valid move dot */}
                    {isValidMove && !piece && (
                      <div className="absolute z-10 w-[28%] h-[28%] bg-green-700 rounded-full opacity-50 pointer-events-none" />
                    )}
                    {isValidMove && piece && (
                      <div className="absolute inset-0 border-[3px] border-green-600 rounded-sm opacity-60 pointer-events-none z-10" />
                    )}

                    {/* Piece */}
                    {piece && (
                      <span
                        className={twMerge(
                          "relative z-20 leading-none select-none",
                          piece.color === 'w' ? 'chess-piece-white' : 'chess-piece-black'
                        )}
                        style={{
                          fontSize: 'clamp(1.5rem, 5vw, 3rem)',
                          textShadow: piece.color === 'w'
                            ? '0 1px 3px rgba(0,0,0,0.8), 0 0 1px rgba(0,0,0,0.5)'
                            : '0 1px 2px rgba(0,0,0,0.9), 0 0 4px rgba(0,0,0,0.4)',
                          color: piece.color === 'w' ? '#F5F0E8' : '#1A1A2E',
                        }}
                      >
                        {PIECE_SYMBOLS[piece.color][piece.type]}
                      </span>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rank labels — right */}
        <div className="flex flex-col justify-around w-6 shrink-0 pl-1">
          {renderRanks.map(r => (
            <div key={r} className="flex items-center justify-center text-[#8B6914] font-serif text-[10px] sm:text-xs font-semibold" style={{ height: '12.5%' }}>{r}</div>
          ))}
        </div>
      </div>

      {/* File labels — bottom */}
      <div className="flex pl-6 pr-0 mt-0.5">
        {renderFiles.map(f => (
          <div key={f} className="flex-1 text-center text-[#8B6914] font-serif text-[10px] sm:text-xs font-semibold">{f}</div>
        ))}
      </div>
    </div>
  );
}
