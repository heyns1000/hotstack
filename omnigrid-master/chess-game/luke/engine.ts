/**
 * Luke Chess Engine
 * E4 Opening Integration for OMNIGRID
 */

export type PieceType = 'pawn' | 'knight' | 'bishop' | 'rook' | 'queen' | 'king';
export type Color = 'white' | 'black';

export interface Piece {
  type: PieceType;
  color: Color;
  position: string; // e.g., 'e4'
  moved: boolean;
}

export interface Move {
  from: string;
  to: string;
  piece: Piece;
  captured?: Piece;
  notation: string; // e.g., 'e4', 'Nf3'
}

export class LukeChessEngine {
  private board: Map<string, Piece> = new Map();
  private moveHistory: Move[] = [];
  private currentTurn: Color = 'white';

  constructor() {
    this.initializeBoard();
  }

  /**
   * Initialize chess board to starting position
   */
  private initializeBoard(): void {
    // White pieces
    this.board.set('a1', { type: 'rook', color: 'white', position: 'a1', moved: false });
    this.board.set('b1', { type: 'knight', color: 'white', position: 'b1', moved: false });
    this.board.set('c1', { type: 'bishop', color: 'white', position: 'c1', moved: false });
    this.board.set('d1', { type: 'queen', color: 'white', position: 'd1', moved: false });
    this.board.set('e1', { type: 'king', color: 'white', position: 'e1', moved: false });
    this.board.set('f1', { type: 'bishop', color: 'white', position: 'f1', moved: false });
    this.board.set('g1', { type: 'knight', color: 'white', position: 'g1', moved: false });
    this.board.set('h1', { type: 'rook', color: 'white', position: 'h1', moved: false });

    // White pawns
    for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      this.board.set(`${file}2`, {
        type: 'pawn',
        color: 'white',
        position: `${file}2`,
        moved: false
      });
    }

    // Black pieces
    this.board.set('a8', { type: 'rook', color: 'black', position: 'a8', moved: false });
    this.board.set('b8', { type: 'knight', color: 'black', position: 'b8', moved: false });
    this.board.set('c8', { type: 'bishop', color: 'black', position: 'c8', moved: false });
    this.board.set('d8', { type: 'queen', color: 'black', position: 'd8', moved: false });
    this.board.set('e8', { type: 'king', color: 'black', position: 'e8', moved: false });
    this.board.set('f8', { type: 'bishop', color: 'black', position: 'f8', moved: false });
    this.board.set('g8', { type: 'knight', color: 'black', position: 'g8', moved: false });
    this.board.set('h8', { type: 'rook', color: 'black', position: 'h8', moved: false });

