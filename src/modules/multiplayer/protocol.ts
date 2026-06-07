/**
 * KenZen Sudoku — Multiplayer Protocol
 * 
 * JSON protocol for Wi-Fi Direct and Bluetooth multiplayer.
 * All messages are schema-validated before processing.
 * Malformed messages never crash the app.
 * 
 * Messages: GAME_START, MOVE, LIFELINE_USED, GAME_END, HEARTBEAT
 * All messages are HMAC-SHA256 signed.
 */

import type { MultiplayerMessage, MultiplayerMessageType } from '../../types';

// ─── Protocol Constants ───────────────────────────────────────

export const HEARTBEAT_INTERVAL_MS = 3000; // Every 3 seconds
export const HEARTBEAT_TIMEOUT_COUNT = 3;  // 3 missed = disconnected
export const GAME_TIMEOUT_MS = 30000;      // 30 second timeout for game operations

// ─── Message Schema Validation ────────────────────────────────

const VALID_MESSAGE_TYPES: Set<string> = new Set([
  'GAME_START',
  'MOVE',
  'LIFELINE_USED',
  'GAME_END',
  'HEARTBEAT',
]);

export interface ProtocolError {
  type: 'MALFORMED_MESSAGE' | 'INVALID_SIGNATURE' | 'UNKNOWN_TYPE' | 'SCHEMA_VIOLATION';
  message: string;
  rawData?: string;
}

/**
 * Validate an incoming message against the protocol schema.
 * Returns the parsed message or a typed error.
 */
export function validateMessage(
  rawData: string,
): { valid: true; message: MultiplayerMessage } | { valid: false; error: ProtocolError } {
  // Input sanitisation
  if (!rawData || typeof rawData !== 'string') {
    return {
      valid: false,
      error: { type: 'MALFORMED_MESSAGE', message: 'Empty or non-string data received.' },
    };
  }
  
  // Max length check (prevent oversized payloads)
  if (rawData.length > 65536) {
    return {
      valid: false,
      error: { type: 'MALFORMED_MESSAGE', message: 'Message exceeds maximum size.' },
    };
  }
  
  // JSON parse
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawData);
  } catch {
    return {
      valid: false,
      error: {
        type: 'MALFORMED_MESSAGE',
        message: 'Invalid JSON.',
        rawData: rawData.substring(0, 200),
      },
    };
  }
  
  // Type checking
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    return {
      valid: false,
      error: { type: 'MALFORMED_MESSAGE', message: 'Message is not a JSON object.' },
    };
  }
  
  const obj = parsed as Record<string, unknown>;
  
  // Required fields
  const requiredFields = ['type', 'gameId', 'senderId', 'timestamp', 'payload', 'hmac'];
  for (const field of requiredFields) {
    if (!(field in obj)) {
      return {
        valid: false,
        error: {
          type: 'SCHEMA_VIOLATION',
          message: `Missing required field: ${field}`,
        },
      };
    }
  }
  
  // Type validation
  if (typeof obj.type !== 'string' || !VALID_MESSAGE_TYPES.has(obj.type)) {
    return {
      valid: false,
      error: {
        type: 'UNKNOWN_TYPE',
        message: `Unknown message type: ${String(obj.type)}`,
      },
    };
  }
  
  if (typeof obj.gameId !== 'string' || obj.gameId.length === 0) {
    return {
      valid: false,
      error: { type: 'SCHEMA_VIOLATION', message: 'Invalid gameId.' },
    };
  }
  
  if (typeof obj.senderId !== 'string' || obj.senderId.length === 0) {
    return {
      valid: false,
      error: { type: 'SCHEMA_VIOLATION', message: 'Invalid senderId.' },
    };
  }
  
  if (typeof obj.timestamp !== 'number' || !Number.isFinite(obj.timestamp)) {
    return {
      valid: false,
      error: { type: 'SCHEMA_VIOLATION', message: 'Invalid timestamp.' },
    };
  }
  
  if (typeof obj.payload !== 'object' || obj.payload === null || Array.isArray(obj.payload)) {
    return {
      valid: false,
      error: { type: 'SCHEMA_VIOLATION', message: 'Invalid payload.' },
    };
  }
  
  if (typeof obj.hmac !== 'string' || obj.hmac.length === 0) {
    return {
      valid: false,
      error: { type: 'SCHEMA_VIOLATION', message: 'Missing HMAC signature.' },
    };
  }
  
  // Type-specific payload validation
  const typeValidation = validatePayloadForType(
    obj.type as MultiplayerMessageType,
    obj.payload as Record<string, unknown>,
  );
  
  if (typeValidation) {
    return { valid: false, error: typeValidation };
  }
  
  return {
    valid: true,
    message: obj as unknown as MultiplayerMessage,
  };
}

/**
 * Validate payload fields based on message type.
 */
function validatePayloadForType(
  type: MultiplayerMessageType,
  payload: Record<string, unknown>,
): ProtocolError | null {
  switch (type) {
    case 'GAME_START':
      if (typeof payload.puzzle !== 'string' || (payload.puzzle as string).length !== 81) {
        return { type: 'SCHEMA_VIOLATION', message: 'GAME_START requires a valid 81-char puzzle.' };
      }
      if (typeof payload.difficulty !== 'string') {
        return { type: 'SCHEMA_VIOLATION', message: 'GAME_START requires a difficulty level.' };
      }
      break;
      
    case 'MOVE':
      if (typeof payload.cellIndex !== 'number' || payload.cellIndex < 0 || payload.cellIndex > 80) {
        return { type: 'SCHEMA_VIOLATION', message: 'MOVE requires a valid cellIndex (0–80).' };
      }
      if (typeof payload.value !== 'number' || payload.value < 0 || payload.value > 9) {
        return { type: 'SCHEMA_VIOLATION', message: 'MOVE requires a valid value (0–9).' };
      }
      break;
      
    case 'LIFELINE_USED':
      if (typeof payload.lifelinesRemaining !== 'number') {
        return { type: 'SCHEMA_VIOLATION', message: 'LIFELINE_USED requires lifelinesRemaining.' };
      }
      break;
      
    case 'GAME_END':
      if (typeof payload.status !== 'string') {
        return { type: 'SCHEMA_VIOLATION', message: 'GAME_END requires a status.' };
      }
      break;
      
    case 'HEARTBEAT':
      // No additional payload required
      break;
  }
  
  return null;
}

/**
 * Create a protocol message (unsigned — HMAC should be applied by the sender).
 */
export function createMessage(
  type: MultiplayerMessageType,
  gameId: string,
  senderId: string,
  payload: Record<string, unknown>,
): Omit<MultiplayerMessage, 'hmac'> {
  return {
    type,
    gameId,
    senderId,
    timestamp: Date.now(),
    payload,
  };
}

/**
 * Serialize a message to JSON for transmission.
 */
export function serializeMessage(message: MultiplayerMessage): string {
  return JSON.stringify(message);
}
