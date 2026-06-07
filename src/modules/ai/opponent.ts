/**
 * KenZen Sudoku — AI Opponent
 * 
 * Deterministic + stochastic hybrid AI that plays Sudoku in parallel
 * with the human player. Uses constraint propagation and stochastic
 * backtracking with configurable temperature.
 * 
 * The AI competes on an identical puzzle configuration, solving in parallel.
 * Its "moves" are timestamped and revealed in the multiplayer view.
 * 
 * Pure TypeScript — no React Native imports. Fully testable with Jest.
 */

import type { AIConfig, AIMove, CellValue, Difficulty, PuzzleString } from '../../types';

// ─── Default AI Configuration ─────────────────────────────────

export function generateAIConfig(): AIConfig {
  // Temperature τ selected from continuous uniform distribution over [0.05, 0.9]
  const temperature = 0.05 + Math.random() * 0.85;
  
  // Suboptimal probability: 5–15%
  const suboptimalProbability = 0.05 + Math.random() * 0.10;
  
  return {
    temperature,
    suboptimalProbability,
    thinkingDelayMean: 2.3,     // seconds
    thinkingDelaySigma: 0.8,    // seconds
  };
}

// ─── Gaussian Random ──────────────────────────────────────────

/**
 * Generate Gaussian-distributed random number using Box-Muller transform.
 */
function gaussianRandom(mean: number, sigma: number): number {
  let u1 = Math.random();
  let u2 = Math.random();
  // Avoid log(0)
  while (u1 === 0) u1 = Math.random();
  
  const z = Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
  return mean + sigma * z;
}

/**
 * Generate the AI's thinking delay for a single move.
 * Gaussian(μ=2.3s, σ=0.8s), clamped to [0.5, 6.0].
 */
export function generateThinkingDelay(config: AIConfig): number {
  const delay = gaussianRandom(config.thinkingDelayMean, config.thinkingDelaySigma);
  return Math.max(0.5, Math.min(6.0, delay));
}

// ─── Constraint Propagation ───────────────────────────────────

interface CandidateGrid {
  values: number[];         // 81 cells, 0 = empty
  candidates: Set<number>[]; // 81 sets of possible values
}

/**
 * Get the row, column, and box peers for a cell index.
 */
function getPeers(index: number): number[] {
  const row = Math.floor(index / 9);
  const col = index % 9;
  const boxRow = Math.floor(row / 3) * 3;
  const boxCol = Math.floor(col / 3) * 3;
  
  const peers = new Set<number>();
  
  // Row peers
  for (let c = 0; c < 9; c++) {
    if (c !== col) peers.add(row * 9 + c);
  }
  
  // Column peers
  for (let r = 0; r < 9; r++) {
    if (r !== row) peers.add(r * 9 + col);
  }
  
  // Box peers
  for (let r = boxRow; r < boxRow + 3; r++) {
    for (let c = boxCol; c < boxCol + 3; c++) {
      if (r !== row || c !== col) peers.add(r * 9 + c);
    }
  }
  
  return Array.from(peers);
}

// Pre-compute peer lists for all 81 cells
const PEERS: number[][] = Array.from({ length: 81 }, (_, i) => getPeers(i));

/**
 * Initialize candidate grid from a puzzle string.
 */
function initCandidates(puzzle: PuzzleString): CandidateGrid {
  const values = puzzle.split('').map(Number);
  const candidates: Set<number>[] = Array.from({ length: 81 }, () => new Set([1, 2, 3, 4, 5, 6, 7, 8, 9]));
  
  // Remove candidates based on given values
  for (let i = 0; i < 81; i++) {
    if (values[i] > 0) {
      candidates[i] = new Set<number>();
      // Remove this value from all peers
      for (const peer of PEERS[i]) {
        candidates[peer].delete(values[i]);
      }
    }
  }
  
  return { values: [...values], candidates };
}

/**
 * Find naked singles (cells with only one candidate).
 */
function findNakedSingles(grid: CandidateGrid): Array<{ index: number; value: number }> {
  const singles: Array<{ index: number; value: number }> = [];
  
  for (let i = 0; i < 81; i++) {
    if (grid.values[i] === 0 && grid.candidates[i].size === 1) {
      const value = Array.from(grid.candidates[i])[0];
      singles.push({ index: i, value });
    }
  }
  
  return singles;
}

/**
 * Find hidden singles (value that can only go in one cell within a unit).
 */
function findHiddenSingles(grid: CandidateGrid): Array<{ index: number; value: number }> {
  const singles: Array<{ index: number; value: number }> = [];
  const found = new Set<number>(); // Avoid duplicates
  
  // Check rows, columns, and boxes
  for (let unit = 0; unit < 27; unit++) {
    const cells: number[] = [];
    
    if (unit < 9) {
      // Row
      for (let c = 0; c < 9; c++) cells.push(unit * 9 + c);
    } else if (unit < 18) {
      // Column
      const col = unit - 9;
      for (let r = 0; r < 9; r++) cells.push(r * 9 + col);
    } else {
      // Box
      const box = unit - 18;
      const boxRow = Math.floor(box / 3) * 3;
      const boxCol = (box % 3) * 3;
      for (let r = boxRow; r < boxRow + 3; r++) {
        for (let c = boxCol; c < boxCol + 3; c++) {
          cells.push(r * 9 + c);
        }
      }
    }
    
    for (let num = 1; num <= 9; num++) {
      const possibleCells = cells.filter(
        idx => grid.values[idx] === 0 && grid.candidates[idx].has(num)
      );
      
      if (possibleCells.length === 1 && !found.has(possibleCells[0])) {
        found.add(possibleCells[0]);
        singles.push({ index: possibleCells[0], value: num });
      }
    }
  }
  
  return singles;
}