    // Black pawns
    for (let file of ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']) {
      this.board.set(`${file}7`, {
        type: 'pawn',
        color: 'black',
        position: `${file}7`,
        moved: false
      });
    }
  }

  /**
   * E4 Opening - King's Pawn Game
   */
  executeE4Opening(): Move[] {
    const e4Move = this.makeMove('e2', 'e4');
    if (!e4Move) throw new Error('E4 opening failed');

    return [e4Move];
  }

  /**
   * Make a move on the board
   */
  makeMove(from: string, to: string): Move | null {
    const piece = this.board.get(from);

    if (!piece) {
      console.error(`No piece at ${from}`);
      return null;
    }

    if (piece.color !== this.currentTurn) {
      console.error(`Wrong turn: ${piece.color} vs ${this.currentTurn}`);
      return null;
    }

    if (!this.isValidMove(from, to, piece)) {
      console.error(`Invalid move: ${from} to ${to}`);
      return null;
    }

    // Execute move
    const captured = this.board.get(to);
    this.board.delete(from);
    this.board.set(to, { ...piece, position: to, moved: true });

    // Generate algebraic notation
    const notation = this.generateNotation(piece, from, to, captured);

    const move: Move = {
      from,
      to,
      piece,
      captured,
      notation
    };

    this.moveHistory.push(move);
    this.currentTurn = this.currentTurn === 'white' ? 'black' : 'white';

    return move;
  }

  /**
   * Validate if a move is legal
   */
  private isValidMove(from: string, to: string, piece: Piece): boolean {
    const fromFile = from.charCodeAt(0) - 97; // a=0, b=1, etc.
    const fromRank = parseInt(from[1]) - 1;
    const toFile = to.charCodeAt(0) - 97;
    const toRank = parseInt(to[1]) - 1;

    const fileDiff = Math.abs(toFile - fromFile);
    const rankDiff = Math.abs(toRank - fromRank);

    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? 1 : -1;
        const startRank = piece.color === 'white' ? 1 : 6;

        // Forward move
        if (fileDiff === 0) {
          if (toRank - fromRank === direction && !this.board.has(to)) {
            return true;
          }
          // Double move from start
          if (
            fromRank === startRank &&
            toRank - fromRank === 2 * direction &&
            !this.board.has(to)
          ) {
            return true;
          }
        }

        // Capture move
        if (fileDiff === 1 && toRank - fromRank === direction) {
          const targetPiece = this.board.get(to);
          if (targetPiece && targetPiece.color !== piece.color) {
            return true;
          }
        }

        return false;

      case 'knight':
        return (
          (fileDiff === 2 && rankDiff === 1) || (fileDiff === 1 && rankDiff === 2)
        );

      case 'bishop':
        return fileDiff === rankDiff && this.isPathClear(from, to);

      case 'rook':
        return (
          (fileDiff === 0 || rankDiff === 0) && this.isPathClear(from, to)
        );

      case 'queen':
        return (
          (fileDiff === rankDiff || fileDiff === 0 || rankDiff === 0) &&
          this.isPathClear(from, to)
        );

      case 'king':
        return fileDiff <= 1 && rankDiff <= 1;

      default:
        return false;
    }
  }

  /**
   * Check if path between two squares is clear
   */
  private isPathClear(from: string, to: string): boolean {
    const fromFile = from.charCodeAt(0) - 97;
    const fromRank = parseInt(from[1]) - 1;
    const toFile = to.charCodeAt(0) - 97;
    const toRank = parseInt(to[1]) - 1;

    const fileStep = Math.sign(toFile - fromFile);
    const rankStep = Math.sign(toRank - fromRank);

    let currentFile = fromFile + fileStep;
    let currentRank = fromRank + rankStep;

    while (currentFile !== toFile || currentRank !== toRank) {
      const square = String.fromCharCode(97 + currentFile) + (currentRank + 1);
      if (this.board.has(square)) return false;

      currentFile += fileStep;
      currentRank += rankStep;
    }

    return true;
  }

  /**
   * Generate algebraic notation for a move
   */
  private generateNotation(
    piece: Piece,
    from: string,
    to: string,
    captured?: Piece
  ): string {
    let notation = '';

    // Piece prefix (except pawns)
    if (piece.type !== 'pawn') {
      notation += piece.type[0].toUpperCase();
    }

    // Starting square for ambiguous moves
    notation += from[0];

    // Capture indicator
    if (captured) {
      notation += 'x';
    }

    // Destination square
    notation += to;

    return notation;
  }

  /**
   * Get current board state
   */
  getBoard(): Map<string, Piece> {
    return new Map(this.board);
  }

  /**
   * Get move history
   */
  getMoveHistory(): Move[] {
    return [...this.moveHistory];
  }

  /**
   * Get current turn
   */
  getCurrentTurn(): Color {
    return this.currentTurn;
  }

  /**
   * Display board as ASCII art
   */
  displayBoard(): string {
    let display = '\n  a b c d e f g h\n';

    for (let rank = 7; rank >= 0; rank--) {
      display += `${rank + 1} `;

      for (let file = 0; file < 8; file++) {
        const square = String.fromCharCode(97 + file) + (rank + 1);
        const piece = this.board.get(square);

        if (piece) {
          const symbol = this.getPieceSymbol(piece);
          display += symbol + ' ';
        } else {
          display += '. ';
        }
      }

      display += `${rank + 1}\n`;
    }

    display += '  a b c d e f g h\n';
    return display;
  }

  /**
   * Get piece symbol for display
   */
  private getPieceSymbol(piece: Piece): string {
    const symbols: Record<string, string> = {
      'white-pawn': '♙',
      'white-knight': '♘',
      'white-bishop': '♗',
      'white-rook': '♖',
      'white-queen': '♕',
      'white-king': '♔',
      'black-pawn': '♟',
      'black-knight': '♞',
      'black-bishop': '♝',
      'black-rook': '♜',
      'black-queen': '♛',
      'black-king': '♚'
    };

    return symbols[`${piece.color}-${piece.type}`] || '?';
  }
}

// Export singleton instance
export const lukeChess = new LukeChessEngine();

// Example usage
if (require.main === module) {
  console.log('♟️ Luke Chess Engine initialized');
  console.log(lukeChess.displayBoard());

  console.log('\n🎯 Executing E4 opening...');
  const e4Moves = lukeChess.executeE4Opening();
  console.log('Move:', e4Moves[0].notation);
  console.log(lukeChess.displayBoard());

  console.log('\nMove history:', lukeChess.getMoveHistory());
}
