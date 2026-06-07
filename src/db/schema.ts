/**
 * KenZen Sudoku — Database Schema & Migration
 * 
 * All tables encrypted via SQLCipher AES-256.
 * All queries use parameterised bindings — no string concatenation.
 * 
 * This file defines the schema DDL and provides migration utilities.
 */

// ─── Schema Version ───────────────────────────────────────────

export const SCHEMA_VERSION = 1;

// ─── DDL Statements ───────────────────────────────────────────

export const CREATE_TABLES_SQL = `
-- Users table: auth credentials and lockout state
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    salt TEXT NOT NULL,
    security_question TEXT,
    security_pin_hash TEXT,
    failed_login_count INTEGER DEFAULT 0,
    locked_until INTEGER,
    created_at INTEGER NOT NULL,
    updated_at INTEGER NOT NULL
);

-- Games table: all game sessions
CREATE TABLE IF NOT EXISTS games (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    puzzle TEXT NOT NULL,
    solution TEXT NOT NULL,
    difficulty TEXT NOT NULL CHECK(difficulty IN ('zen', 'warrior', 'ronin', 'bushido')),
    seed TEXT NOT NULL,
    mode TEXT NOT NULL CHECK(mode IN ('solo', 'ai', 'mp_wifi', 'mp_bt', 'mp_link')),
    opponent_type TEXT CHECK(opponent_type IN ('ai', 'human')),
    timer_max_seconds INTEGER NOT NULL DEFAULT 0,
    timer_elapsed_ms INTEGER DEFAULT 0,
    status TEXT DEFAULT 'active' CHECK(status IN ('active', 'won', 'lost', 'abandoned')),
    score INTEGER,
    lifelines_used INTEGER DEFAULT 0,
    started_at INTEGER NOT NULL,
    completed_at INTEGER,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Moves table: immutable append-only move log
-- NO UPDATE, NO DELETE triggers enforced at application level
CREATE TABLE IF NOT EXISTS moves (
    id TEXT PRIMARY KEY NOT NULL,
    game_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    cell_index INTEGER NOT NULL CHECK(cell_index >= 0 AND cell_index <= 80),
    value INTEGER NOT NULL CHECK(value >= 0 AND value <= 9),
    action_type TEXT NOT NULL CHECK(action_type IN ('place', 'erase', 'pencil')),
    timestamp_ms INTEGER NOT NULL,
    elapsed_ms INTEGER NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (game_id) REFERENCES games(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Lifetime stats: aggregated per-user statistics
CREATE TABLE IF NOT EXISTS lifetime_stats (
    user_id TEXT PRIMARY KEY NOT NULL,
    total_games_played INTEGER DEFAULT 0,
    total_games_won_ai INTEGER DEFAULT 0,
    total_games_won_human INTEGER DEFAULT 0,
    total_games_lost INTEGER DEFAULT 0,
    best_time_zen_ms INTEGER,
    best_time_warrior_ms INTEGER,
    best_time_ronin_ms INTEGER,
    best_time_bushido_ms INTEGER,
    avg_score_zen REAL,
    avg_score_warrior REAL,
    avg_score_ronin REAL,
    avg_score_bushido REAL,
    win_streak INTEGER DEFAULT 0,
    longest_win_streak INTEGER DEFAULT 0,
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Puzzle history: anti-repetition tracking
CREATE TABLE IF NOT EXISTS puzzle_history (
    id TEXT PRIMARY KEY NOT NULL,
    user_id TEXT NOT NULL,
    puzzle_hash TEXT NOT NULL,
    created_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Settings: user preferences (theme, sound, etc.)
CREATE TABLE IF NOT EXISTS settings (
    user_id TEXT PRIMARY KEY NOT NULL,
    theme_mode TEXT DEFAULT 'system' CHECK(theme_mode IN ('light', 'dark', 'system')),
    sound_enabled INTEGER DEFAULT 1,
    haptic_enabled INTEGER DEFAULT 1,
    language TEXT DEFAULT 'en' CHECK(language IN ('en', 'ja')),
    updated_at INTEGER NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Schema version tracking
CREATE TABLE IF NOT EXISTS schema_version (
    version INTEGER PRIMARY KEY NOT NULL,
    applied_at INTEGER NOT NULL
);
`;

// ─── Indexes ──────────────────────────────────────────────────

export const CREATE_INDEXES_SQL = `
-- Anti-repetition check: fast lookup by user + puzzle hash
CREATE INDEX IF NOT EXISTS idx_puzzle_history_user 
    ON puzzle_history(user_id, puzzle_hash);

-- Move log retrieval: ordered by elapsed time per game
CREATE INDEX IF NOT EXISTS idx_moves_game 
    ON moves(game_id, elapsed_ms);

-- Games by user: for history and stats
CREATE INDEX IF NOT EXISTS idx_games_user 
    ON games(user_id, created_at DESC);

-- Games by status: for active game recovery
CREATE INDEX IF NOT EXISTS idx_games_status 
    ON games(user_id, status);
`;

// ─── Triggers (Enforce Append-Only on moves) ──────────────────

