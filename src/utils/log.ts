const DEBUG = true; // Toggle for debug mode

type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function formatMessage(level: LogLevel, message: string, _args: any[]): string {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level.toUpperCase()}]`;
  return `${prefix} ${message}`;
}

function log(level: LogLevel, message: string, ...args: any[]): void {
  if (level === 'debug' && !DEBUG) return;

  const formatted = formatMessage(level, message, args);

  switch (level) {
    case 'error':
      console.error(formatted, ...args);
      break;
    case 'warn':
      console.warn(formatted, ...args);
      break;
    case 'info':
    case 'debug':
    default:
      console.log(formatted, ...args);
      break;
  }
}

export const logger = {
  info: (message: string, ...args: any[]) => log('info', message, ...args),
  warn: (message: string, ...args: any[]) => log('warn', message, ...args),
  error: (message: string, ...args: any[]) => log('error', message, ...args),
  debug: (message: string, ...args: any[]) => log('debug', message, ...args),
};

