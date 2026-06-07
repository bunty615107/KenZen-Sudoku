/**
 * KenZen Sudoku — Application Bootstrap
 * 
 * Handles the initialization of Native Modules, Databases, and Services.
 */

import { dbInstance } from './db/database';
import { SQLiteAuthStorage } from './db/sqliteAuthStorage';
import { KeychainTokenStorage } from './modules/auth/keychainTokenStorage';
import { BcryptPasswordHasher } from './modules/auth/bcryptPasswordHasher';
import { AuthService } from './modules/auth/authService';

let authServiceInstance: AuthService | null = null;

export async function bootstrapApp(): Promise<AuthService> {
  if (authServiceInstance) {
    return authServiceInstance;
  }

  console.log('BOOTSTRAP: Initializing SQLite Database...');
  await dbInstance.init();
  console.log('BOOTSTRAP: Database initialized successfully.');

  const authStorage = new SQLiteAuthStorage(dbInstance);
  const tokenStorage = new KeychainTokenStorage();
  const passwordHasher = new BcryptPasswordHasher(12);

  authServiceInstance = new AuthService(authStorage, tokenStorage, passwordHasher);
  console.log('BOOTSTRAP: AuthService instantiated with native bindings.');

  // === INTEGRATION TEST: SQLite & AuthService ===
  if (__DEV__) {
    console.log('--- RUNNING NATIVE INTEGRATION TESTS ---');
    try {
      const testEmail = `test_${Date.now()}@example.com`;
      console.log(`TEST: Registering user ${testEmail}...`);
      const regResult = await authServiceInstance.register(testEmail, 'TestPassw0rd!');
      console.log('TEST: Registration result:', regResult.success);

      if (regResult.success) {
        console.log('TEST: Logging in with new user...');
        const loginResult = await authServiceInstance.login(testEmail, 'TestPassw0rd!');
        console.log('TEST: Login result:', loginResult.success);
        if (loginResult.success) {
          console.log('TEST: Session validation...');
          const session = await authServiceInstance.validateSession();
          console.log('TEST: Session valid?', session.valid);
        }
      }
    } catch (err) {
      console.error('TEST FAILED with error:', err);
    }
    console.log('--- END INTEGRATION TESTS ---');
  }

  return authServiceInstance;
}

export function getAuthService(): AuthService {
  if (!authServiceInstance) {
    throw new Error('AuthService not initialized. Call bootstrapApp() first.');
  }
  return authServiceInstance;
}
