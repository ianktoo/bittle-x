import { describe, it, expect, vi, beforeEach } from 'vitest';
import { BluetoothService } from './bluetoothService';

function makeMockCharacteristic() {
  return {
    value: undefined,
    writeValue: vi.fn().mockResolvedValue(undefined),
    startNotifications: vi.fn().mockResolvedValue(undefined),
    addEventListener: vi.fn(),
  };
}

function makeMockServer(txChar: ReturnType<typeof makeMockCharacteristic>, rxChar: ReturnType<typeof makeMockCharacteristic>) {
  return {
    connected: true,
    connect: vi.fn().mockResolvedValue(undefined),
    disconnect: vi.fn(),
    getPrimaryService: vi.fn().mockResolvedValue({
      getCharacteristic: vi.fn().mockImplementation((uuid: string) => {
        // TX UUID ends in ...0002, RX ends in ...0003
        if (uuid.endsWith('0002')) return Promise.resolve(txChar);
        return Promise.resolve(rxChar);
      }),
    }),
  };
}

function makeMockDevice(server: ReturnType<typeof makeMockServer>) {
  const listeners: Record<string, Function> = {};
  return {
    id: 'test-device',
    name: 'Bittle',
    gatt: { ...server, connected: true },
    addEventListener: vi.fn((type: string, fn: Function) => { listeners[type] = fn; }),
    removeEventListener: vi.fn(),
    _listeners: listeners,
  };
}

describe('BluetoothService', () => {
  let service: BluetoothService;

  beforeEach(() => {
    service = new BluetoothService();
    vi.restoreAllMocks();
  });

  async function connectService() {
    const txChar = makeMockCharacteristic();
    const rxChar = makeMockCharacteristic();
    const server = makeMockServer(txChar, rxChar);
    const device = makeMockDevice(server);

    server.connect = vi.fn().mockResolvedValue(server);

    Object.defineProperty(navigator, 'bluetooth', {
      value: { requestDevice: vi.fn().mockResolvedValue(device) },
      writable: true, configurable: true,
    });

    await service.connect();
    return { device, txChar, rxChar };
  }

  it('throws Already connected when connect called twice', async () => {
    await connectService();
    await expect(service.connect()).rejects.toThrow('Already connected');
  });

  it('queue executes commands in order', async () => {
    const { txChar } = await connectService();
    const order: number[] = [];
    txChar.writeValue.mockImplementation(async () => {
      order.push(order.length);
    });

    await Promise.all([
      service.sendCommand('cmd1'),
      service.sendCommand('cmd2'),
      service.sendCommand('cmd3'),
    ]);

    expect(order).toEqual([0, 1, 2]);
    expect(txChar.writeValue).toHaveBeenCalledTimes(3);
  });

  it('does not add duplicate disconnect listener on reconnect', async () => {
    const { device } = await connectService();
    const addCalls = (device.addEventListener as ReturnType<typeof vi.fn>).mock.calls.filter(
      (c: string[]) => c[0] === 'gattserverdisconnected'
    );
    expect(addCalls.length).toBe(1);
    expect(device.removeEventListener).toHaveBeenCalledWith(
      'gattserverdisconnected',
      expect.any(Function)
    );
  });
});
