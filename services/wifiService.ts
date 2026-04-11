
import { logger } from './logger';

const NS = 'WIFI';

export class WifiService {
  private ip: string | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  async connect(ip: string): Promise<void> {
    if (!ip) throw new Error("IP Address required");

    this.ip = ip;
    logger.info(NS, `Connecting to ${ip}`);

    // Attempt a simple fetch to check connectivity
    try {
      logger.debug(NS, 'Pinging device to verify reachability');
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      await fetch(`http://${this.ip}`, {
        mode: 'no-cors',
        signal: controller.signal
      });
      clearTimeout(id);
      logger.info(NS, 'Initial ping succeeded — device reachable');
    } catch (e: any) {
      logger.warn(NS, `Initial ping failed — proceeding anyway (mixed-content or CORS may be blocking): ${e.message ?? e}`);
    }
  }

  async disconnect() {
    logger.info(NS, `Disconnecting from ${this.ip}`);
    this.ip = null;
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.ip) throw new Error("WiFi device not connected");

    const url = `http://${this.ip}/action?cmd=${encodeURIComponent(command)}`;
    logger.debug(NS, `Sending command: ${command}`);

    try {
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors',
      });
    } catch (error: any) {
      logger.error(NS, `Send failed for command "${command}": ${error.message ?? error}`);
      throw error;
    }
  }

  setOnDisconnect(callback: () => void) {
    this.onDisconnectCallback = callback;
  }

  isConnected(): boolean {
    return !!this.ip;
  }
}

export const wifiService = new WifiService();
