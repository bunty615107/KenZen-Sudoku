/**
 * KenZen Sudoku — Bluetooth RFCOMM Protocol
 * 
 * Manages Bluetooth device discovery, connection, and serial communication.
 */

import RNBluetoothClassic, {
  BluetoothDevice,
  BluetoothEventSubscription,
} from 'react-native-bluetooth-classic';

type MessageHandler = (message: string) => void;

export class BluetoothManager {
  private connectedDevice: BluetoothDevice | null = null;
  private messageHandler: MessageHandler | null = null;
  private readSub: BluetoothEventSubscription | null = null;

  /**
   * Request enabling Bluetooth.
   */
  async requestEnable(): Promise<boolean> {
    try {
      return await RNBluetoothClassic.requestBluetoothEnabled();
    } catch (e) {
      console.error('Failed to enable Bluetooth', e);
      return false;
    }
  }

  /**
   * Get paired devices (Bushido mode only supports playing with bonded peers).
   */
  async getPairedDevices(): Promise<BluetoothDevice[]> {
    try {
      return await RNBluetoothClassic.getBondedDevices();
    } catch (e) {
      console.error('Failed to get bonded devices', e);
      return [];
    }
  }

  /**
   * Host a game by accepting incoming connections.
   */
  async hostGame(): Promise<void> {
    try {
      this.connectedDevice = await RNBluetoothClassic.accept({
        delimiter: '\n',
      });
      console.log('Accepted connection from', this.connectedDevice?.address);
      this.setupReadListener();
    } catch (e) {
      console.error('Failed to host Bluetooth game', e);
      throw e;
    }
  }

  /**
   * Join a game by connecting to a paired host device.
   */
  async joinGame(deviceAddress: string): Promise<void> {
    try {
      const device = await RNBluetoothClassic.getConnectedDevice(deviceAddress);
      
      // If not already connected, connect to it
      if (!device) {
        this.connectedDevice = await RNBluetoothClassic.connectToDevice(deviceAddress, {
          delimiter: '\n',
        });
      } else {
        this.connectedDevice = device;
      }
      
      console.log('Connected to host:', this.connectedDevice?.address);
      this.setupReadListener();
    } catch (e) {
      console.error('Failed to join Bluetooth game', e);
      throw e;
    }
  }

  async disconnect(): Promise<void> {
    if (this.readSub) {
      this.readSub.remove();
      this.readSub = null;
    }
    
    if (this.connectedDevice) {
      try {
        await this.connectedDevice.disconnect();
        this.connectedDevice = null;
      } catch (e) {
        console.error('Error disconnecting', e);
      }
    }
  }

  onMessage(handler: MessageHandler): void {
    this.messageHandler = handler;
  }

  private setupReadListener(): void {
    if (!this.connectedDevice) return;
    
    this.readSub = this.connectedDevice.onDataReceived((event) => {
      if (this.messageHandler) {
        // Event data contains the message string (up to the delimiter)
        this.messageHandler(event.data);
      }
    });
  }

  async send(message: string): Promise<void> {
    if (!this.connectedDevice) {
      throw new Error('Not connected to a Bluetooth device');
    }
    
    try {
      // Send message with the delimiter
      await this.connectedDevice.write(message + '\n');
    } catch (e) {
      console.error('Failed to send Bluetooth message', e);
      throw e;
    }
  }
}

export const bluetoothManager = new BluetoothManager();
