/**
 * KenZen Sudoku — SQLite Auth Storage
 * 
 * Implements AuthStorage interface using the SQLCipher database.
 */

import type { AuthStorage } from '../modules/auth/authService';
import type { User } from '../types';
import type { DatabaseConnection } from './schema';
import { Queries } from './schema';

export class SQLiteAuthStorage implements AuthStorage {
  private db: DatabaseConnection;

  constructor(db: DatabaseConnection) {
    this.db = db;
  }

  async createUser(email: string, passwordHash: string, salt: string): Promise<User> {
    const userId = `usr_${Date.now().toString(36)}_${Math.random().toString(36).substr(2, 5)}`;
    const now = Date.now();
    
    await this.db.execute(Queries.insertUser, [
      userId,
      email.toLowerCase(),
      passwordHash,
      salt,
      now,
      now,
    ]);

    return {
      id: userId,
      email: email.toLowerCase(),
      createdAt: now,
    };
  }

  async getUserByEmail(email: string): Promise<{
    user: User;
    passwordHash: string;
    salt: string;
    failedLoginCount: number;
    lockedUntil: number | null;
  } | null> {
    interface UserRow {
      id: string;
      email: string;
      password_hash: string;
      salt: string;
      failed_login_count: number;
      locked_until: number | null;
      created_at: number;
      updated_at: number;
    }

    const row = await this.db.queryOne<UserRow>(Queries.getUserByEmail, [email.toLowerCase()]);
    if (!row) return null;

    return {
      user: {
        id: row.id,
        email: row.email,
        createdAt: row.created_at,
      },
      passwordHash: row.password_hash,
      salt: row.salt,
      failedLoginCount: row.failed_login_count,
      lockedUntil: row.locked_until,
    };
  }

  async updateFailedLoginCount(userId: string, count: number, lockedUntil: number | null): Promise<void> {
    await this.db.execute(Queries.updateFailedLoginCount, [
      count,
      lockedUntil,
      Date.now(),
      userId,
    ]);
  }

  async resetFailedLoginCount(userId: string): Promise<void> {
    await this.db.execute(Queries.resetFailedLoginCount, [Date.now(), userId]);
  }
}