/**
 * Apply a move to the candidate grid.
 */
function applyMove(grid: CandidateGrid, index: number, value: number): void {
  grid.values[index] = value;
  grid.candidates[index] = new Set();
  
  for (const peer of PEERS[index]) {
    grid.candidates[peer].delete(value);
  }
}

// ─── AI Solve Strategy ────────────────────────────────────────

export interface AISolveResult {
  moves: AIMove[];
  completed: boolean;
  totalTimeMs: number;
}

/**
 * Run the AI solver on a puzzle, producing a sequence of timed moves.
 * 
 * Strategy:
 * 1. Use constraint propagation (naked singles, hidden singles)
 * 2. When stuck, use stochastic backtracking with temperature τ
 * 3. Introduce deliberate suboptimal moves based on config
 */
export function aiSolve(
  puzzle: PuzzleString,
  config: AIConfig,
  startTimestamp: number = Date.now(),
): AISolveResult {
  const grid = initCandidates(puzzle);
  const moves: AIMove[] = [];
  let elapsedMs = 0;
  let completed = false;
  
  const maxIterations = 500; // Safety limit
  let iterations = 0;
  
  while (iterations < maxIterations) {
    iterations++;
    
    // Check if puzzle is complete
    if (grid.values.every(v => v > 0)) {
      completed = true;
      break;
    }
    
    // Try constraint propagation first
    let move: { index: number; value: number } | null = null;
    let isSuboptimal = false;
    
    // Naked singles
    const nakedSingles = findNakedSingles(grid);
    if (nakedSingles.length > 0) {
      move = nakedSingles[Math.floor(Math.random() * nakedSingles.length)];
    }
    
    // Hidden singles
    if (!move) {
      const hiddenSingles = findHiddenSingles(grid);
      if (hiddenSingles.length > 0) {
        move = hiddenSingles[Math.floor(Math.random() * hiddenSingles.length)];
      }
    }
    
    // Stochastic backtracking when stuck
    if (!move) {
      // Find cell with fewest candidates
      let minCandidates = 10;
      let bestCells: number[] = [];
      
      for (let i = 0; i < 81; i++) {
        if (grid.values[i] === 0 && grid.candidates[i].size > 0) {
          if (grid.candidates[i].size < minCandidates) {
            minCandidates = grid.candidates[i].size;
            bestCells = [i];
          } else if (grid.candidates[i].size === minCandidates) {
            bestCells.push(i);
          }
        }
      }
      
      if (bestCells.length > 0) {
        const cellIdx = bestCells[Math.floor(Math.random() * bestCells.length)];
        const candidateArray = Array.from(grid.candidates[cellIdx]);
        
        // Apply temperature-based selection
        if (config.temperature > 0.5 && candidateArray.length > 1) {
          // Higher temperature = more random selection
          move = {
            index: cellIdx,
            value: candidateArray[Math.floor(Math.random() * candidateArray.length)],
          };
        } else {
          // Lower temperature = pick first candidate (more deterministic)
          move = { index: cellIdx, value: candidateArray[0] };
        }
      }
    }
    
    if (!move) {
      // No valid moves — puzzle state is broken (shouldn't happen with valid puzzles)
      break;
    }
    
    // Deliberate suboptimal move check
    if (Math.random() < config.suboptimalProbability) {
      const candidates = Array.from(grid.candidates[move.index]);
      if (candidates.length > 1) {
        // Pick a wrong candidate deliberately (will need to backtrack later)
        const wrongCandidates = candidates.filter(v => v !== move!.value);
        if (wrongCandidates.length > 0) {
          // Note: in actual gameplay this would create an error that gets corrected
          // For the AI simulation, we just mark it as suboptimal but use the correct value
          isSuboptimal = true;
        }
      }
    }
    
    // Generate thinking delay
    const thinkingDelayMs = generateThinkingDelay(config) * 1000;
    elapsedMs += thinkingDelayMs;
    
    // Record move
    const aiMove: AIMove = {
      cellIndex: move.index,
      value: move.value as CellValue,
      timestampMs: startTimestamp + elapsedMs,
      elapsedMs: Math.round(elapsedMs),
      isSuboptimal,
    };
    moves.push(aiMove);
    
    // Apply move
    applyMove(grid, move.index, move.value);
  }
  
  return {
    moves,
    completed,
    totalTimeMs: Math.round(elapsedMs),
  };
}

/**
 * Calculate the entropy of a sequence of AI moves.
 * H = -Σ p(x) log2(p(x))
 * 
 * Used for validation: entropy should be > 4.5 bits per move
 * across 500 consecutive games.
 */
export function calculateMoveEntropy(moveSequences: AIMove[][]): number {
  if (moveSequences.length === 0) return 0;
  
  // Create move signature: "cellIndex:value" for each move
  const signatureCounts = new Map<string, number>();
  let totalMoves = 0;
  
  for (const sequence of moveSequences) {
    for (const move of sequence) {
      const sig = `${move.cellIndex}:${move.value}`;
      signatureCounts.set(sig, (signatureCounts.get(sig) || 0) + 1);
      totalMoves++;
    }
  }
  
  if (totalMoves === 0) return 0;
  
  // Calculate Shannon entropy
  let entropy = 0;
  for (const count of signatureCounts.values()) {
    const p = count / totalMoves;
    if (p > 0) {
      entropy -= p * Math.log2(p);
    }
  }
  
  return entropy;
}
