/**
 * KenZen Sudoku — Timer System
 * 
 * Module F: Configurable countdown timer.
 * - Pre-game timer selection: 5/10/15/20/30/45/60 minutes or unlimited
 * - Timer state persisted every 5 seconds
 * - On expiry: record loss, commit move log, show loss screen
 * - Timer is a scoring input: faster = higher multiplier
 * 
 * Pure TypeScript — no React Native imports.
 */

import type { TimerOption } from '../../types';
import { TIMER_OPTIONS } from '../../types';

// ─── Timer State ──────────────────────────────────────────────

export interface TimerState {
  maxSeconds: number;        // 0 = unlimited
  elapsedMs: number;         // Total elapsed time in ms
  isRunning: boolean;
  isPaused: boolean;
  isExpired: boolean;
  lastTickMs: number;        // Last tick timestamp
  lastPersistMs: number;     // Last time state was persisted to DB
}

// ─── Timer Storage Interface ──────────────────────────────────

export interface TimerStorage {
  persistTimerState(gameId: string, elapsedMs: number): Promise<void>;
  getTimerState(gameId: string): Promise<number | null>; // Returns elapsedMs
}

// ─── Timer Controller ─────────────────────────────────────────

const PERSIST_INTERVAL_MS = 5000; // Persist every 5 seconds

export class TimerController {
  private state: TimerState;
  private gameId: string;
  private storage: TimerStorage | null;
  private tickInterval: ReturnType<typeof setInterval> | null = null;
  private onTick: ((state: TimerState) => void) | null = null;
  private onExpiry: (() => void) | null = null;
  
  constructor(
    gameId: string,
    maxSeconds: number,
    initialElapsedMs: number = 0,
    storage: TimerStorage | null = null,
  ) {
    this.gameId = gameId;
    this.storage = storage;
    this.state = {
      maxSeconds,
      elapsedMs: initialElapsedMs,
      isRunning: false,
      isPaused: false,
      isExpired: false,
      lastTickMs: 0,
      lastPersistMs: 0,
    };
  }
  
  /**
   * Start the timer.
   */
  start(): void {
    if (this.state.isRunning || this.state.isExpired) return;
    
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.lastTickMs = Date.now();
    this.state.lastPersistMs = Date.now();
    
    this.tickInterval = setInterval(() => this.tick(), 100);
  }
  
  /**
   * Pause the timer (e.g., app backgrounded).
   */
  pause(): void {
    if (!this.state.isRunning || this.state.isPaused) return;
    
    // Capture final elapsed time before pausing
    this.tick();
    
    this.state.isPaused = true;
    this.state.isRunning = false;
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    // Persist immediately on pause
    this.persist();
  }
  
  /**
   * Resume after pause.
   */
  resume(): void {
    if (this.state.isRunning || this.state.isExpired) return;
    
    this.state.isRunning = true;
    this.state.isPaused = false;
    this.state.lastTickMs = Date.now();
    
    this.tickInterval = setInterval(() => this.tick(), 100);
  }
  
  /**
   * Stop the timer completely.
   */
  stop(): void {
    this.state.isRunning = false;
    this.state.isPaused = false;
    
    if (this.tickInterval) {
      clearInterval(this.tickInterval);
      this.tickInterval = null;
    }
    
    this.persist();
  }
  
  /**
   * Get current timer state.
   */
  getState(): Readonly<TimerState> {
    return { ...this.state };
  }
  
  /**
   * Get remaining time in milliseconds.
   * Returns Infinity for unlimited timers.
   */
  getRemainingMs(): number {
    if (this.state.maxSeconds === 0) return Infinity;
    
    const maxMs = this.state.maxSeconds * 1000;
    return Math.max(0, maxMs - this.state.elapsedMs);
  }
  
  /**
   * Get remaining percentage (0.0 to 1.0).
   * Returns 1.0 for unlimited timers.
   */
  getRemainingPercentage(): number {
    if (this.state.maxSeconds === 0) return 1.0;
    
    const maxMs = this.state.maxSeconds * 1000;
    return Math.max(0, Math.min(1, 1 - (this.state.elapsedMs / maxMs)));
  }
  
  /**
   * Check if the timer is in the "danger zone" (≤20% remaining).
   */
  isInDangerZone(): boolean {
    if (this.state.maxSeconds === 0) return false;
    return this.getRemainingPercentage() <= 0.2;
  }
  
  /**
   * Register callbacks.
   */
  setCallbacks(
    onTick: (state: TimerState) => void,
    onExpiry: () => void,
  ): void {
    this.onTick = onTick;
    this.onExpiry = onExpiry;
  }
  
  /**
   * Cleanup — must be called when the timer is no longer needed.
   */
  destroy(): void {
    this.stop();
    this.onTick = null;
    this.onExpiry = null;
  }
  
  // ─── Private ──────────────────────────────────────────────
  
  private tick(): void {
    if (!this.state.isRunning || this.state.isPaused) return;
    
    const now = Date.now();
    const delta = now - this.state.lastTickMs;
    this.state.lastTickMs = now;
    this.state.elapsedMs += delta;
    
    // Check expiry
    if (this.state.maxSeconds > 0) {
      const maxMs = this.state.maxSeconds * 1000;
      if (this.state.elapsedMs >= maxMs) {
        this.state.elapsedMs = maxMs;
        this.state.isExpired = true;
        this.stop();
        
        if (this.onExpiry) {
          this.onExpiry();
        }
        return;
      }
    }
    
    // Notify tick
    if (this.onTick) {
      this.onTick({ ...this.state });
    }
    
    // Periodic persist
    if (now - this.state.lastPersistMs >= PERSIST_INTERVAL_MS) {
      this.state.lastPersistMs = now;
      this.persist();
    }
  }
  
  private async persist(): Promise<void> {
    if (this.storage) {
      try {
        await this.storage.persistTimerState(this.gameId, this.state.elapsedMs);
      } catch {
        // Silently fail — timer continues, will retry on next persist interval
      }
    }
  }
}

// ─── Timer Display Formatting ─────────────────────────────────

/**
 * Format remaining time as MM:SS.
 */
export function formatTimerDisplay(remainingMs: number): string {
  if (remainingMs === Infinity) return '∞';
  
  const totalSeconds = Math.ceil(remainingMs / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Get timer option labels for the game setup screen.
 */
export function getTimerOptionLabels(): Array<{ value: TimerOption; label: string }> {
  return TIMER_OPTIONS.map(seconds => ({
    value: seconds as TimerOption,
    label: seconds === 0
      ? '∞ Unlimited'
      : `${Math.floor(seconds / 60)} min`,
  }));
}
