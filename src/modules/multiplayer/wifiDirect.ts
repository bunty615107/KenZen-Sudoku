/**
 * KenZen Sudoku — Wi-Fi Direct Protocol
 * 
 * Manages Wi-Fi P2P device discovery, connection, and socket communication.
 */

import {
  initialize,
  startDiscoveringPeers,
  stopDiscoveringPeers,
  subscribeOnPeersUpdates,
  subscribeOnConnectionInfoUpdates,
  connect,
  cancelConnect,
  createGroup,
  removeGroup,
  getAvailablePeers,
  getConnectionInfo,
  receiveMessage,
  sendMessage,
} from 'react-native-wifi-p2p';
import type { Device } from 'react-native-wifi-p2p';

type MessageHandler = (message: string) => void;

export class WiFiDirectManager {
  private isInitialized = false;
  private messageHandler: MessageHandler | null = null;
  private connectionSub: any = null;
  private peersSub: any = null;

  async init(): Promise<void> {
    if (this.isInitialized) return;
    try {
      await initialize();
      this.isInitialized = true;
      console.log('Wi-Fi P2P initialized');
    } catch (e) {
      console.error('Failed to initialize Wi-Fi P2P', e);
      throw e;
    }
  }

  async discoverPeers(onPeersFound: (peers: Device[]) => void): Promise<void> {
    await this.init();
    
    this.peersSub = subscribeOnPeersUpdates(({ devices }) => {
      onPeersFound(devices);
    });

    try {
      await startDiscoveringPeers();
    } catch (e) {
      console.error('Failed to start discovering peers', e);
    }
  }

  stopDiscovery(): void {
    if (this.peersSub) {
      this.peersSub.remove();
      this.peersSub = null;
    }
    stopDiscoveringPeers().catch(console.error);
  }

  async hostGame(): Promise<void> {
    await this.init();
    try {
      await createGroup();
      console.log('Created P2P Group');
      // Wait for incoming connections
      this.startListening();
    } catch (e) {
      console.error('Failed to host game', e);
      throw e;
    }
  }

  async joinGame(deviceAddress: string): Promise<void> {
    await this.init();
    try {
      await connect(deviceAddress);
      console.log('Connected to device:', deviceAddress);
      this.startListening();
    } catch (e) {
      console.error('Failed to connect', e);
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    try {
      await removeGroup();
    } catch (e) {
      try {
        await cancelConnect();
      } catch (err) {
        // Ignore
      }
    }
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  private startListening(): void {
    receiveMessage()
      .then((message) => {
        if (this.messageHandler) {
          this.messageHandler(message);
        }
        // Listen for next message recursively
        this.startListening();
      })
      .catch((err) => {
        console.error('Error receiving message', err);
      });
  }

  async send(message: string): Promise<void> {
    try {
      await sendMessage(message);
    } catch (e) {
      console.error('Failed to send message', e);
      throw e;
    }
  }
}

export const wifiManager = new WiFiDirectManager();
