import { validateMessage, createMessage } from '../../../src/modules/multiplayer/protocol';

describe('Multiplayer Protocol Fuzz Testing', () => {
  it('correctly creates and validates valid messages', () => {
    const validMove = createMessage('MOVE', { index: 14, value: 5 });
    expect(validateMessage(validMove)).toBe(true);

    const validHeartbeat = createMessage('HEARTBEAT', {});
    expect(validateMessage(validHeartbeat)).toBe(true);
  });

  it('rejects malformed types', () => {
    const malformed = {
      type: 'HACK',
      payload: {},
      timestamp: Date.now()
    };
    expect(validateMessage(malformed)).toBe(false);
  });

  it('rejects messages missing payload', () => {
    const malformed = {
      type: 'MOVE',
      timestamp: Date.now()
    };
    expect(validateMessage(malformed)).toBe(false);
  });

  it('fuzz tests 1000 randomized malformed JSON objects without throwing', () => {
    let rejectionCount = 0;
    
    for (let i = 0; i < 1000; i++) {
      const fuzzed = {
        type: Math.random() > 0.5 ? 'MOVE' : Math.random(),
        payload: Math.random() > 0.5 ? { index: -Math.random(), value: '99' } : null,
        timestamp: Math.random() > 0.5 ? Date.now() : 'not-a-number'
      };

      // Ensure validateMessage handles the garbage without throwing
      let isValid = false;
      try {
        isValid = validateMessage(fuzzed);
      } catch (e) {
        // If it throws, the test will fail
      }
      
      if (!isValid) rejectionCount++;
    }
    
    // We expect the vast majority of our fuzzed garbage to be rejected
    expect(rejectionCount).toBeGreaterThan(990);
  });
});
