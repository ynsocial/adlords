import winston from 'winston';
import { Request } from 'express';

const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

winston.addColors(colors);

const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

const transports = [
  new winston.transports.Console(),
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
  }),
  new winston.transports.File({ filename: 'logs/all.log' }),
];

const Logger = winston.createLogger({
  level: process.env.NODE_ENV === 'development' ? 'debug' : 'warn',
  levels,
  format,
  transports,
});

export const stream = {
  write: (message: string) => {
    Logger.info(message.substring(0, message.lastIndexOf('\n')));
  },
};

export const logRequest = (req: Request): void => {
  const { method, path, body, query, params } = req;
  Logger.http(
    `${method} ${path} - Query: ${JSON.stringify(query)} - Params: ${JSON.stringify(
      params,
    )} - Body: ${JSON.stringify(body)}`,
  );
};

export default Logger;
