/**
 * KenZen Sudoku — Generator Unit Tests
 * 
 * Tests puzzle generation at all difficulty levels.
 * Validates: unique solution, correct given count, no invalid board states.
 */

import {
  generatePuzzle,
  SeededRNG,
  isValidPuzzleString,
  countGivens,
} from '../../../src/modules/engine/generator';
import { hasUniqueSolution, isValidGrid } from '../../../src/modules/engine/dlx';
import type { Difficulty } from '../../../src/types';
import { DIFFICULTY_GIVENS } from '../../../src/types';

describe('Puzzle Generator', () => {
  // ─── Basic Generation ──────────────────────────────────────

  test.each([
    ['zen', 35],
    ['warrior', 28],
    ['ronin', 22],
  ] as [Difficulty, number][])(
    'generates %s puzzle with approximately %d givens',
    (difficulty, expectedGivens) => {
      const result = generatePuzzle(difficulty);
      const givens = countGivens(result.puzzle);
      
      expect(result.puzzle).toHaveLength(81);
      expect(result.solution).toHaveLength(81);
      expect(isValidPuzzleString(result.puzzle)).toBe(true);
      expect(isValidPuzzleString(result.solution)).toBe(true);
      
      // Allow some tolerance — removal may not always reach exact target
      expect(givens).toBeGreaterThanOrEqual(expectedGivens - 3);
      expect(givens).toBeLessThanOrEqual(expectedGivens + 3);
    },
  );

  // ─── Solution Validity ─────────────────────────────────────

  test('generated solution is a valid complete grid', () => {
    const result = generatePuzzle('zen');
    const solutionGrid = result.solution.split('').map(Number);
    expect(isValidGrid(solutionGrid)).toBe(true);
  });

  test('puzzle has a unique solution', () => {
    const result = generatePuzzle('warrior');
    expect(hasUniqueSolution(result.puzzle)).toBe(true);
  });

  // ─── Seed Determinism ──────────────────────────────────────

  test('same seed produces same puzzle', () => {
    const salt = 'a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6';
    const result1 = generatePuzzle('zen', salt);
    const result2 = generatePuzzle('zen', salt);
    
    expect(result1.puzzle).toBe(result2.puzzle);
    expect(result1.solution).toBe(result2.solution);
  });

  test('different seeds produce different puzzles', () => {
    const result1 = generatePuzzle('zen', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa1');
    const result2 = generatePuzzle('zen', 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa2');
    
    // Extremely unlikely to be the same
    expect(result1.puzzle).not.toBe(result2.puzzle);
  });

  // ─── SeededRNG ─────────────────────────────────────────────

  test('SeededRNG produces deterministic output', () => {
    const rng1 = new SeededRNG('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    const rng2 = new SeededRNG('a1b2c3d4e5f6a7b8c9d0e1f2a3b4c5d6');
    
    for (let i = 0; i < 100; i++) {
      expect(rng1.next()).toBe(rng2.next());
    }
  });

  test('SeededRNG shuffle is deterministic', () => {
    const rng1 = new SeededRNG('1234567890abcdef1234567890abcdef');
    const rng2 = new SeededRNG('1234567890abcdef1234567890abcdef');
    
    const arr1 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    const arr2 = [1, 2, 3, 4, 5, 6, 7, 8, 9];
    
    rng1.shuffle(arr1);
    rng2.shuffle(arr2);
    
    expect(arr1).toEqual(arr2);
  });

  test('SeededRNG nextInt produces values in range', () => {
    const rng = new SeededRNG('deadbeefcafebabe1234567890abcdef');
    
    for (let i = 0; i < 1000; i++) {
      const val = rng.nextInt(1, 9);
      expect(val).toBeGreaterThanOrEqual(1);
      expect(val).toBeLessThanOrEqual(9);
    }
  });

  // ─── Puzzle String Validation ──────────────────────────────

  test('validates correct puzzle strings', () => {
    expect(isValidPuzzleString('0'.repeat(81))).toBe(true);
    expect(isValidPuzzleString('1'.repeat(81))).toBe(true);
  });

  test('rejects invalid puzzle strings', () => {
    expect(isValidPuzzleString('')).toBe(false);
    expect(isValidPuzzleString('0'.repeat(80))).toBe(false);
    expect(isValidPuzzleString('0'.repeat(82))).toBe(false);
    expect(isValidPuzzleString('a'.repeat(81))).toBe(false);
  });

  // ─── Performance ───────────────────────────────────────────

  test('Zen puzzle generates in under 2 seconds', () => {
    const start = Date.now();
    generatePuzzle('zen');
    expect(Date.now() - start).toBeLessThan(2000);
  });

  test('Warrior puzzle generates in under 3 seconds', () => {
    const start = Date.now();
    generatePuzzle('warrior');
    expect(Date.now() - start).toBeLessThan(3000);
  });
});
