import { LinkManager, LinkPayload } from '../../../src/modules/multiplayer/linkManager';

describe('LinkManager (Signed JWT Tests)', () => {
  const mockPayload: Omit<LinkPayload, 'exp'> = {
    gameId: 'game-123',
    puzzle: '123456789'.padEnd(81, '.'),
    difficulty: 'zen',
    seed: 'mock-seed',
  };

  it('generates a valid signed link', () => {
    const link = LinkManager.generateShareLink(mockPayload);
    expect(link).toContain('kenzen://play?token=');
    
    // Test that the token has 3 parts (header.payload.signature)
    const token = link.split('token=')[1];
    expect(token.split('.').length).toBe(3);
  });

  it('successfully verifies an untampered link', () => {
    const link = LinkManager.generateShareLink(mockPayload);
    const decoded = LinkManager.verifyShareLink(link);
    
    expect(decoded.gameId).toBe(mockPayload.gameId);
    expect(decoded.puzzle).toBe(mockPayload.puzzle);
    expect(decoded.difficulty).toBe(mockPayload.difficulty);
    expect(decoded.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
  });

  it('rejects a tampered payload', () => {
    const link = LinkManager.generateShareLink(mockPayload);
    const token = link.split('token=')[1];
    const [header, payload, signature] = token.split('.');
    
    // Tamper with the payload
    const tamperedPayload = Buffer.from(JSON.stringify({
      ...mockPayload,
      difficulty: 'bushido' // Attacking the difficulty
    })).toString('base64url');
    
    const tamperedLink = `kenzen://play?token=${header}.${tamperedPayload}.${signature}`;
    
    expect(() => {
      LinkManager.verifyShareLink(tamperedLink);
    }).toThrow('Invalid signature');
  });

  it('rejects missing tokens', () => {
    expect(() => {
      LinkManager.verifyShareLink('kenzen://play?other=param');
    }).toThrow('Invalid link: missing token');
  });

  it('rejects malformed tokens', () => {
    expect(() => {
      LinkManager.verifyShareLink('kenzen://play?token=header.payloadOnly');
    }).toThrow('Invalid token structure');
  });
});
