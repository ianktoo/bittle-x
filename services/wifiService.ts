
export class WifiService {
  private ip: string | null = null;
  private onDisconnectCallback: (() => void) | null = null;

  async connect(ip: string): Promise<void> {
    // Basic IP validation
    // Allows IP or hostname (e.g., bittle.local)
    if (!ip) throw new Error("IP Address required");
    if (this.ip) {
      throw new Error('Already connected');
    }

    this.ip = ip;
    
    // We attempt a simple fetch to check connectivity
    // Using no-cors because the ESP32 might not return proper CORS headers
    // and we just want to ensure the network path exists.
    try {
      const controller = new AbortController();
      const id = setTimeout(() => controller.abort(), 2000);
      await fetch(`http://${this.ip}`, { 
        mode: 'no-cors',
        signal: controller.signal 
      });
      clearTimeout(id);
    } catch (e) {
      throw new Error(`Could not reach robot at ${ip}. Check IP address and WiFi.`);
    }
  }

  async disconnect() {
    this.ip = null;
    if (this.onDisconnectCallback) {
      this.onDisconnectCallback();
    }
  }

  async sendCommand(command: string): Promise<void> {
    if (!this.ip) throw new Error("WiFi device not connected");

    // Construct URL for standard Bittle/ESP WebServer
    // Typical pattern: http://<IP>/action?cmd=<COMMAND>
    const url = `http://${this.ip}/action?cmd=${encodeURIComponent(command)}`;
    
    console.log(`[WiFi] Fetching: ${url}`);

    try {
      // Fire and forget-ish
      await fetch(url, {
        method: 'GET',
        mode: 'no-cors', // Important for local IPs
      });
    } catch (error) {
      console.error('WiFi Send Error:', error);
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
