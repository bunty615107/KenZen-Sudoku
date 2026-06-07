/**
 * KenZen Sudoku — SLM (Small Language Model) Module
 * 
 * Module D: On-device inference for hints and AI commentary.
 * 
 * The SLM is sandboxed — no file system, no network, no other module access.
 * Includes prompt injection guard: strips all characters outside
 * printable ASCII + JP Unicode ranges before passing to the model.
 */

import type { HintRequest, HintResponse, PuzzleString } from '../../types';

// ─── System Prompt (hardcoded, not user-modifiable) ───────────

export const SENSEI_SYSTEM_PROMPT = 
  'You are Sensei — the spirit of a Bushido master inhabiting this Sudoku game. ' +
  'You speak only in brief, cryptic, haiku-like wisdom. Never reveal the exact answer. ' +
  'Guide, do not solve. Respond in 1–3 short lines.';

// ─── Prompt Injection Guard ───────────────────────────────────

/**
 * Allowed character ranges:
 * - Printable ASCII: U+0020 to U+007E
 * - Japanese Hiragana: U+3040 to U+309F
 * - Japanese Katakana: U+30A0 to U+30FF
 * - CJK Unified Ideographs: U+4E00 to U+9FFF
 * - CJK Punctuation: U+3000 to U+303F
 * - Fullwidth Forms: U+FF00 to U+FFEF
 */
const ALLOWED_RANGES: Array<[number, number]> = [
  [0x0020, 0x007E],  // Printable ASCII
  [0x3000, 0x303F],  // CJK Punctuation
  [0x3040, 0x309F],  // Hiragana
  [0x30A0, 0x30FF],  // Katakana
  [0x4E00, 0x9FFF],  // CJK Ideographs
  [0xFF00, 0xFFEF],  // Fullwidth Forms
];

/**
 * Check if a character code point is in the allowed range.
 */
function isAllowedChar(codePoint: number): boolean {
  return ALLOWED_RANGES.some(
    ([start, end]) => codePoint >= start && codePoint <= end
  );
}

/**
 * Sanitise user-derived input before passing to the SLM.
 * Strips all characters outside allowed ranges.
 * Enforces maximum input length.
 */
export function sanitiseInput(input: string, maxLength: number = 1024): string {
  if (!input) return '';
  
  const sanitised: string[] = [];
  let length = 0;
  
  for (const char of input) {
    if (length >= maxLength) break;
    
    const codePoint = char.codePointAt(0);
    if (codePoint !== undefined && isAllowedChar(codePoint)) {
      sanitised.push(char);
      length++;
    }
  }
  
  return sanitised.join('');
}

// ─── Hint Prompt Builder ──────────────────────────────────────

/**
 * Build the inference prompt for a hint request.
 */
export function buildHintPrompt(request: HintRequest): string {
  const sanitisedBoard = sanitiseInput(request.boardState, 81);
  const row = Math.floor(request.targetCell / 9) + 1;
  const col = (request.targetCell % 9) + 1;
  
  return [
    SENSEI_SYSTEM_PROMPT,
    '',
    `Board state: ${sanitisedBoard}`,
    `The student struggles at row ${row}, column ${col}.`,
    `Difficulty: ${request.difficulty}`,
    '',
    'Sensei speaks:',
  ].join('\n');
}

// ─── SLM Interface ────────────────────────────────────────────
// Actual ONNX Runtime integration will be a native module bridge

export interface SLMInferenceEngine {
  /**
   * Run inference on the SLM model.
   * Must run on a background thread.
   */
  generate(prompt: string, maxTokens: number): Promise<string>;
  
  /**
   * Check if the model is loaded and ready.
   */
  isReady(): boolean;
  
  /**
   * Load the model from bundled assets.
   */
  loadModel(): Promise<void>;
  
  /**
   * Unload the model to free memory.
   */
  unloadModel(): Promise<void>;
}

// ─── Hint Service ─────────────────────────────────────────────

export class HintService {
  private engine: SLMInferenceEngine;
  
  constructor(engine: SLMInferenceEngine) {
    this.engine = engine;
  }
  
  /**
   * Generate a hint for the player.
   * Returns a haiku-style hint from the Sensei.
   */
  async generateHint(request: HintRequest): Promise<HintResponse> {
    const startTime = Date.now();
    
    // Build sanitised prompt
    const prompt = buildHintPrompt(request);
    
    // Run inference (background thread)
    const rawResponse = await this.engine.generate(prompt, 64);
    
    // Sanitise output as well
    const text = sanitiseInput(rawResponse, 256).trim();
    
    const generationTimeMs = Date.now() - startTime;
    
    return {
      text: text || 'The path reveals itself to those who wait.',
      generationTimeMs,
    };
  }
}

// ─── Mock SLM Engine (for testing and development) ────────────

export class MockSLMEngine implements SLMInferenceEngine {
  private ready = false;
  
  private hints = [
    'Look where water meets stone —\nthe empty cell awaits\nits destined number.',
    'In the third house,\nonly one warrior remains\nunclaimed by shadow.',
    'Row five whispers:\n"Count what is missing"\nand truth emerges.',
    'The column stands tall,\nfour absences create one truth —\nfind the lonely path.',
    'Where three boxes meet,\na single number hides its face —\nbrush away the dust.',
    'Patience, young one.\nThe answer sleeps in the grid —\nlet your eyes rest wide.',
  ];
  
  async generate(_prompt: string, _maxTokens: number): Promise<string> {
    // Simulate inference delay (200-500ms in mock)
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300));
    return this.hints[Math.floor(Math.random() * this.hints.length)];
  }
  
  isReady(): boolean {
    return this.ready;
  }
  
  async loadModel(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 100));
    this.ready = true;
  }
  
  async unloadModel(): Promise<void> {
    this.ready = false;
  }
}

// ─── Dwell Time Heuristic ─────────────────────────────────────

const DWELL_TIME_THRESHOLD_MS = 45000; // 45 seconds

/**
 * Check if the player has been struggling with a cell.
 * Used to infer which cell to provide a hint for.
 */
export function isPlayerStruggling(
  cellSelectionTimestamp: number,
  currentTime: number = Date.now(),
): boolean {
  return (currentTime - cellSelectionTimestamp) > DWELL_TIME_THRESHOLD_MS;
}
