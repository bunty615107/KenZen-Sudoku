/**
 * KenZen Sudoku — DLX Solver Unit Tests
 * 
 * Tests for the Dancing Links exact cover solver.
 * Validates: solution correctness, uniqueness checking, grid validation.
 */

import { DLXSolver, dlxSolutionToGrid, solvePuzzle, hasUniqueSolution, isValidGrid } from '../../../src/modules/engine/dlx';

describe('DLX Solver', () => {
  // ─── Known Puzzles ──────────────────────────────────────────

  const EASY_PUZZLE = '530070000600195000098000060800060003400803001700020006060000280000419005000080079';
  const EASY_SOLUTION = '534678912672195348198342567859761423426853791713924856961537284287419635345286179';

  // A puzzle with 17 givens (Bushido difficulty)
  const BUSHIDO_PUZZLE = '000000010400000000020000000000050407008000300001090000300400200050100000000806000';

  // An invalid puzzle (no solution)
  const INVALID_PUZZLE = '110000000000000000000000000000000000000000000000000000000000000000000000000000000';

  // ─── Solution Correctness ───────────────────────────────────

  test('solves a known easy puzzle correctly', () => {
    const solutions = solvePuzzle(EASY_PUZZLE, 1);
    expect(solutions.length).toBe(1);
    expect(solutions[0].join('')).toBe(EASY_SOLUTION);
  });

  test('solution grid is valid', () => {
    const solutions = solvePuzzle(EASY_PUZZLE, 1);
    expect(solutions.length).toBe(1);
    expect(isValidGrid(solutions[0])).toBe(true);
  });

  test('solves a Bushido-level puzzle', () => {
    const solutions = solvePuzzle(BUSHIDO_PUZZLE, 1);
    expect(solutions.length).toBe(1);
    expect(isValidGrid(solutions[0])).toBe(true);
  });

  // ─── Uniqueness Checking ────────────────────────────────────

  test('easy puzzle has exactly one solution', () => {
    expect(hasUniqueSolution(EASY_PUZZLE)).toBe(true);
  });

  test('empty board has multiple solutions', () => {
    const emptyPuzzle = '0'.repeat(81);
    const solutions = solvePuzzle(emptyPuzzle, 2);
    expect(solutions.length).toBe(2); // At least 2 solutions
  });

  // ─── Grid Validation ───────────────────────────────────────

  test('validates a correct grid', () => {
    const grid = EASY_SOLUTION.split('').map(Number);
    expect(isValidGrid(grid)).toBe(true);
  });

  test('rejects grid with wrong length', () => {
    expect(isValidGrid([1, 2, 3])).toBe(false);
  });

  test('rejects grid with duplicate in row', () => {
    const grid = EASY_SOLUTION.split('').map(Number);
    grid[1] = grid[0]; // Create duplicate in row 0
    expect(isValidGrid(grid)).toBe(false);
  });

  test('rejects grid with zero values', () => {
    const grid = EASY_SOLUTION.split('').map(Number);
    grid[0] = 0;
    expect(isValidGrid(grid)).toBe(false);
  });

  // ─── Edge Cases ─────────────────────────────────────────────

  test('returns no solutions for invalid puzzle', () => {
    const solutions = solvePuzzle(INVALID_PUZZLE, 1);
    expect(solutions.length).toBe(0);
  });

  test('returns empty array for invalid puzzle uniqueness check', () => {
    expect(hasUniqueSolution(INVALID_PUZZLE)).toBe(false);
  });

  // ─── Performance ───────────────────────────────────────────

  test('solves easy puzzle in under 500ms', () => {
    const start = Date.now();
    solvePuzzle(EASY_PUZZLE, 1);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(500);
  });

  test('solves Bushido puzzle in under 2000ms', () => {
    const start = Date.now();
    solvePuzzle(BUSHIDO_PUZZLE, 1);
    const elapsed = Date.now() - start;
    expect(elapsed).toBeLessThan(2000);
  });
});
