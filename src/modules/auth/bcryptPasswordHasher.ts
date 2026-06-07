/**
 * KenZen Sudoku — Bcrypt Password Hasher
 * 
 * Implements PasswordHasher using bcryptjs.
 */

import bcrypt from 'bcryptjs';
import type { PasswordHasher } from './authService';

export class BcryptPasswordHasher implements PasswordHasher {
  private cost: number;

  constructor(cost: number = 12) {
    this.cost = cost;
  }

  async hash(password: string, salt: string): Promise<string> {
    // Note: bcryptjs incorporates the salt into the hash output
    // We generate a proper bcrypt salt using our cost factor, then hash
    return new Promise((resolve, reject) => {
      bcrypt.hash(password, salt, (err, hash) => {
        if (err) reject(err);
        else resolve(hash);
      });
    });
  }

  async verify(password: string, hash: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      bcrypt.compare(password, hash, (err, res) => {
        if (err) reject(err);
        else resolve(res);
      });
    });
  }

  async generateSalt(): Promise<string> {
    return new Promise((resolve, reject) => {
      bcrypt.genSalt(this.cost, (err, salt) => {
        if (err) reject(err);
        else resolve(salt);
      });
    });
  }
}
