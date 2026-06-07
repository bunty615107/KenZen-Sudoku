/**
 * KenZen Sudoku — Puzzle Generator
 * 
 * Deterministic + stochastic hybrid generator:
 * 1. Generate a complete valid solution using DLX
 * 2. Remove cells using difficulty-specific removal algorithm
 * 3. Validate uniqueness after each removal
 * 4. Seed with cryptographically random 128-bit salt
 * 
 * Pure TypeScript — no React Native imports. Fully testable with Jest.
 */

import { DLXSolver, dlxSolutionToGrid, hasUniqueSolution, isValidGrid } from './dlx';
import type { Difficulty, PuzzleString } from '../../types';
import { DIFFICULTY_GIVENS } from '../../types';

// ─── Crypto-safe Random Number Generator ──────────────────────

/**
 * Generate a cryptographically random 128-bit salt as hex string.
 * Falls back to Math.random if crypto is not available (test environments).
 */
export function generateSalt(): string {
  try {
    // Use crypto.getRandomValues if available (React Native / modern environments)
    if (typeof globalThis.crypto !== 'undefined' && globalThis.crypto.getRandomValues) {
      const bytes = new Uint8Array(16);
      globalThis.crypto.getRandomValues(bytes);
      return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
    }
  } catch {
    // Fall through to Math.random fallback
  }
  
  // Fallback for test environments
  let salt = '';
  for (let i = 0; i < 32; i++) {
    salt += Math.floor(Math.random() * 16).toString(16);
  }
  return salt;
}

/**
 * Seeded PRNG (xoshiro128** algorithm) for deterministic puzzle generation.
 * Seeded from the 128-bit salt.
 */
export class SeededRNG {
  private state: Uint32Array;

  constructor(seed: string) {
    this.state = new Uint32Array(4);
    // Parse seed hex into 4 x 32-bit state values
    for (let i = 0; i < 4; i++) {
      const hex = seed.substring(i * 8, (i + 1) * 8);
      this.state[i] = parseInt(hex, 16) >>> 0;
    }
    // Ensure non-zero state
    if (this.state.every(v => v === 0)) {
      this.state[0] = 0xDEADBEEF;
    }
  }

  /**
   * Generate next random 32-bit integer.
   */
  next(): number {
    const s = this.state;
    const result = (this.rotl(s[1] * 5, 7) * 9) >>> 0;
    const t = s[1] << 9;

    s[2] ^= s[0];
    s[3] ^= s[1];
    s[1] ^= s[2];
    s[0] ^= s[3];
    s[2] ^= t;
    s[3] = this.rotl(s[3], 11);

    return result;
  }

  /**
   * Generate random float in [0, 1).
   */
  nextFloat(): number {
    return (this.next() >>> 0) / 4294967296;
  }

  /**
   * Generate random integer in [min, max] inclusive.
   */
  nextInt(min: number, max: number): number {
    return min + Math.floor(this.nextFloat() * (max - min + 1));
  }

  /**
   * Shuffle array in-place using Fisher-Yates.
   */
  shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = this.nextInt(0, i);
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  private rotl(x: number, k: number): number {
    return ((x << k) | (x >>> (32 - k))) >>> 0;
  }
}

// ─── Complete Grid Generation ─────────────────────────────────

/**
 * Generate a complete valid 9×9 Sudoku grid.
 * Uses DLX to fill an empty board, then shuffles using the seeded RNG.
 */
export function generateCompleteGrid(rng: SeededRNG): number[] {
  // Start with an empty board
  const emptyPuzzle = '0'.repeat(81);
  
  // Create a DLX solver with the empty board
  const solver = new DLXSolver();
  solver.buildMatrix(emptyPuzzle);
  const solutions = solver.solve(1);
  
  if (solutions.length === 0) {
    throw new Error('ENGINE_ERROR: Failed to generate complete grid');
  }
  
  let grid = dlxSolutionToGrid(solutions[0]);
  
  // Apply random transformations to create variety
  grid = applyTransformations(grid, rng);
  
  if (!isValidGrid(grid)) {
    throw new Error('ENGINE_ERROR: Generated grid is invalid after transformations');
  }
  
  return grid;
}

/**
 * Apply symmetry-preserving transformations to a solved grid.
 */
