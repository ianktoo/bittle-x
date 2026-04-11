
import { logger } from './logger';

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

const NS = 'SERIAL';

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
      logger.debug(NS, 'Requesting serial port from browser');
      this.port = await nav.serial.requestPort({});

      logger.debug(NS, 'Opening port at 115200 baud');
      await this.port.open({ baudRate: 115200 });

      if (this.port.writable) {
        this.writer = this.port.writable.getWriter();
      }

      this.isReading = true;
      this.readLoop();

      logger.info(NS, 'Connected successfully');

    } catch (error: any) {
      logger.error(NS, `Connection failed: ${error.message ?? error}`);
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
          if (String(readError).includes("lost") || String(readError).includes("disconnected")) {
            logger.warn(NS, 'Device lost during read — cable unplugged?');
            this.handleDisconnect();
            break;
          }
          logger.error(NS, `Read error: ${readError.message ?? readError}`);
          throw readError;
        }
      }
    } catch (error: any) {
      logger.error(NS, `Read loop error: ${error.message ?? error}`);
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
    logger.info(NS, 'Disconnecting (user requested)');
    this.isReading = false;

    try {
      if (this.reader) {
        try {
          await this.reader.cancel();
        } catch (e) {
          // Ignore if reader is already closed/released
        }
      }

      if (this.writer) {
        try {
          this.writer.releaseLock();
        } catch (e) {}
        this.writer = null;
      }

      if (this.port) {
        try {
          await this.port.close();
        } catch (e) {}
        this.port = null;
      }
    } catch (e: any) {
      logger.error(NS, `Error during disconnect: ${e.message ?? e}`);
    }

    logger.info(NS, 'Disconnected cleanly');
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
    logger.debug(NS, `Sending command: ${command}`);
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
