/**
 * KenZen Sudoku — Move Recorder
 * 
 * Module E: Every user action logged to local SQLite with:
 * gameId, userId, cellIndex, value, action_type, timestamp, elapsed_ms.
 * 
 * The move log is IMMUTABLE — append-only.
 * No UPDATE or DELETE operations permitted.
 * 
 * Pure TypeScript — no React Native imports.
 */

import type { ActionType, Move } from '../../types';

// ─── Move Storage Interface ───────────────────────────────────

export interface MoveStorage {
  /** Append a move to the log. */
  appendMove(move: Move): Promise<void>;
  
  /** Retrieve all moves for a game, ordered by elapsed_ms. */
  getMovesForGame(gameId: string): Promise<Move[]>;
  
  /** Get the total move count for a game. */
  getMoveCount(gameId: string): Promise<number>;
}

// ─── Move Recorder ────────────────────────────────────────────

export class MoveRecorder {
  private gameId: string;
  private userId: string;
  private gameStartMs: number;
  private storage: MoveStorage;
  private moveBuffer: Move[] = [];
  
  constructor(
    gameId: string,
    userId: string,
    gameStartMs: number,
    storage: MoveStorage,
  ) {
    this.gameId = gameId;
    this.userId = userId;
    this.gameStartMs = gameStartMs;
    this.storage = storage;
  }
  
  /**
   * Record a cell placement.
   */
  async recordPlace(cellIndex: number, value: number): Promise<Move> {
    return this.recordAction(cellIndex, value, 'place');
  }
  
  /**
   * Record a cell erasure.
   */
  async recordErase(cellIndex: number): Promise<Move> {
    return this.recordAction(cellIndex, 0, 'erase');
  }
  
  /**
   * Record a pencil mark toggle.
   */
  async recordPencil(cellIndex: number, value: number): Promise<Move> {
    return this.recordAction(cellIndex, value, 'pencil');
  }
  
  /**
   * Get all recorded moves for this game.
   */
  async getMoves(): Promise<Move[]> {
    return this.storage.getMovesForGame(this.gameId);
  }
  
  /**
   * Get the in-memory move buffer (for fast access without DB read).
   */
  getBuffer(): ReadonlyArray<Move> {
    return this.moveBuffer;
  }
  
  private async recordAction(
    cellIndex: number,
    value: number,
    actionType: ActionType,
  ): Promise<Move> {
    // Validate inputs
    if (cellIndex < 0 || cellIndex > 80) {
      throw new Error(`Invalid cell index: ${cellIndex}`);
    }
    if (actionType === 'place' && (value < 1 || value > 9)) {
      throw new Error(`Invalid placement value: ${value}`);
    }
    if (actionType === 'pencil' && (value < 1 || value > 9)) {
      throw new Error(`Invalid pencil mark value: ${value}`);
    }
    
    const now = Date.now();
    const move: Move = {
      id: generateMoveId(),
      gameId: this.gameId,
      userId: this.userId,
      cellIndex,
      value,
      actionType,
      timestampMs: now,
      elapsedMs: now - this.gameStartMs,
    };
    
    // Append to storage (immutable — no update/delete)
    await this.storage.appendMove(move);
    
    // Keep in buffer
    this.moveBuffer.push(move);
    
    return move;
  }
}

// ─── In-Memory Move Storage (for testing) ─────────────────────

export class InMemoryMoveStorage implements MoveStorage {
  private moves: Move[] = [];
  
  async appendMove(move: Move): Promise<void> {
    this.moves.push({ ...move });
  }
  
  async getMovesForGame(gameId: string): Promise<Move[]> {
    return this.moves
      .filter(m => m.gameId === gameId)
      .sort((a, b) => a.elapsedMs - b.elapsedMs);
  }
  
  async getMoveCount(gameId: string): Promise<number> {
    return this.moves.filter(m => m.gameId === gameId).length;
  }
  
  /** Test helper: attempt to update a move (should be rejected in production). */
  async attemptUpdate(_moveId: string, _newValue: number): Promise<never> {
    throw new Error('IMMUTABLE: Move records cannot be updated.');
  }
  
  /** Test helper: attempt to delete a move (should be rejected in production). */
  async attemptDelete(_moveId: string): Promise<never> {
    throw new Error('IMMUTABLE: Move records cannot be deleted.');
  }
}

// ─── Helpers ──────────────────────────────────────────────────

let moveCounter = 0;

function generateMoveId(): string {
  moveCounter++;
  const timestamp = Date.now().toString(36);
  const counter = moveCounter.toString(36).padStart(4, '0');
  const random = Math.random().toString(36).substring(2, 6);
  return `mv_${timestamp}_${counter}_${random}`;
}
