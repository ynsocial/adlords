import winston from 'winston';
import 'winston-daily-rotate-file';
import { Request } from 'express';
import * as Sentry from '@sentry/node';

const { combine, timestamp, printf, colorize } = winston.format;

const myFormat = printf(({ level, message, timestamp, ...metadata }) => {
  let msg = `${timestamp} [${level}] : ${message} `;
  if (metadata && Object.keys(metadata).length > 0) {
    msg += JSON.stringify(metadata);
  }
  return msg;
});

const options = {
  file: {
    level: 'info',
    filename: './logs/app-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), myFormat),
  },
  error: {
    level: 'error',
    filename: './logs/error-%DATE%.log',
    datePattern: 'YYYY-MM-DD',
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '14d',
    format: combine(timestamp(), myFormat),
  },
  console: {
    level: 'debug',
    format: combine(colorize(), timestamp(), myFormat),
  },
};

// Instantiate a new Winston Logger with the settings defined above
const logger = winston.createLogger({
  transports: [
    new winston.transports.DailyRotateFile(options.file),
    new winston.transports.DailyRotateFile(options.error),
    new winston.transports.Console(options.console),
  ],
  exitOnError: false, // Do not exit on handled exceptions
});

// Create a stream object with a 'write' function that will be used by `morgan`
const stream = {
  write: (message: string) => {
    logger.info(message.trim());
  },
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

export { logger, stream, logError, logWarning };
