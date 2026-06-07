/**
 * KenZen Sudoku — Keychain Token Storage
 * 
 * Implements TokenStorage using react-native-keychain.
 */

import * as Keychain from 'react-native-keychain';
import type { TokenStorage } from './authService';

export class KeychainTokenStorage implements TokenStorage {
  private serviceName = 'com.kenzen.sudoku.auth';

  async storeToken(token: string): Promise<void> {
    await Keychain.setGenericPassword('token', token, {
      service: this.serviceName,
      accessible: Keychain.ACCESSIBLE.WHEN_UNLOCKED_THIS_DEVICE_ONLY,
    });
  }

  async getToken(): Promise<string | null> {
    try {
      const credentials = await Keychain.getGenericPassword({
        service: this.serviceName,
      });
      if (credentials) {
        return credentials.password;
      }
      return null;
    } catch (e) {
      console.log('Keychain read error', e);
      return null;
    }
  }

  async clearToken(): Promise<void> {
    await Keychain.resetGenericPassword({
      service: this.serviceName,
    });
  }
}
