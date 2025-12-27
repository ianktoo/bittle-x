
// --- Web Serial Type Definitions ---
interface SerialPortRequestOptions {
  filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
  addEventListener(type: string, listener: EventListener): void;
  removeEventListener(type: string, listener: EventListener): void;
}

interface Serial {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
  addEventListener(type: string, listener: EventListener): void;
}

interface NavigatorWithSerial extends Navigator {
  serial: Serial;
}
// -----------------------------------

export class SerialService {
  private port: SerialPort | null = null;
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null;
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null;
  private isReading = false;
  private onDataReceivedCallback: ((data: string) => void) | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  async connect(): Promise<void> {
    const nav = navigator as unknown as NavigatorWithSerial;
    if (!nav.serial) {
      throw new Error('Web Serial is not supported in this browser. Try Chrome or Edge.');
    }

    try {
      this.port = await nav.serial.requestPort({});
      await this.port.open({ baudRate: 115200 });

      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
      }

      this.isReading = true;
      this.readLoop();

    } catch (error) {
      console.error('Serial Connection Error:', error);
      throw error;
    }
  }

  private async readLoop() {
    if (!this.port || !this.port.readable) return;

    try {
      this.reader = this.port.readable.getReader();
      
      while (this.isReading) {
        try {
          const { value, done } = await this.reader.read();
          if (done) break;
          if (value) {
            const str = new TextDecoder().decode(value);
            if (this.onDataReceivedCallback) {
              this.onDataReceivedCallback(str);
            }
          }
        } catch (readError: any) {
          // If the device is lost, this will throw
          if (String(readError).includes("lost") || String(readError).includes("disconnected")) {
            console.warn('Serial device lost.');
            this.handleDisconnect();
            break;
          }
          throw readError;
        }
      }
    } catch (error) {
      console.error('Serial Read Error:', error);
    } finally {
      if (this.reader) {
        try {
          this.reader.releaseLock();
        } catch (e) {
          // Ignore if already released
        }
        this.reader = null;
      }
    }
  }

  async disconnect() {
    this.isReading = false;
    
    try {
      // 1. Cancel the reader to break the readLoop
      if (this.reader) {
        try {
          await this.reader.cancel();
        } catch (e) {
          // Ignore if reader is already closed/released
        }
      }
      
      // 2. Release writer lock
      if (this.writer) {
        try {
          this.writer.releaseLock();
        } catch (e) {}
        this.writer = null;
      }

      // 3. Close the port
      if (this.port) {
        try {
          await this.port.close();
        } catch (e) {}
        this.port = null;
      }
    } catch (e) {
      console.error("Error during serial disconnect", e);
    }

    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  private handleDisconnect = () => {
    this.isReading = false;
    this.port = null;
    this.writer = null;
    this.reader = null;
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  };

  async sendCommand(command: string): Promise<void> {
    if (!this.port || !this.writer) {
      throw new Error('Serial device not connected');
    }

    const encoder = new TextEncoder();
    const data = encoder.encode(command + '\n');
    await this.writer.write(data);
  }

  setOnDisconnect(callback: () => void) {
    this.onDisconnectCallback = callback;
  }

  setOnDataReceived(callback: (data: string) => void) {
    this.onDataReceivedCallback = callback;
  }

  isConnected(): boolean {
    return !!this.port;
  }
}

export const serialService = new SerialService();
