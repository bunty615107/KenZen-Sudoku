/**
 * KenZen Sudoku — Zustand Global State Store
 * 
 * Lightweight global state management for the entire app.
 * Handles: auth state, game state, UI state, settings.
 */

import type {
  Board,
  Cell,
  CellValue,
  Difficulty,
  GameConfig,
  GameMode,
  GameState,
  GameStatus,
  LifetimeStats,
  PuzzleString,
  ThemeMode,
  User,
} from '../types';

// ─── Store State Types ────────────────────────────────────────

export interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  isLoading: boolean;
}

export interface GameStoreState {
  currentGame: GameState | null;
  selectedCellIndex: number | null;
  isPencilMode: boolean;
  isHintModalVisible: boolean;
  hintText: string | null;
  isHintLoading: boolean;
}

export interface UIState {
  themeMode: ThemeMode;
  isSoundEnabled: boolean;
  isHapticEnabled: boolean;
  language: 'en' | 'ja';
}

export interface StatsState {
  lifetimeStats: LifetimeStats | null;
}

export interface AppState {
  auth: AuthState;
  game: GameStoreState;
  ui: UIState;
  stats: StatsState;
}

// ─── Initial State ────────────────────────────────────────────

export const initialAuthState: AuthState = {
  isAuthenticated: false,
  user: null,
  token: null,
  isLoading: true,
};

export const initialGameState: GameStoreState = {
  currentGame: null,
  selectedCellIndex: null,
  isPencilMode: false,
  isHintModalVisible: false,
  hintText: null,
  isHintLoading: false,
};

export const initialUIState: UIState = {
  themeMode: 'system',
  isSoundEnabled: true,
  isHapticEnabled: true,
  language: 'en',
};

export const initialStatsState: StatsState = {
  lifetimeStats: null,
};

// ─── Store Actions ────────────────────────────────────────────

export interface AuthActions {
  setAuth: (user: User, token: string) => void;
  clearAuth: () => void;
  setAuthLoading: (loading: boolean) => void;
}

export interface GameActions {
  setCurrentGame: (game: GameState) => void;
  selectCell: (index: number | null) => void;
  placeNumber: (value: CellValue) => void;
  eraseCell: () => void;
  togglePencilMode: () => void;
  togglePencilMark: (value: number) => void;
  useLifeline: () => void;
  showHint: (text: string) => void;
  hideHint: () => void;
  setHintLoading: (loading: boolean) => void;
  updateTimerElapsed: (elapsedMs: number) => void;
  endGame: (status: GameStatus, score: number | null) => void;
  clearGame: () => void;
}

export interface UIActions {
  setThemeMode: (mode: ThemeMode) => void;
  toggleSound: () => void;
  toggleHaptic: () => void;
  setLanguage: (lang: 'en' | 'ja') => void;
}

export interface StatsActions {
  setLifetimeStats: (stats: LifetimeStats) => void;
}

export type StoreActions = AuthActions & GameActions & UIActions & StatsActions;
export type StoreState = AppState & StoreActions;

// ─── Board Helpers ────────────────────────────────────────────

/**
 * Create a Board (array of 81 Cell objects) from a puzzle string.
 */
export function createBoardFromPuzzle(
  puzzle: PuzzleString,
  solution: PuzzleString,
): Board {
  const board: Board = [];
  
  for (let i = 0; i < 81; i++) {
    const value = parseInt(puzzle[i], 10) as CellValue;
    const row = Math.floor(i / 9);
    const col = i % 9;
    const box = Math.floor(row / 3) * 3 + Math.floor(col / 3);
    
    const cell: Cell = {
      index: i,
      value,
      isGiven: value > 0,
      state: value > 0 ? 'locked' : 'normal',
      pencilMarks: new Set(),
      row,
      col,
      box,
    };
    
    board.push(cell);
  }
  
  return board;
}

/**
 * Check if placing a value at a cell creates a conflict.
 */
export function hasConflict(
  board: Board,
  cellIndex: number,
  value: CellValue,
): boolean {
  if (value === 0) return false;
  
  const cell = board[cellIndex];
  
  // Check row
  for (let c = 0; c < 9; c++) {
    const idx = cell.row * 9 + c;
    if (idx !== cellIndex && board[idx].value === value) return true;
  }
  
  // Check column
  for (let r = 0; r < 9; r++) {
    const idx = r * 9 + cell.col;
    if (idx !== cellIndex && board[idx].value === value) return true;
  }
  
  // Check box
  const boxRow = Math.floor(cell.row / 3) * 3;
  const boxCol = Math.floor(cell.col / 3) * 3;
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      const idx = r * 9 + c;
      if (idx !== cellIndex && board[idx].value === value) return true;
    }
  }
  
  return false;
}

/**
 * Check if the board is fully and correctly solved.
 */
export function isBoardComplete(board: Board, solution: PuzzleString): boolean {
  for (let i = 0; i < 81; i++) {
    if (board[i].value === 0) return false;
    if (board[i].value !== parseInt(solution[i], 10)) return false;
  }
  return true;
}
