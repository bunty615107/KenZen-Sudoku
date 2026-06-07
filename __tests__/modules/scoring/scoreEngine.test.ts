/**
 * KenZen Sudoku — Scoring Engine Unit Tests
 * 
 * Tests all formula branches and boundary conditions.
 */

import {
  calculateScore,
  updateLifetimeStats,
  createInitialStats,
  calculateWinRate,
  formatScore,
  formatTime,
} from '../../../src/modules/scoring/scoreEngine';

describe('Score Calculation', () => {
  // ─── Basic Formula ─────────────────────────────────────────

  test('Zen difficulty, unlimited time, no lifelines = 10,000', () => {
    const result = calculateScore('zen', 300, 0, 0);
    expect(result.baseScore).toBe(10000);
    expect(result.difficultyMultiplier).toBe(1.0);
    expect(result.timeMultiplier).toBe(1.0);
    expect(result.lifelinePenalty).toBe(1.0);
    expect(result.finalScore).toBe(10000);
  });

  test('Bushido difficulty, unlimited time, no lifelines = 30,000', () => {
    const result = calculateScore('bushido', 300, 0, 0);
    expect(result.finalScore).toBe(30000);
  });

  test('Warrior difficulty = 1.5× multiplier', () => {
    const result = calculateScore('warrior', 0, 0, 0);
    expect(result.difficultyMultiplier).toBe(1.5);
    expect(result.finalScore).toBe(15000);
  });

  test('Ronin difficulty = 2× multiplier', () => {
    const result = calculateScore('ronin', 0, 0, 0);
    expect(result.difficultyMultiplier).toBe(2.0);
    expect(result.finalScore).toBe(20000);
  });

  // ─── Time Multiplier ──────────────────────────────────────

  test('50% time used = 0.5 time multiplier', () => {
    const result = calculateScore('zen', 300, 600, 0);
    expect(result.timeMultiplier).toBe(0.5);
    expect(result.finalScore).toBe(5000);
  });

  test('100% time used = 0.1 minimum time multiplier', () => {
    const result = calculateScore('zen', 600, 600, 0);
    expect(result.timeMultiplier).toBe(0.1);
    expect(result.finalScore).toBe(1000);
  });

  test('time exceeding max still uses 0.1 minimum', () => {
    const result = calculateScore('zen', 700, 600, 0);
    expect(result.timeMultiplier).toBe(0.1);
  });

  test('0 seconds elapsed = 1.0 time multiplier', () => {
    const result = calculateScore('zen', 0, 600, 0);
    expect(result.timeMultiplier).toBe(1.0);
    expect(result.finalScore).toBe(10000);
  });

  // ─── Lifeline Penalty ─────────────────────────────────────

  test('1 lifeline = 0.85 penalty', () => {
    const result = calculateScore('zen', 0, 0, 1);
    expect(result.lifelinePenalty).toBe(0.85);
    expect(result.finalScore).toBe(8500);
  });

  test('2 lifelines = 0.85^2 = 0.7225 penalty', () => {
    const result = calculateScore('zen', 0, 0, 2);
    expect(result.lifelinePenalty).toBeCloseTo(0.7225, 3);
    expect(result.finalScore).toBe(Math.round(10000 * 0.7225));
  });

  // ─── Combined Scenarios ────────────────────────────────────

  test('Bushido, 50% time, 1 lifeline', () => {
    const result = calculateScore('bushido', 300, 600, 1);
    // 10000 × 3.0 × 0.5 × 0.85 = 12,750
    expect(result.finalScore).toBe(12750);
  });

  test('Ronin, 80% time used, 2 lifelines', () => {
    const result = calculateScore('ronin', 480, 600, 2);
    // 10000 × 2.0 × 0.2 × 0.7225 = 2,890
    expect(result.finalScore).toBe(Math.round(10000 * 2.0 * 0.2 * 0.7225));
  });
});

// ─── Lifetime Stats ──────────────────────────────────────────

describe('Lifetime Stats', () => {
  test('creates initial stats with all zeros', () => {
    const stats = createInitialStats('user1');
    expect(stats.totalGamesPlayed).toBe(0);
    expect(stats.winStreak).toBe(0);
    expect(stats.longestWinStreak).toBe(0);
    expect(stats.bestTimeZenMs).toBeNull();
  });

  test('updates stats on AI win', () => {
    const initial = createInitialStats('user1');
    const updated = updateLifetimeStats(initial, {
      won: true,
      difficulty: 'zen',
      opponentType: 'ai',
      score: 10000,
      elapsedMs: 120000,
    });

    expect(updated.totalGamesPlayed).toBe(1);
    expect(updated.totalGamesWonAi).toBe(1);
    expect(updated.winStreak).toBe(1);
    expect(updated.longestWinStreak).toBe(1);
    expect(updated.bestTimeZenMs).toBe(120000);
  });

  test('resets win streak on loss', () => {
    let stats = createInitialStats('user1');
    stats = updateLifetimeStats(stats, {
      won: true, difficulty: 'zen', opponentType: 'ai', score: 10000, elapsedMs: 120000,
    });
    stats = updateLifetimeStats(stats, {
      won: true, difficulty: 'zen', opponentType: 'ai', score: 9000, elapsedMs: 180000,
    });
    expect(stats.winStreak).toBe(2);
    expect(stats.longestWinStreak).toBe(2);

    stats = updateLifetimeStats(stats, {
      won: false, difficulty: 'ronin', opponentType: 'ai', score: 0, elapsedMs: 300000,
    });
    expect(stats.winStreak).toBe(0);
    expect(stats.longestWinStreak).toBe(2); // Preserved
    expect(stats.totalGamesLost).toBe(1);
  });

  test('updates best time only on wins', () => {
    let stats = createInitialStats('user1');
    stats = updateLifetimeStats(stats, {
      won: true, difficulty: 'warrior', opponentType: null, score: 15000, elapsedMs: 300000,
    });
    expect(stats.bestTimeWarriorMs).toBe(300000);

    stats = updateLifetimeStats(stats, {
      won: true, difficulty: 'warrior', opponentType: null, score: 14000, elapsedMs: 200000,
    });
    expect(stats.bestTimeWarriorMs).toBe(200000); // Improved
  });

  test('calculates win rate correctly', () => {
    let stats = createInitialStats('user1');
    stats.totalGamesPlayed = 10;
    stats.totalGamesWonAi = 6;
    stats.totalGamesWonHuman = 1;
    stats.totalGamesLost = 3;

    expect(calculateWinRate(stats)).toBe(70);
  });

  test('win rate is 0 when no games played', () => {
    const stats = createInitialStats('user1');
    expect(calculateWinRate(stats)).toBe(0);
  });
});

// ─── Formatting ──────────────────────────────────────────────

describe('Formatting', () => {
  test('formats score with commas', () => {
    expect(formatScore(10000)).toBe('10,000');
    expect(formatScore(30000)).toBe('30,000');
  });

  test('formats time as MM:SS', () => {
    expect(formatTime(0)).toBe('00:00');
    expect(formatTime(60000)).toBe('01:00');
    expect(formatTime(3661000)).toBe('61:01');
  });
});
