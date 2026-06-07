/**
 * KenZen Sudoku — Deep Link Manager
 * 
 * Generates and verifies shareable game links using signed JWTs.
 * The payload contains the puzzle configuration so friends can play the exact same puzzle.
 */

import crypto from 'react-native-quick-crypto';
import type { Difficulty } from '../../types';

// In production, this would be an obfuscated key injected at build time,
// or fetched dynamically. For now, we use a static app-level secret.
const APP_SECRET = 'kenzen_bushido_secret_key_001';

export interface LinkPayload {
  gameId: string;
  puzzle: string;
  difficulty: Difficulty;
  seed: string;
  exp: number; // Expiration timestamp
}

export class LinkManager {
  /**
   * Generates a signed deep link for sharing a puzzle.
   */
  static generateShareLink(payload: Omit<LinkPayload, 'exp'>): string {
    const exp = Math.floor(Date.now() / 1000) + (60 * 60 * 24 * 7); // 7 days expiration
    const fullPayload: LinkPayload = { ...payload, exp };
    
    // Create JWT
    const header = { alg: 'HS256', typ: 'JWT' };
    const encodedHeader = this.base64urlEncode(JSON.stringify(header));
    const encodedPayload = this.base64urlEncode(JSON.stringify(fullPayload));
    
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    const signature = this.signString(signatureInput, APP_SECRET);
    
    const jwt = `${signatureInput}.${signature}`;
    
    return `kenzen://play?token=${jwt}`;
  }

  /**
   * Verifies and decodes a shared deep link.
   * Throws an error if the signature is invalid or the link has expired.
   */
  static verifyShareLink(link: string): LinkPayload {
    const url = new URL(link);
    const token = url.searchParams.get('token');
    
    if (!token) {
      throw new Error('Invalid link: missing token');
    }
    
    const parts = token.split('.');
    if (parts.length !== 3) {
      throw new Error('Invalid token structure');
    }
    
    const [encodedHeader, encodedPayload, signature] = parts;
    const signatureInput = `${encodedHeader}.${encodedPayload}`;
    
    const expectedSignature = this.signString(signatureInput, APP_SECRET);
    
    // Timing-safe comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expectedSignature))) {
      throw new Error('Invalid signature. The scroll has been tampered with.');
    }
    
    const payloadStr = Buffer.from(encodedPayload, 'base64url').toString('utf8');
    const payload: LinkPayload = JSON.parse(payloadStr);
    
    if (payload.exp < Math.floor(Date.now() / 1000)) {
      throw new Error('The scroll has expired. Its wisdom is lost to time.');
    }
    
    return payload;
  }

  private static base64urlEncode(str: string): string {
    return Buffer.from(str)
      .toString('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }

  private static signString(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret)
      .update(data)
      .digest('base64')
      .replace(/=/g, '')
      .replace(/\+/g, '-')
      .replace(/\//g, '_');
  }
}
