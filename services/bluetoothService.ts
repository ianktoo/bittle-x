
import { LogEntry } from '../types';

// --- Web Bluetooth Type Definitions ---
interface BluetoothRemoteGATTCharacteristic extends EventTarget {
  value?: DataView;
  writeValue(value: BufferSource): Promise<void>;
  startNotifications(): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTService {
  getCharacteristic(characteristic: string): Promise<BluetoothRemoteGATTCharacteristic>;
}

interface BluetoothRemoteGATTServer {
  connected: boolean;
  connect(): Promise<BluetoothRemoteGATTServer>;
  disconnect(): void;
  getPrimaryService(service: string): Promise<BluetoothRemoteGATTService>;
}

interface BluetoothDevice extends EventTarget {
  id: string;
  name?: string;
  gatt?: BluetoothRemoteGATTServer;
}
// --------------------------------------

const SERVICE_UUID = '6e400001-b5a3-f393-e0a9-e50e24dcca9e';
const TX_CHARACTERISTIC_UUID = '6e400002-b5a3-f393-e0a9-e50e24dcca9e';
const RX_CHARACTERISTIC_UUID = '6e400003-b5a3-f393-e0a9-e50e24dcca9e';

interface QueueItem {
  data: Uint8Array;
  resolve: () => void;
  reject: (reason?: any) => void;
}

export class BluetoothService {
  private device: BluetoothDevice | null = null;
  private server: BluetoothRemoteGATTServer | null = null;
  private txCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private rxCharacteristic: BluetoothRemoteGATTCharacteristic | null = null;
  private onDisconnectCallback: (() => void) | null = null;
  private onDataReceivedCallback: ((data: string) => void) | null = null;

  private queue: QueueItem[] = [];
  private isWriting: boolean = false;

  async connect(): Promise<void> {
    if (this.device && this.device.gatt?.connected) {
      throw new Error('Already connected');
    }

    if (!(navigator as any).bluetooth) {
      throw new Error('Web Bluetooth is not supported in this browser.');
    }

    try {
      this.device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [SERVICE_UUID],
      });

      if (!this.device) throw new Error('No device selected');

      this.device.removeEventListener('gattserverdisconnected', this.handleDisconnect);
      this.device.addEventListener('gattserverdisconnected', this.handleDisconnect);

      this.server = await this.device.gatt?.connect() || null;
      if (!this.server) throw new Error('Could not connect to GATT server');

      const service = await this.server.getPrimaryService(SERVICE_UUID);

      this.txCharacteristic = await service.getCharacteristic(TX_CHARACTERISTIC_UUID);
      this.rxCharacteristic = await service.getCharacteristic(RX_CHARACTERISTIC_UUID);

      await this.rxCharacteristic.startNotifications();
      this.rxCharacteristic.addEventListener('characteristicvaluechanged', this.handleCharacteristicValueChanged);

    } catch (error: any) {
      // Handle "User cancelled" gracefully
      if (error.name === 'NotFoundError' || String(error).includes("cancelled")) {
        throw new Error("Connection cancelled by user");
      }
      console.error('Bluetooth Connection Error:', error);
      throw error;
    }
  }

  async disconnect() {
    if (this.device && this.device.gatt?.connected) {
      this.device.gatt.disconnect();
    }
    this.handleDisconnect();
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.txCharacteristic) {
      throw new Error('Not connected to device');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\n');

    return new Promise((resolve, reject) => {
      this.queue.push({ data, resolve, reject });
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.isWriting) return;
    this.isWriting = true;

    try {
      while (this.queue.length > 0) {
        const item = this.queue[0];
        if (!this.txCharacteristic) {
           item.reject(new Error("Device disconnected"));
           this.queue.shift();
           continue;
        }

        try {
          await this.txCharacteristic.writeValue(item.data);
          item.resolve();
        } catch (error) {
          item.reject(error);
        } finally {
          this.queue.shift();
        }
      }
    } finally {
      this.isWriting = false;
      if (this.queue.length > 0) {
        this.processQueue();
      }
    }
  }

  private handleCharacteristicValueChanged = (event: Event) => {
    const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
    if (!value) return;
    const decoder = new TextDecoder();
    const str = decoder.decode(value);
    if (this.onDataReceivedCallback) {
      this.onDataReceivedCallback(str);
    }
  };

  private handleDisconnect = () => {
    this.device = null;
    this.server = null;
    this.txCharacteristic = null;
    this.rxCharacteristic = null;
    
    this.queue.forEach(item => item.reject(new Error("Device disconnected")));
    this.queue = [];
    this.isWriting = false;

    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  };

  setOnDisconnect(callback: () => void) {
    this.onDisconnectCallback = callback;
  }

  setOnDataReceived(callback: (data: string) => void) {
    this.onDataReceivedCallback = callback;
  }

  isConnected(): boolean {
    return !!(this.device && this.device.gatt?.connected);
  }
}

export const bluetoothService = new BluetoothService();
