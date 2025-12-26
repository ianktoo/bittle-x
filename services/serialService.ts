
// --- Web Serial Type Definitions ---
// Partial definitions for TypeScript
interface SerialPortRequestOptions {
  filters?: Array<{ usbVendorId?: number; usbProductId?: number }>;
}

interface SerialPort {
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  readable: ReadableStream<Uint8Array>;
  writable: WritableStream<Uint8Array>;
}

interface Serial {
  requestPort(options?: SerialPortRequestOptions): Promise<SerialPort>;
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
      // Petoi devices usually show up as generic USB-Serial.
      // Passing an empty object allows the browser to show all available ports.
      this.port = await nav.serial.requestPort({});
      
      // Open with standard Petoi baud rate
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
        const { value, done } = await this.reader.read();
        if (done) {
          // Stream has been closed
          break;
        }
        if (value) {
          const str = new TextDecoder().decode(value);
          if (this.onDataReceivedCallback) {
            this.onDataReceivedCallback(str);
          }
        }
      }
    } catch (error) {
      console.error('Serial Read Error:', error);
    } finally {
      if (this.reader) {
        this.reader.releaseLock();
      }
    }
  }

  async disconnect() {
    this.isReading = false;
    
    // Close reader is tricky in Web Serial while loop is running, 
    // usually we cancel the reader or just let the loop exit via boolean check + close
    
    try {
      if (this.reader) {
        await this.reader.cancel();
        // lock released in finally block of readLoop
      }
      
      if (this.writer) {
        this.writer.releaseLock();
        this.writer = null;
      }

      if (this.port) {
        await this.port.close();
        this.port = null;
      }
    } catch (e) {
      console.error("Error closing serial port", e);
    }

    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.port || !this.writer) {
      throw new Error('Serial device not connected');
    }

    // DEBUG: Log the raw command being sent over Serial
    console.log(`[Serial Service] Writing: "${command}"`);

    const encoder = new TextEncoder();
    // Appending newline is required for many Serial parsers (like Arduino's readStringUntil)
    // to detect the end of the command.
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
