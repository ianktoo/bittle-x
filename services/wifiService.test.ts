import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WifiService } from './wifiService';

describe('WifiService', () => {
  let service: WifiService;

  beforeEach(() => {
    service = new WifiService();
    vi.restoreAllMocks();
  });

  it('connects when ping succeeds', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await expect(service.connect('192.168.1.100')).resolves.toBeUndefined();
    expect(service.isConnected()).toBe(true);
  });

  it('throws when IP is empty', async () => {
    await expect(service.connect('')).rejects.toThrow('IP Address required');
  });

  it('throws when ping fails', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));
    await expect(service.connect('192.168.1.100')).rejects.toThrow(
      'Could not reach robot at 192.168.1.100'
    );
  });

  it('throws Already connected when connect called twice', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));
    await service.connect('192.168.1.100');
    await expect(service.connect('192.168.1.100')).rejects.toThrow('Already connected');
  });

  it('sendCommand builds correct URL', async () => {
    const mockFetch = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal('fetch', mockFetch);
    await service.connect('192.168.1.50');

    mockFetch.mockClear();
    await service.sendCommand('kwkF');

    expect(mockFetch).toHaveBeenCalledWith(
      'http://192.168.1.50/action?cmd=kwkF',
      expect.objectContaining({ method: 'GET' })
    );
  });

  it('sendCommand throws when not connected', async () => {
    await expect(service.sendCommand('kwkF')).rejects.toThrow('WiFi device not connected');
  });
});
