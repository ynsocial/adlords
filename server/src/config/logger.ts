import winston from 'winston';
import * as Sentry from '@sentry/node';
import { Request, Response } from 'express';
import { Environment } from '../types/enums';
import path from 'path';

const { createLogger, format, transports } = winston;
const { combine, timestamp, printf, colorize } = format;

// Configure Sentry
if (process.env.NODE_ENV === Environment.PRODUCTION) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    environment: process.env.NODE_ENV,
    integrations: [
      new Sentry.Integrations.Http({ tracing: true }),
      new Sentry.Integrations.Express()
    ],
    tracesSampleRate: 1.0
  });
}

// Custom format for Winston
const customFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}]: ${message}`;
  
  if (Object.keys(metadata).length > 0) {
    msg += ` ${JSON.stringify(metadata)}`;
  }
  
  return msg;
});

// Create Winston logger
const logger = createLogger({
  format: combine(
    timestamp(),
    customFormat
  ),
  transports: [
    new transports.Console({
      level: process.env.NODE_ENV === Environment.PRODUCTION ? 'info' : 'debug',
      format: combine(
        colorize(),
        customFormat
      )
    }),
    new transports.DailyRotateFile({
      filename: path.join('logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error'
    }),
    new transports.DailyRotateFile({
      filename: path.join('logs', 'combined-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d'
    })
  ]
});

// Log to Sentry for errors and warnings in production
if (process.env.NODE_ENV === Environment.PRODUCTION) {
  logger.on('error', (log) => {
    Sentry.captureMessage(log.message, Sentry.Severity.ERROR);
  });
  logger.on('warn', (log) => {
    Sentry.captureMessage(log.message, Sentry.Severity.WARNING);
  });
}

export const logRequest = (req: Request) => {
  const { method, path, body, query, params, ip, headers } = req;
  logger.http(`${method} ${path}`, {
    ip,
    userAgent: headers['user-agent'],
    query,
    params,
    body: process.env.NODE_ENV === Environment.DEVELOPMENT ? body : '[REDACTED]',
  });
};

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

  logger.error('Application error', errorDetails);

  if (process.env.NODE_ENV === Environment.PRODUCTION) {
    Sentry.captureException(error, {
      extra: errorDetails,
    });
  }
};

export const logPerformance = (
  operation: string,
  duration: number,
  metadata?: object
): void => {
  logger.verbose(`Performance: ${operation} took ${duration}ms`, metadata);
};

export const logSecurity = (
  event: string,
  details: object,
  level: 'warn' | 'error' = 'warn'
): void => {
  logger[level](`Security: ${event}`, details);
};

export const logDatabase = (
  operation: string,
  duration: number,
  metadata?: object
): void => {
  logger.debug(`Database: ${operation} took ${duration}ms`, metadata);
};

export default logger;