function applyTransformations(grid: number[], rng: SeededRNG): number[] {
  let result = [...grid];
  
  // 1. Permute digits (1-9 mapping)
  const digitMap = rng.shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);
  result = result.map(v => digitMap[v - 1]);
  
  // 2. Shuffle row bands (groups of 3 rows)
  const bandOrder = rng.shuffle([0, 1, 2]);
  let transformed = new Array(81);
  for (let band = 0; band < 3; band++) {
    const srcBand = bandOrder[band];
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        transformed[(band * 3 + r) * 9 + c] = result[(srcBand * 3 + r) * 9 + c];
      }
    }
  }
  result = transformed;
  
  // 3. Shuffle rows within each band
  for (let band = 0; band < 3; band++) {
    const rowOrder = rng.shuffle([0, 1, 2]);
    const bandRows: number[][] = [];
    for (let r = 0; r < 3; r++) {
      const row: number[] = [];
      for (let c = 0; c < 9; c++) {
        row.push(result[(band * 3 + r) * 9 + c]);
      }
      bandRows.push(row);
    }
    for (let r = 0; r < 3; r++) {
      for (let c = 0; c < 9; c++) {
        result[(band * 3 + r) * 9 + c] = bandRows[rowOrder[r]][c];
      }
    }
  }
  
  // 4. Shuffle column stacks (groups of 3 columns)
  const stackOrder = rng.shuffle([0, 1, 2]);
  transformed = new Array(81);
  for (let stack = 0; stack < 3; stack++) {
    const srcStack = stackOrder[stack];
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 9; r++) {
        transformed[r * 9 + (stack * 3 + c)] = result[r * 9 + (srcStack * 3 + c)];
      }
    }
  }
  result = transformed;
  
  // 5. Shuffle columns within each stack
  for (let stack = 0; stack < 3; stack++) {
    const colOrder = rng.shuffle([0, 1, 2]);
    const stackCols: number[][] = [];
    for (let c = 0; c < 3; c++) {
      const col: number[] = [];
      for (let r = 0; r < 9; r++) {
        col.push(result[r * 9 + (stack * 3 + c)]);
      }
      stackCols.push(col);
    }
    for (let c = 0; c < 3; c++) {
      for (let r = 0; r < 9; r++) {
        result[r * 9 + (stack * 3 + c)] = stackCols[colOrder[c]][r];
      }
    }
  }
  
  return result;
}

// ─── Cell Removal (Difficulty-based) ──────────────────────────

/**
 * Remove cells from a complete grid to create a puzzle.
 * Ensures the resulting puzzle has exactly one solution.
 * 
 * @param completeGrid - The solved 81-element grid
 * @param difficulty - Target difficulty level
 * @param rng - Seeded RNG for deterministic removal
 * @returns The puzzle as an 81-element array (0 = empty)
 */
export function removeCells(
  completeGrid: number[],
  difficulty: Difficulty,
  rng: SeededRNG,
): number[] {
  const targetGivens = DIFFICULTY_GIVENS[difficulty];
  const totalCells = 81;
  const cellsToRemove = totalCells - targetGivens;
  
  const puzzle = [...completeGrid];
  
  // Create a shuffled list of cell indices to try removing
  const indices = rng.shuffle(Array.from({ length: 81 }, (_, i) => i));
  
  let removed = 0;
  
  for (const idx of indices) {
    if (removed >= cellsToRemove) break;
    
    const savedValue = puzzle[idx];
    puzzle[idx] = 0;
    
    // Check uniqueness
    const puzzleStr = puzzle.map(v => v.toString()).join('');
    if (hasUniqueSolution(puzzleStr)) {
      removed++;
    } else {
      // Restore — removing this cell would create ambiguity
      puzzle[idx] = savedValue;
    }
  }
  
  // If we couldn't remove enough cells, the puzzle is still valid
  // but may be slightly easier than target
  return puzzle;
}

// ─── Public API ───────────────────────────────────────────────

export interface GeneratedPuzzle {
  puzzle: PuzzleString;
  solution: PuzzleString;
  seed: string;
  difficulty: Difficulty;
  givens: number;
}

/**
 * Generate a new Sudoku puzzle.
 * 
 * @param difficulty - Target difficulty level
 * @param salt - Optional pre-generated salt (for testing). If not provided, generates one.
 * @returns Generated puzzle with solution and metadata
 */
export function generatePuzzle(
  difficulty: Difficulty,
  salt?: string,
): GeneratedPuzzle {
  const seed = salt || generateSalt();
  const rng = new SeededRNG(seed);
  
  // Step 1: Generate a complete valid grid
  const completeGrid = generateCompleteGrid(rng);
  
  // Step 2: Remove cells based on difficulty
  const puzzleGrid = removeCells(completeGrid, difficulty, rng);
  
  // Step 3: Convert to string representation
  const puzzle = puzzleGrid.join('') as PuzzleString;
  const solution = completeGrid.join('') as PuzzleString;
  
  // Count actual givens
  const givens = puzzleGrid.filter(v => v > 0).length;
  
  return {
    puzzle,
    solution,
    seed,
    difficulty,
    givens,
  };
}

/**
 * Validate a puzzle string format.
 */
export function isValidPuzzleString(puzzle: string): boolean {
  if (puzzle.length !== 81) return false;
  return /^[0-9]{81}$/.test(puzzle);
}

/**
 * Count the number of given (non-zero) cells in a puzzle string.
 */
export function countGivens(puzzle: PuzzleString): number {
  return puzzle.split('').filter(c => c !== '0').length;
}

/**
 * Convert a puzzle string to a 2D grid for display.
 */
export function puzzleToGrid(puzzle: PuzzleString): number[][] {
  const grid: number[][] = [];
  for (let row = 0; row < 9; row++) {
    const rowArr: number[] = [];
    for (let col = 0; col < 9; col++) {
      rowArr.push(parseInt(puzzle[row * 9 + col], 10));
    }
    grid.push(rowArr);
  }
  return grid;
}
