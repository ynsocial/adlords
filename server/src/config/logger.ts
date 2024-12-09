import winston from 'winston';
import 'winston-daily-rotate-file';
import * as Sentry from '@sentry/node';
import path from 'path';
import { Request } from 'express';
import Transport from 'winston-transport';

// Initialize Sentry
if (process.env.NODE_ENV === 'production') {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    tracesSampleRate: 1.0,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express({ tracing: true }),
    ],
  });
}

// Custom log levels
const levels = {
  error: 0,    // Error conditions
  warn: 1,     // Warning conditions
  info: 2,     // Informational messages
  http: 3,     // HTTP request logs
  verbose: 4,  // Verbose debugging information
  debug: 5,    // Debugging messages
  silly: 6,    // Extra debugging messages
};

// Log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  verbose: 'cyan',
  debug: 'white',
  silly: 'gray',
};

// Add colors to Winston
winston.addColors(colors);

const { combine, timestamp, printf, colorize } = winston.format;

const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

const consoleFormat = combine(
  colorize(),
  timestamp(),
  printf(({ timestamp, level, message }) => {
    return `${timestamp} [${level}]: ${message}`;
  })
);

// Define log directory
const logDir = path.join(process.cwd(), 'logs');

class SentryTransport extends Transport {
  constructor(opts?: Transport.TransportStreamOptions) {
    super(opts);
  }

  log(info: any, callback: () => void) {
    const { level, message, ...meta } = info;
    
    if (level === 'error') {
      Sentry.captureMessage(message, {
        level: Sentry.Severity.Error,
        extra: meta
      });
    } else if (level === 'warn') {
      Sentry.captureMessage(message, {
        level: Sentry.Severity.Warning,
        extra: meta
      });
    }

    callback();
  }
}

// Create the logger instance
const Logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'info',
  levels,
  format: logFormat,
  transports: [
    // Write all logs with level 'error' and below to error.log
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error'
    }),
    // Write all logs with level 'info' and below to combined.log
    new winston.transports.DailyRotateFile({
      filename: path.join(logDir, 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    }),
  ],
  exitOnError: false
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  Logger.add(new winston.transports.Console({
    format: consoleFormat,
  }));
} else {
  // Add Sentry transport in production
  Logger.add(new SentryTransport());
}

// Create a stream object for Morgan
export const stream = {
  write: (message: string) => {
    Logger.http(message.trim());
  },
};

// Request logging function
export const logRequest = (req: Request): void => {
  const { method, path, body, query, params, ip, headers } = req;
  Logger.http(`${method} ${path}`, {
    ip,
    userAgent: headers['user-agent'],
    query,
    params,
    body: process.env.NODE_ENV === 'development' ? body : '[REDACTED]',
  });
};

// Error logging function
export const logError = (error: Error, req?: Request): void => {
  const errorDetails = {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...(req && {
      path: req.path,
      method: req.method,
      ip: req.ip,
      userAgent: req.headers['user-agent'],
    }),
  };

  Logger.error('Application error', errorDetails);

  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, {
      extra: errorDetails,
    });
  }
};

// Performance logging function
export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: object
): void => {
  Logger.verbose(`Performance: ${operation} took ${duration}ms`, metadata);
};

// Security logging function
export const logSecurity = (
  event: string,
  details: object,
  level: 'warn' | 'error' = 'warn'
): void => {
  Logger[level](`Security: ${event}`, details);
};

// Database logging function
export const logDatabase = (
  operation: string,
  duration: number,
  metadata?: object
): void => {
  Logger.debug(`Database: ${operation} took ${duration}ms`, metadata);
};

export default Logger;
