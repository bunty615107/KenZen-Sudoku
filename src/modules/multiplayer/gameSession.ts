/**
 * KenZen Sudoku — Multiplayer Game Session
 * 
 * Manages the active P2P session, dispatching moves, handling heartbeats,
 * and dealing with disconnects gracefully.
 */

import { wifiManager } from './wifiDirect';
import { bluetoothManager } from './bluetooth';
import { validateMessage, createMessage } from './protocol';
import type { GameMessage, CellValue } from '../../types';

export type TransportLayer = 'WIFI' | 'BLUETOOTH';

export class GameSession {
  private transport: TransportLayer;
  private isConnected = false;
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private lastHeartbeatReceived = Date.now();
  
  // Callbacks
  private onMoveReceived?: (index: number, value: CellValue) => void;
  private onPlayerDisconnected?: () => void;
  private onGameSync?: (boardState: string) => void;

  constructor(transport: TransportLayer) {
    this.transport = transport;
  }

  /**
   * Starts the session and registers listeners on the active transport layer.
   */
  start(): void {
    this.isConnected = true;
    this.lastHeartbeatReceived = Date.now();
    
    const messageHandler = (rawMsg: string) => {
      try {
        const msg = JSON.parse(rawMsg);
        if (validateMessage(msg)) {
          this.handleIncomingMessage(msg as GameMessage);
        }
      } catch (e) {
        console.error('Failed to parse incoming P2P message', e);
      }
    };

    if (this.transport === 'WIFI') {
      wifiManager.onMessage(messageHandler);
    } else {
      bluetoothManager.onMessage(messageHandler);
    }

    this.startHeartbeat();
  }

  /**
   * Stops the session and disconnects the underlying transport.
   */
  async stop(): Promise<void> {
    this.isConnected = false;
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.transport === 'WIFI') {
      await wifiManager.disconnect();
    } else {
      await bluetoothManager.disconnect();
    }
  }

  // --- External Callbacks Setup ---

  setCallbacks(callbacks: {
    onMove?: (index: number, value: CellValue) => void;
    onDisconnect?: () => void;
    onSync?: (boardState: string) => void;
  }) {
    this.onMoveReceived = callbacks.onMove;
    this.onPlayerDisconnected = callbacks.onDisconnect;
    this.onGameSync = callbacks.onSync;
  }

  // --- Sending ---

  async sendMove(index: number, value: CellValue): Promise<void> {
    const msg = createMessage('MOVE', { index, value });
    await this.transmit(msg);
  }

  async sendSync(boardState: string): Promise<void> {
    const msg = createMessage('SYNC', { boardState });
    await this.transmit(msg);
  }

  // --- Internal Handling ---

  private async transmit(message: GameMessage): Promise<void> {
    if (!this.isConnected) return;
    
    const payload = JSON.stringify(message);
    try {
      if (this.transport === 'WIFI') {
        await wifiManager.send(payload);
      } else {
        await bluetoothManager.send(payload);
      }
    } catch (e) {
      this.handleDisconnection();
    }
  }

  private handleIncomingMessage(msg: GameMessage): void {
    this.lastHeartbeatReceived = Date.now();

    switch (msg.type) {
      case 'HEARTBEAT':
        // Just updates the timestamp above
        break;
      case 'MOVE':
        if (this.onMoveReceived && msg.payload.index !== undefined && msg.payload.value !== undefined) {
          this.onMoveReceived(msg.payload.index, msg.payload.value as CellValue);
        }
        break;
      case 'SYNC':
        if (this.onGameSync && msg.payload.boardState !== undefined) {
          this.onGameSync(msg.payload.boardState);
        }
        break;
      case 'DISCONNECT':
        this.handleDisconnection();
        break;
    }
  }

  private startHeartbeat(): void {
    // Send heartbeat every 5 seconds
    this.heartbeatInterval = setInterval(async () => {
      if (!this.isConnected) return;
      
      const now = Date.now();
      // If we haven't received a message (or heartbeat) in 15 seconds, assume disconnected
      if (now - this.lastHeartbeatReceived > 15000) {
        this.handleDisconnection();
        return;
      }

      await this.transmit(createMessage('HEARTBEAT', {}));
    }, 5000);
  }

  private handleDisconnection(): void {
    if (!this.isConnected) return;
    this.isConnected = false;
    
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    if (this.onPlayerDisconnected) {
      this.onPlayerDisconnected();
    }
    
    this.stop().catch(console.error);
  }
}
