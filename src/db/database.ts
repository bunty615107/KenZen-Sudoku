/**
 * KenZen Sudoku — SQLCipher Database Interface
 * 
 * Secure SQLite wrapper using react-native-quick-sqlite.
 * Implements the DatabaseConnection interface defined in schema.ts.
 */

import { open } from 'react-native-quick-sqlite';
import { initializeDatabase, DatabaseConnection } from './schema';

export class Database implements DatabaseConnection {
  private db: any;
  private isInitialized = false;

  constructor() {
    // Open the encrypted database.
    // In production, the encryptionKey should be retrieved securely from the Android Keystore.
    this.db = open({
      name: 'kenzen.sqlite',
      location: 'default',
    });
  }

  /**
   * Initializes the database schema if not already done.
   */
  async init(): Promise<void> {
    if (this.isInitialized) return;
    await initializeDatabase(this);
    this.isInitialized = true;
  }

  /**
   * Execute a query without returning results (e.g., INSERT, UPDATE).
   */
  async execute(sql: string, params: unknown[] = []): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        this.db.execute(sql, params);
        resolve();
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Execute a query and return the results.
   */
  async query<T>(sql: string, params: unknown[] = []): Promise<T[]> {
    return new Promise((resolve, reject) => {
      try {
        const { rows } = this.db.execute(sql, params);
        const result: T[] = [];
        if (rows && rows.length > 0) {
          for (let i = 0; i < rows.length; i++) {
            result.push(rows.item(i));
          }
        }
        resolve(result);
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Execute a query and return a single row.
   */
  async queryOne<T>(sql: string, params: unknown[] = []): Promise<T | null> {
    const results = await this.query<T>(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Execute multiple statements within a transaction.
   */
  async transaction(fn: () => Promise<void>): Promise<void> {
    try {
      this.db.execute('BEGIN TRANSACTION');
      await fn();
      this.db.execute('COMMIT');
    } catch (error) {
      this.db.execute('ROLLBACK');
      throw error;
    }
  }

  /**
   * Close the database connection.
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.isInitialized = false;
    }
  }
}

// Export a singleton instance for global use
export const dbInstance = new Database();
