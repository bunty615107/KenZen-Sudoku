import { create } from 'zustand';
import {
  initialAuthState,
  initialGameState,
  initialUIState,
  initialStatsState,
  type StoreState,
  hasConflict,
} from './types';
import type { GameStatus, CellValue, ThemeMode, User, LifetimeStats, GameState } from '../types';

export const useStore = create<StoreState>((set, get) => ({
  // ─── Initial State ──────────────────────────────────────────
  auth: initialAuthState,
  game: initialGameState,
  ui: initialUIState,
  stats: initialStatsState,

  // ─── Auth Actions ───────────────────────────────────────────
  setAuth: (user: User, token: string) =>
    set((state) => ({
      auth: { ...state.auth, isAuthenticated: true, user, token, isLoading: false },
    })),

  clearAuth: () =>
    set(() => ({
      auth: { ...initialAuthState, isLoading: false },
      game: initialGameState,
      stats: initialStatsState,
    })),

  setAuthLoading: (loading: boolean) =>
    set((state) => ({
      auth: { ...state.auth, isLoading: loading },
    })),

  // ─── Game Actions ───────────────────────────────────────────
  setCurrentGame: (currentGame: GameState) =>
    set((state) => ({
      game: { ...state.game, currentGame },
    })),

  selectCell: (index: number | null) =>
    set((state) => ({
      game: { ...state.game, selectedCellIndex: index },
    })),

  placeNumber: (value: CellValue) =>
    set((state) => {
      const { currentGame, selectedCellIndex } = state.game;
      if (!currentGame || selectedCellIndex === null) return state;

      const cell = currentGame.board[selectedCellIndex];
      if (cell.isGiven || cell.state === 'hint-revealed') return state;

      const newBoard = [...currentGame.board];
      const conflict = hasConflict(currentGame.board, selectedCellIndex, value);

      newBoard[selectedCellIndex] = {
        ...cell,
        value,
        state: conflict ? 'conflict' : 'locked',
        pencilMarks: new Set(),
      };

      return {
        game: {
          ...state.game,
          currentGame: { ...currentGame, board: newBoard },
        },
      };
    }),

  eraseCell: () =>
    set((state) => {
      const { currentGame, selectedCellIndex } = state.game;
      if (!currentGame || selectedCellIndex === null) return state;

      const cell = currentGame.board[selectedCellIndex];
      if (cell.isGiven || cell.state === 'hint-revealed') return state;

      const newBoard = [...currentGame.board];
      newBoard[selectedCellIndex] = { ...cell, value: 0, state: 'normal' };

      return {
        game: {
          ...state.game,
          currentGame: { ...currentGame, board: newBoard },
        },
      };
    }),

  togglePencilMode: () =>
    set((state) => ({
      game: { ...state.game, isPencilMode: !state.game.isPencilMode },
    })),

  togglePencilMark: (value: number) =>
    set((state) => {
      const { currentGame, selectedCellIndex } = state.game;
      if (!currentGame || selectedCellIndex === null) return state;

      const cell = currentGame.board[selectedCellIndex];
      if (cell.isGiven || cell.value > 0 || cell.state === 'hint-revealed') return state;

      const newMarks = new Set(cell.pencilMarks);
      if (newMarks.has(value)) {
        newMarks.delete(value);
      } else {
        newMarks.add(value);
      }

      const newBoard = [...currentGame.board];
      newBoard[selectedCellIndex] = { ...cell, pencilMarks: newMarks };

      return {
        game: {
          ...state.game,
          currentGame: { ...currentGame, board: newBoard },
        },
      };
    }),

  useLifeline: () =>
    set((state) => {
      const { currentGame } = state.game;
      if (!currentGame || currentGame.lifelinesUsed >= 3) return state;

      return {
        game: {
          ...state.game,
          currentGame: { ...currentGame, lifelinesUsed: currentGame.lifelinesUsed + 1 },
        },
      };
    }),

  showHint: (text: string) =>
    set((state) => ({
      game: { ...state.game, isHintModalVisible: true, hintText: text, isHintLoading: false },
    })),

  hideHint: () =>
    set((state) => ({
      game: { ...state.game, isHintModalVisible: false, hintText: null },
    })),

  setHintLoading: (loading: boolean) =>
    set((state) => ({
      game: { ...state.game, isHintLoading: loading },
    })),

  updateTimerElapsed: (elapsedMs: number) =>
    set((state) => {
      const { currentGame } = state.game;
      if (!currentGame) return state;

      return {
        game: {
          ...state.game,
          currentGame: { ...currentGame, timerElapsedMs: elapsedMs },
        },
      };
    }),

  endGame: (status: GameStatus, score: number | null) =>
    set((state) => {
      const { currentGame } = state.game;
      if (!currentGame) return state;

      return {
        game: {
          ...state.game,
          currentGame: {
            ...currentGame,
            status,
            score,
            completedAt: Date.now(),
          },
        },
      };
    }),

  clearGame: () =>
    set((state) => ({
      game: { ...initialGameState },
    })),

  // ─── UI Actions ───────────────────────────────────────────────
  setThemeMode: (mode: ThemeMode) =>
    set((state) => ({
      ui: { ...state.ui, themeMode: mode },
    })),

  toggleSound: () =>
    set((state) => ({
      ui: { ...state.ui, isSoundEnabled: !state.ui.isSoundEnabled },
    })),

  toggleHaptic: () =>
    set((state) => ({
      ui: { ...state.ui, isHapticEnabled: !state.ui.isHapticEnabled },
    })),

  setLanguage: (lang: 'en' | 'ja') =>
    set((state) => ({
      ui: { ...state.ui, language: lang },
    })),

  // ─── Stats Actions ────────────────────────────────────────────
  setLifetimeStats: (lifetimeStats: LifetimeStats) =>
    set((state) => ({
      stats: { ...state.stats, lifetimeStats },
    })),
}));
