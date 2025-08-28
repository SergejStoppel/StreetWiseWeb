import winston from 'winston';
import { config } from './index';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define log colors
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Add colors to winston
winston.addColors(colors);

// Create log format
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(info => {
    const { timestamp, level, message, ...meta } = info;
    const metaString = Object.keys(meta).length ? JSON.stringify(meta, null, 2) : '';
    return `${timestamp} [${level}]: ${message} ${metaString}`;
  }),
);

// Create transports
const transports: winston.transport[] = [
  // Console transport
  new winston.transports.Console({
    level: config.logging.level,
    format,
  }),
];

// Add file transport if specified
if (config.logging.file) {
  transports.push(
    new winston.transports.File({
      filename: config.logging.file,
      level: config.logging.level,
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
  );
}

// Create logger
export const logger = winston.createLogger({
  level: config.logging.level,
  levels,
  transports,
  exceptionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
  rejectionHandlers: [
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.simple(),
      ),
    }),
  ],
  exitOnError: false,
});

// Create structured logging methods
export const createLogger = (module: string) => ({
  error: (message: string, meta?: Record<string, unknown>) =>
    logger.error(message, { module, ...meta }),
  warn: (message: string, meta?: Record<string, unknown>) =>
    logger.warn(message, { module, ...meta }),
  info: (message: string, meta?: Record<string, unknown>) =>
    logger.info(message, { module, ...meta }),
  http: (message: string, meta?: Record<string, unknown>) =>
    logger.http(message, { module, ...meta }),
  debug: (message: string, meta?: Record<string, unknown>) =>
    logger.debug(message, { module, ...meta }),
});

// Export default logger
export default logger;