export const CREATE_TRIGGERS_SQL = `
-- Prevent UPDATE on moves table
CREATE TRIGGER IF NOT EXISTS prevent_moves_update
    BEFORE UPDATE ON moves
BEGIN
    SELECT RAISE(ABORT, 'IMMUTABLE: Move records cannot be updated.');
END;

-- Prevent DELETE on moves table
CREATE TRIGGER IF NOT EXISTS prevent_moves_delete
    BEFORE DELETE ON moves
BEGIN
    SELECT RAISE(ABORT, 'IMMUTABLE: Move records cannot be deleted.');
END;
`;

// ─── Database Interface ───────────────────────────────────────

export interface DatabaseConnection {
  execute(sql: string, params?: unknown[]): Promise<void>;
  query<T>(sql: string, params?: unknown[]): Promise<T[]>;
  queryOne<T>(sql: string, params?: unknown[]): Promise<T | null>;
  transaction(fn: () => Promise<void>): Promise<void>;
}

// ─── Migration Runner ─────────────────────────────────────────

export async function initializeDatabase(db: DatabaseConnection): Promise<void> {
  // Enable WAL mode for performance
  await db.execute('PRAGMA journal_mode = WAL;');
  
  // Enable foreign keys
  await db.execute('PRAGMA foreign_keys = ON;');
  
  // Create all tables
  const statements = CREATE_TABLES_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of statements) {
    await db.execute(statement + ';');
  }
  
  // Create indexes
  const indexStatements = CREATE_INDEXES_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of indexStatements) {
    await db.execute(statement + ';');
  }
  
  // Create triggers
  const triggerStatements = CREATE_TRIGGERS_SQL
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));
  
  for (const statement of triggerStatements) {
    await db.execute(statement + ';');
  }
  
  // Record schema version
  await db.execute(
    'INSERT OR REPLACE INTO schema_version (version, applied_at) VALUES (?, ?);',
    [SCHEMA_VERSION, Date.now()],
  );
}

// ─── Parameterised Query Builders ─────────────────────────────
// All queries use parameterised bindings — NEVER string interpolation

export const Queries = {
  // ── Users ──
  insertUser: `INSERT INTO users (id, email, password_hash, salt, created_at, updated_at) 
    VALUES (?, ?, ?, ?, ?, ?);`,
  
  getUserByEmail: `SELECT id, email, password_hash, salt, failed_login_count, locked_until, 
    created_at, updated_at FROM users WHERE email = ?;`,
  
  getUserById: `SELECT id, email, created_at, updated_at FROM users WHERE id = ?;`,
  
  updateFailedLoginCount: `UPDATE users SET failed_login_count = ?, locked_until = ?, 
    updated_at = ? WHERE id = ?;`,
  
  resetFailedLoginCount: `UPDATE users SET failed_login_count = 0, locked_until = NULL, 
    updated_at = ? WHERE id = ?;`,
  
  // ── Games ──
  insertGame: `INSERT INTO games (id, user_id, puzzle, solution, difficulty, seed, mode, 
    opponent_type, timer_max_seconds, started_at, created_at) 
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  
  updateGameStatus: `UPDATE games SET status = ?, score = ?, completed_at = ?, 
    lifelines_used = ?, timer_elapsed_ms = ? WHERE id = ?;`,
  
  updateGameTimer: `UPDATE games SET timer_elapsed_ms = ? WHERE id = ?;`,
  
  getActiveGame: `SELECT * FROM games WHERE user_id = ? AND status = 'active' 
    ORDER BY created_at DESC LIMIT 1;`,
  
  getGameById: `SELECT * FROM games WHERE id = ?;`,
  
  // ── Moves ──
  insertMove: `INSERT INTO moves (id, game_id, user_id, cell_index, value, action_type, 
    timestamp_ms, elapsed_ms, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  
  getMovesForGame: `SELECT * FROM moves WHERE game_id = ? ORDER BY elapsed_ms ASC;`,
  
  getMoveCount: `SELECT COUNT(*) as count FROM moves WHERE game_id = ?;`,
  
  // ── Lifetime Stats ──
  upsertLifetimeStats: `INSERT OR REPLACE INTO lifetime_stats (user_id, total_games_played, 
    total_games_won_ai, total_games_won_human, total_games_lost, best_time_zen_ms, 
    best_time_warrior_ms, best_time_ronin_ms, best_time_bushido_ms, avg_score_zen, 
    avg_score_warrior, avg_score_ronin, avg_score_bushido, win_streak, longest_win_streak, 
    updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?);`,
  
  getLifetimeStats: `SELECT * FROM lifetime_stats WHERE user_id = ?;`,
  
  // ── Puzzle History ──
  insertPuzzleHistory: `INSERT INTO puzzle_history (id, user_id, puzzle_hash, created_at) 
    VALUES (?, ?, ?, ?);`,
  
  checkPuzzleExists: `SELECT COUNT(*) as count FROM puzzle_history 
    WHERE user_id = ? AND puzzle_hash = ?;`,
  
  getRecentPuzzleCount: `SELECT COUNT(*) as count FROM puzzle_history 
    WHERE user_id = ? ORDER BY created_at DESC LIMIT 500;`,
  
  // ── Settings ──
  upsertSettings: `INSERT OR REPLACE INTO settings (user_id, theme_mode, sound_enabled, 
    haptic_enabled, language, updated_at) VALUES (?, ?, ?, ?, ?, ?);`,
  
  getSettings: `SELECT * FROM settings WHERE user_id = ?;`,
};
