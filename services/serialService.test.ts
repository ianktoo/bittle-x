import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SerialService } from './serialService';

function makeMockPort() {
  const encoder = new TextEncoder();
  const writtenChunks: Uint8Array[] = [];

  const writer = {
    write: vi.fn(async (data: Uint8Array) => { writtenChunks.push(data); }),
    releaseLock: vi.fn(),
  };

  const reader = {
    read: vi.fn().mockResolvedValue({ done: true, value: undefined }),
    cancel: vi.fn().mockResolvedValue(undefined),
    releaseLock: vi.fn(),
  };

  return {
    open: vi.fn().mockResolvedValue(undefined),
    close: vi.fn().mockResolvedValue(undefined),
    writable: { getWriter: vi.fn().mockReturnValue(writer) },
    readable: { getReader: vi.fn().mockReturnValue(reader) },
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    _writer: writer,
    _writtenChunks: writtenChunks,
  };
}

describe('SerialService', () => {
  let service: SerialService;
  let mockPort: ReturnType<typeof makeMockPort>;

  beforeEach(() => {
    service = new SerialService();
    mockPort = makeMockPort();

    Object.defineProperty(navigator, 'serial', {
      value: {
        requestPort: vi.fn().mockResolvedValue(mockPort),
        addEventListener: vi.fn(),
      },
      writable: true, configurable: true,
    });
  });

  it('throws Already connected when connect called twice', async () => {
    await service.connect();
    await expect(service.connect()).rejects.toThrow('Already connected');
  });

  it('sendCommand encodes command with newline', async () => {
    await service.connect();
    await service.sendCommand('kwkF');

    const written = mockPort._writer.write.mock.calls[0][0] as Uint8Array;
    const decoded = new TextDecoder().decode(written);
    expect(decoded).toBe('kwkF\n');
  });

  it('sendCommand throws when not connected', async () => {
    await expect(service.sendCommand('kwkF')).rejects.toThrow('Serial device not connected');
  });

  it('fires onDataReceived callback with received data', async () => {
    const encoder = new TextEncoder();
    const callback = vi.fn();
    const testData = encoder.encode('7.4\n');

    mockPort.readable.getReader = vi.fn().mockReturnValue({
      read: vi.fn()
        .mockResolvedValueOnce({ value: testData, done: false })
        .mockResolvedValue({ done: true, value: undefined }),
      cancel: vi.fn().mockResolvedValue(undefined),
      releaseLock: vi.fn(),
    });

    service.setOnDataReceived(callback);
    await service.connect();

    // Wait for the read loop to process
    await new Promise(r => setTimeout(r, 10));
    expect(callback).toHaveBeenCalledWith('7.4\n');
  });
});
