/**
 * KenZen Sudoku — Core Type Definitions
 * 
 * All types used across the application. Platform-agnostic,
 * no React Native imports allowed in this file.
 */

// ─── Cell & Board Types ───────────────────────────────────────

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9;

export type CellState = 'normal' | 'selected' | 'conflict' | 'locked' | 'hint-revealed';

export interface Cell {
  index: number;        // 0–80
  value: CellValue;     // 0 = empty
  isGiven: boolean;     // Pre-filled (locked) cell
  state: CellState;
  pencilMarks: Set<number>;
  row: number;          // 0–8
  col: number;          // 0–8
  box: number;          // 0–8 (3×3 sub-grid index)
}

export type Board = Cell[];

/** 81-char string representation (0 = empty) */
export type PuzzleString = string;

// ─── Difficulty ───────────────────────────────────────────────

export type Difficulty = 'zen' | 'warrior' | 'ronin' | 'bushido';

export const DIFFICULTY_GIVENS: Record<Difficulty, number> = {
  zen: 35,
  warrior: 28,
  ronin: 22,
  bushido: 17,
};

export const DIFFICULTY_MULTIPLIER: Record<Difficulty, number> = {
  zen: 1.0,
  warrior: 1.5,
  ronin: 2.0,
  bushido: 3.0,
};

// ─── Game Types ───────────────────────────────────────────────

export type GameMode = 'solo' | 'ai' | 'mp_wifi' | 'mp_bt' | 'mp_link';
export type OpponentType = 'ai' | 'human';
export type GameStatus = 'active' | 'won' | 'lost' | 'abandoned';

export interface GameConfig {
  difficulty: Difficulty;
  mode: GameMode;
  opponentType?: OpponentType;
  timerMaxSeconds: number; // 0 = unlimited
}

export interface GameState {
  id: string;
  userId: string;
  puzzle: PuzzleString;
  solution: PuzzleString;
  currentBoard: Board;
  config: GameConfig;
  seed: string;
  status: GameStatus;
  score: number | null;
  lifelinesUsed: number;
  lifelinesRemaining: number;
  timerElapsedMs: number;
  startedAt: number;
  completedAt: number | null;
}

// ─── Move Types ───────────────────────────────────────────────

export type ActionType = 'place' | 'erase' | 'pencil';

export interface Move {
  id: string;
  gameId: string;
  userId: string;
  cellIndex: number;    // 0–80
  value: number;        // 1–9, or 0 for erase
  actionType: ActionType;
  timestampMs: number;  // Unix ms
  elapsedMs: number;    // Since game start
}

// ─── Auth Types ───────────────────────────────────────────────

export interface User {
  id: string;
  email: string;
  createdAt: number;
}

export interface AuthToken {
  userId: string;
  iat: number;    // issued at (Unix seconds)
  exp: number;    // expires at (Unix seconds)
}

export interface AuthResult {
  success: boolean;
  user?: User;
  token?: string;
  error?: AuthError;
}

export type AuthError =
  | { type: 'INVALID_EMAIL'; message: string }
  | { type: 'WEAK_PASSWORD'; message: string }
  | { type: 'DUPLICATE_EMAIL'; message: string }
  | { type: 'INVALID_CREDENTIALS'; message: string }
  | { type: 'ACCOUNT_LOCKED'; message: string; lockedUntil: number }
  | { type: 'TOKEN_EXPIRED'; message: string }
  | { type: 'TOKEN_INVALID'; message: string }
  | { type: 'RATE_LIMITED'; message: string; retryAfter: number }
  | { type: 'UNKNOWN'; message: string };

// ─── Scoring Types ────────────────────────────────────────────

export interface ScoreCalculation {
  baseScore: number;
  difficultyMultiplier: number;
  timeMultiplier: number;
  lifelinePenalty: number;
  finalScore: number;
}

export interface LifetimeStats {
  userId: string;
  totalGamesPlayed: number;
  totalGamesWonAi: number;
  totalGamesWonHuman: number;
  totalGamesLost: number;
  bestTimeZenMs: number | null;
  bestTimeWarriorMs: number | null;
  bestTimeRoninMs: number | null;
  bestTimeBushidoMs: number | null;
  avgScoreZen: number | null;
  avgScoreWarrior: number | null;
  avgScoreRonin: number | null;
  avgScoreBushido: number | null;
  winStreak: number;
  longestWinStreak: number;
}

// ─── Multiplayer Types ────────────────────────────────────────

export type MultiplayerMessageType =
  | 'GAME_START'
  | 'MOVE'
  | 'LIFELINE_USED'
  | 'GAME_END'
  | 'HEARTBEAT';

export interface MultiplayerMessage {
  type: MultiplayerMessageType;
  gameId: string;
  senderId: string;
  timestamp: number;
  payload: Record<string, unknown>;
  hmac: string;   // HMAC-SHA256 signature
}

export type ConnectionType = 'wifi' | 'bluetooth' | 'link';

export type ConnectionStatus = 'disconnected' | 'scanning' | 'connecting' | 'connected' | 'error';

export interface MultiplayerSession {
  id: string;
  connectionType: ConnectionType;
  status: ConnectionStatus;
  hostId: string;
  guestId: string | null;
  gameId: string | null;
}

// ─── Timer Types ──────────────────────────────────────────────

export const TIMER_OPTIONS = [0, 300, 600, 900, 1200, 1800, 2700, 3600] as const;
export type TimerOption = typeof TIMER_OPTIONS[number];

// ─── Theme Types ──────────────────────────────────────────────

export type ThemeMode = 'light' | 'dark' | 'system';

export interface ThemeColors {
  ink: string;
  paper: string;
  washi: string;
  vermilion: string;
  indigo: string;
  sumi: string;
  gold: string;
}

export interface ThemeTypography {
  gameFont: string;
  uiFont: string;
}

export interface Theme {
  mode: 'light' | 'dark';
  colors: ThemeColors;
  typography: ThemeTypography;
}

// ─── AI Types ─────────────────────────────────────────────────

export interface AIConfig {
  temperature: number;         // τ ∈ [0.05, 0.9]
  suboptimalProbability: number; // 5–15%
  thinkingDelayMean: number;   // μ = 2.3s
  thinkingDelaySigma: number;  // σ = 0.8s
}

export interface AIMove {
  cellIndex: number;
  value: CellValue;
  timestampMs: number;
  elapsedMs: number;
  isSuboptimal: boolean;
}

// ─── SLM Types ────────────────────────────────────────────────

export interface HintRequest {
  boardState: PuzzleString;
  targetCell: number;
  difficulty: Difficulty;
}

export interface HintResponse {
  text: string;
  generationTimeMs: number;
}

// ─── Error Types ──────────────────────────────────────────────

export type AppError =
  | { type: 'DB_ERROR'; message: string }
  | { type: 'AUTH_ERROR'; error: AuthError }
  | { type: 'ENGINE_ERROR'; message: string }
  | { type: 'AI_ERROR'; message: string }
  | { type: 'SLM_ERROR'; message: string }
  | { type: 'MULTIPLAYER_ERROR'; message: string }
  | { type: 'TIMER_ERROR'; message: string }
  | { type: 'UNKNOWN_ERROR'; message: string };
