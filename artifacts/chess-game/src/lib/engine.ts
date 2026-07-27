import { Chess, Move } from 'chess.js';

// Basic piece values for evaluation
const PIECE_VALUES: Record<string, number> = {
  p: 10,
  n: 30,
  b: 30,
  r: 50,
  q: 90,
  k: 900
};

// Evaluate board from perspective of given color
function evaluateBoard(game: Chess, color: 'w' | 'b'): number {
  let score = 0;
  const board = game.board();
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece) {
        const val = PIECE_VALUES[piece.type];
        if (piece.color === color) score += val;
        else score -= val;
      }
    }
  }
  return score;
}

function minimax(game: Chess, depth: number, isMaximizing: boolean, color: 'w'|'b', alpha: number, beta: number): number {
  if (depth === 0 || game.isGameOver()) {
    if (game.isCheckmate()) {
      return isMaximizing ? -9999 : 9999;
    }
    if (game.isDraw()) return 0;
    return evaluateBoard(game, color);
  }

  const moves = game.moves();
  if (isMaximizing) {
    let maxEval = -Infinity;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, false, color, alpha, beta);
      game.undo();
      maxEval = Math.max(maxEval, ev);
      alpha = Math.max(alpha, ev);
      if (beta <= alpha) break;
    }
    return maxEval;
  } else {
    let minEval = Infinity;
    for (const move of moves) {
      game.move(move);
      const ev = minimax(game, depth - 1, true, color, alpha, beta);
      game.undo();
      minEval = Math.min(minEval, ev);
      beta = Math.min(beta, ev);
      if (beta <= alpha) break;
    }
    return minEval;
  }
}

export function getAIMove(game: Chess, level: number): string | null {
  const moves = game.moves();
  if (moves.length === 0) return null;

  const aiColor = game.turn();

  // Levels 1-20: Random moves
  if (level <= 20) {
    return moves[Math.floor(Math.random() * moves.length)];
  }

  // Levels 21-50: 1-ply (Greedy)
  // Levels 51-100: 2-ply
  const depth = level <= 50 ? 1 : 2;
  
  let bestMove = moves[0];
  let bestValue = -Infinity;

  for (const move of moves) {
    game.move(move);
    // minimax will evaluate the next states (opponent's turn, so isMaximizing=false)
    const boardValue = minimax(game, depth - 1, false, aiColor, -Infinity, Infinity);
    game.undo();

    // Add small random noise to prevent identical games
    const noise = Math.random() * 0.1;
    const finalValue = boardValue + noise;

    if (finalValue > bestValue) {
      bestValue = finalValue;
      bestMove = move;
    }
  }

  return bestMove;
}
