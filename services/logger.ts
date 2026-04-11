
export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR';

export interface LoggerEntry {
  level: LogLevel;
  namespace: string;
  message: string;
  data?: unknown;
  timestamp: number;
}

type LogCallback = (entry: LoggerEntry) => void;

const LEVEL_RANK: Record<LogLevel, number> = { DEBUG: 0, INFO: 1, WARN: 2, ERROR: 3 };

class Logger {
  private minLevel: LogLevel = 'DEBUG';
  private callbacks: LogCallback[] = [];

  setMinLevel(level: LogLevel) {
    this.minLevel = level;
  }

  setOnLog(cb: LogCallback) {
    this.callbacks.push(cb);
  }

  removeOnLog(cb: LogCallback) {
    this.callbacks = this.callbacks.filter(c => c !== cb);
  }

  private emit(level: LogLevel, namespace: string, message: string, data?: unknown) {
    if (LEVEL_RANK[level] < LEVEL_RANK[this.minLevel]) return;

    const entry: LoggerEntry = { level, namespace, message, data, timestamp: Date.now() };

    const prefix = `[${namespace}]`;
    const args = data !== undefined ? [prefix, message, data] : [prefix, message];
    if (level === 'DEBUG') console.debug(...args);
    else if (level === 'INFO') console.info(...args);
    else if (level === 'WARN') console.warn(...args);
    else console.error(...args);

    this.callbacks.forEach(cb => cb(entry));
  }

  debug(namespace: string, message: string, data?: unknown) { this.emit('DEBUG', namespace, message, data); }
  info(namespace: string, message: string, data?: unknown)  { this.emit('INFO',  namespace, message, data); }
  warn(namespace: string, message: string, data?: unknown)  { this.emit('WARN',  namespace, message, data); }
  error(namespace: string, message: string, data?: unknown) { this.emit('ERROR', namespace, message, data); }
}

export const logger = new Logger();
