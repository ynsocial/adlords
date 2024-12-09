import winston from 'winston';
import 'winston-daily-rotate-file';
import * as Sentry from '@sentry/node';
import { Integrations } from '@sentry/tracing';
import config from './config';
import { Request } from 'express';

// Initialize Sentry
Sentry.init({
  dsn: config.sentry.dsn,
  environment: config.env,
  integrations: [new Integrations.Express()],
  tracesSampleRate: config.env === 'production' ? 0.2 : 1.0,
});

// Custom format for winston
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Create the winston logger
const logger = winston.createLogger({
  level: config.logLevel || 'info',
  format: customFormat,
  transports: [
    new winston.transports.DailyRotateFile({
      filename: './logs/error-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
      level: 'error',
    }),
    new winston.transports.DailyRotateFile({
      filename: './logs/app-%DATE%.log',
      datePattern: 'YYYY-MM-DD',
      zippedArchive: true,
      maxSize: '20m',
      maxFiles: '14d',
    }),
  ],
});

// Add console transport in non-production environments
if (config.env !== 'production') {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
      level: 'debug',
    })
  );
}

// Create a stream object for morgan
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
};

// Error handler middleware
const errorHandler = (err: Error, req: any, res: any, next: any) => {
  // Log the error
  logger.error('Unhandled Error:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
  });

  // Send error to Sentry
  Sentry.captureException(err);

  // Send error response
  res.status(500).json({
    error: config.env === 'production' ? 'Internal Server Error' : err.message,
  });
};

const logError = (error: Error, request?: Request) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setLevel('error');
      if (request) {
        scope.setExtra('url', request.url);
        scope.setExtra('method', request.method);
        scope.setExtra('headers', request.headers);
        scope.setExtra('body', request.body);
        scope.setExtra('query', request.query);
        scope.setExtra('params', request.params);
      }
      Sentry.captureException(error);
    });
  }
  logger.error(error.message, { error, request });
};

const logWarning = (message: string, request?: Request) => {
  if (process.env.NODE_ENV === 'production') {
    Sentry.withScope((scope) => {
      scope.setLevel('warning');
      if (request) {
        scope.setExtra('url', request.url);
        scope.setExtra('method', request.method);
        scope.setExtra('headers', request.headers);
        scope.setExtra('body', request.body);
        scope.setExtra('query', request.query);
        scope.setExtra('params', request.params);
      }
      Sentry.captureMessage(message);
    });
  }
  logger.warn(message, { request });
};

export { logger, stream, errorHandler, logError, logWarning, Sentry };
