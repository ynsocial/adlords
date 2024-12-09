import winston from 'winston';
import * as Sentry from '@sentry/node';
import { ProfilingIntegration } from '@sentry/profiling-node';
import DailyRotateFile from 'winston-daily-rotate-file';
import Transport from 'winston-transport';
import path from 'path';

// Initialize Sentry
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    new ProfilingIntegration(),
  ],
  tracesSampleRate: 1.0,
  profilesSampleRate: 1.0,
  environment: process.env.NODE_ENV || 'development',
});

// Custom format for winston
const customFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ timestamp, level, message, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length > 0) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

// Define log directory
const logDir = path.join(__dirname, '../../logs');

// Create rotating file transport
const fileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, '%DATE%-combined.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '14d',
  maxSize: '20m',
});

// Create error-specific rotating file transport
const errorFileRotateTransport = new DailyRotateFile({
  filename: path.join(logDir, '%DATE%-error.log'),
  datePattern: 'YYYY-MM-DD',
  maxFiles: '30d',
  maxSize: '20m',
  level: 'error',
});

// Create winston logger instance
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: customFormat,
  transports: [
    // Write all logs to rotating files
    fileRotateTransport,
    // Write error logs to separate file
    errorFileRotateTransport,
  ],
  // Handle uncaught exceptions and rejections
  exceptionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, '%DATE%-exceptions.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
    }),
  ],
  rejectionHandlers: [
    new DailyRotateFile({
      filename: path.join(logDir, '%DATE%-rejections.log'),
      datePattern: 'YYYY-MM-DD',
      maxFiles: '30d',
      maxSize: '20m',
    }),
  ],
});

// Add console transport in development
if (process.env.NODE_ENV !== 'production') {
  logger.add(new winston.transports.Console({
    format: winston.format.combine(
      winston.format.colorize(),
      customFormat
    ),
  }));
}

interface SentryTransportOptions extends Transport.TransportStreamOptions {
  sentry?: typeof Sentry;
  level?: string;
}

// Create a Sentry transport
class SentryTransport extends Transport {
  private sentry: typeof Sentry;

  constructor(opts?: SentryTransportOptions) {
    super(opts);
    this.sentry = opts?.sentry || Sentry;
    this.level = opts?.level || 'error';
  }

  log(info: any, callback: () => void) {
    setImmediate(() => {
      this.emit('logged', info);
    });

    const { level, message, ...meta } = info;
    
    if (level === 'error') {
      if (message instanceof Error) {
        this.sentry.captureException(message);
      } else {
        this.sentry.captureMessage(message, {
          level: this.sentry.Severity.Error,
          extra: meta,
        });
      }
    }
    
    callback();
  }
}

// Add Sentry transport in production
if (process.env.NODE_ENV === 'production') {
  logger.add(new SentryTransport({ level: 'error' }));
}

// Export helper functions for common logging patterns
export const logError = (error: Error, context?: Record<string, unknown>) => {
  logger.error({
    message: error.message,
    stack: error.stack,
    ...context,
  });
  
  if (process.env.NODE_ENV === 'production') {
    Sentry.captureException(error, { extra: context });
  }
};

export const logInfo = (message: string, context?: Record<string, unknown>) => {
  logger.info(message, context);
};

export const logWarning = (message: string, context?: Record<string, unknown>) => {
  logger.warn(message, context);
};

export const logDebug = (message: string, context?: Record<string, unknown>) => {
  logger.debug(message, context);
};

// Create a request logger middleware
export const requestLogger = () => {
  return (req: any, res: any, next: () => void) => {
    const start = Date.now();
    
    res.on('finish', () => {
      const duration = Date.now() - start;
      logger.info('HTTP Request', {
        method: req.method,
        url: req.url,
        status: res.statusCode,
        duration: `${duration}ms`,
        ip: req.ip,
        userAgent: req.get('user-agent'),
        userId: req.user?._id,
      });
    });
    
    next();
  };
};

export { logger, Sentry };
