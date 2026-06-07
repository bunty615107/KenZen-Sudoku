/**
 * KenZen Sudoku — Scoring Engine
 * 
 * Score formula (per game):
 *   FinalScore = BaseScore × DifficultyMultiplier × TimeMultiplier × LifelinePenalty
 * 
 * - BaseScore = 10,000
 * - DifficultyMultiplier: Zen=1×, Warrior=1.5×, Ronin=2×, Bushido=3×
 * - TimeMultiplier = max(0.1, 1 − (elapsedSeconds / maxSeconds))
 *   (If unlimited timer, TimeMultiplier = 1.0)
 * - LifelinePenalty = 0.85 per lifeline used
 * 
 * Pure TypeScript — no React Native imports.
 */

import type { Difficulty, ScoreCalculation, LifetimeStats } from '../../types';
import { DIFFICULTY_MULTIPLIER } from '../../types';

// ─── Constants ────────────────────────────────────────────────

const BASE_SCORE = 10000;
const LIFELINE_PENALTY_FACTOR = 0.85;
const MIN_TIME_MULTIPLIER = 0.1;

// ─── Score Calculation ────────────────────────────────────────

/**
 * Calculate the score for a completed game.
 */
export function calculateScore(
  difficulty: Difficulty,
  elapsedSeconds: number,
  maxSeconds: number,
  lifelinesUsed: number,
): ScoreCalculation {
  const difficultyMultiplier = DIFFICULTY_MULTIPLIER[difficulty];
  
  // Time multiplier
  let timeMultiplier: number;
  if (maxSeconds === 0) {
    // Unlimited timer — full time bonus
    timeMultiplier = 1.0;
  } else {
    timeMultiplier = Math.max(MIN_TIME_MULTIPLIER, 1 - (elapsedSeconds / maxSeconds));
  }
  
  // Lifeline penalty
  const lifelinePenalty = Math.pow(LIFELINE_PENALTY_FACTOR, lifelinesUsed);
  
  // Final score
  const finalScore = Math.round(
    BASE_SCORE * difficultyMultiplier * timeMultiplier * lifelinePenalty
  );
  
  return {
    baseScore: BASE_SCORE,
    difficultyMultiplier,
    timeMultiplier: Math.round(timeMultiplier * 10000) / 10000,
    lifelinePenalty: Math.round(lifelinePenalty * 10000) / 10000,
    finalScore,
  };
}

// ─── Lifetime Stats Aggregation ───────────────────────────────

/**
 * Update lifetime stats after a game.
 */
export function updateLifetimeStats(
  current: LifetimeStats,
  gameResult: {
    won: boolean;
    difficulty: Difficulty;
    opponentType: 'ai' | 'human' | null;
    score: number;
    elapsedMs: number;
  },
): LifetimeStats {
  const updated = { ...current };
  
  updated.totalGamesPlayed += 1;
  
  if (gameResult.won) {
    if (gameResult.opponentType === 'ai') {
      updated.totalGamesWonAi += 1;
    } else if (gameResult.opponentType === 'human') {
      updated.totalGamesWonHuman += 1;
    } else {
      // Solo win counts towards AI wins (playing against the puzzle)
      updated.totalGamesWonAi += 1;
    }
    updated.winStreak += 1;
    updated.longestWinStreak = Math.max(updated.longestWinStreak, updated.winStreak);
  } else {
    updated.totalGamesLost += 1;
    updated.winStreak = 0;
  }
  
  // Update best time per difficulty (only for wins)
  if (gameResult.won) {
    const bestTimeKey = `bestTime${capitalize(gameResult.difficulty)}Ms` as keyof LifetimeStats;
    const currentBest = updated[bestTimeKey] as number | null;
    if (currentBest === null || gameResult.elapsedMs < currentBest) {
      (updated as any)[bestTimeKey] = gameResult.elapsedMs;
    }
  }
  
  // Update average score per difficulty
  const avgScoreKey = `avgScore${capitalize(gameResult.difficulty)}` as keyof LifetimeStats;
  const currentAvg = updated[avgScoreKey] as number | null;
  if (currentAvg === null) {
    (updated as any)[avgScoreKey] = gameResult.score;
  } else {
    // Running average
    const gamesAtDifficulty = getGamesAtDifficulty(updated, gameResult.difficulty);
    (updated as any)[avgScoreKey] = 
      ((currentAvg * (gamesAtDifficulty - 1)) + gameResult.score) / gamesAtDifficulty;
  }
  
  return updated;
}

/**
 * Create initial lifetime stats for a new user.
 */
export function createInitialStats(userId: string): LifetimeStats {
  return {
    userId,
    totalGamesPlayed: 0,
    totalGamesWonAi: 0,
    totalGamesWonHuman: 0,
    totalGamesLost: 0,
    bestTimeZenMs: null,
    bestTimeWarriorMs: null,
    bestTimeRoninMs: null,
    bestTimeBushidoMs: null,
    avgScoreZen: null,
    avgScoreWarrior: null,
    avgScoreRonin: null,
    avgScoreBushido: null,
    winStreak: 0,
    longestWinStreak: 0,
  };
}

// ─── Helpers ──────────────────────────────────────────────────

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

function getGamesAtDifficulty(stats: LifetimeStats, difficulty: Difficulty): number {
  // Approximation — in production, track per-difficulty game count
  return stats.totalGamesPlayed;
}

/**
 * Format a score for display.
 */
export function formatScore(score: number): string {
  return score.toLocaleString('en-US');
}

/**
 * Format time duration for display.
 */
export function formatTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate win rate as a percentage.
 */
export function calculateWinRate(stats: LifetimeStats): number {
  if (stats.totalGamesPlayed === 0) return 0;
  const totalWins = stats.totalGamesWonAi + stats.totalGamesWonHuman;
  return Math.round((totalWins / stats.totalGamesPlayed) * 100);
}
