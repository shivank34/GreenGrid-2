import winston from 'winston';
import { env } from '../config/env';

const { combine, timestamp, printf, colorize, json, errors } = winston.format;

// Custom console format for local development
const devLogFormat = printf(({ level, message, timestamp, stack, ...meta }) => {
  const metaString = Object.keys(meta).length ? ` ${JSON.stringify(meta, null, 2)}` : '';
  const errorStack = stack ? `\n${stack}` : '';
  return `[${timestamp}] [${level}]: ${message}${metaString}${errorStack}`;
});

const isProd = env.NODE_ENV === 'production';

export const logger = winston.createLogger({
  level: env.LOG_LEVEL,
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    errors({ stack: true }),
    isProd ? json() : combine(colorize(), devLogFormat)
  ),
  defaultMeta: { service: 'greengrid-backend' },
  transports: [
    new winston.transports.Console()
  ],
  exitOnError: false,
});
