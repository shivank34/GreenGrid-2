import express, { Application, Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import path from 'path';
import { env } from './config/env';
import { requestLogger } from './middleware/requestLogger.middleware';
import { generalRateLimiter } from './middleware/rateLimiter.middleware';
import { errorHandler } from './middleware/errorHandler.middleware';
import { ApiResponse } from './utils/apiResponse';
import { AppError } from './utils/appError';

export const createApp = (): Application => {
  const app = express();

  // 1. Security HTTP Headers
  app.use(
    helmet({
      contentSecurityPolicy: false, // Allows Swagger UI and local development
      crossOriginEmbedderPolicy: false,
    })
  );

  // 2. Cross-Origin Resource Sharing (CORS)
  const allowedOrigins = env.CORS_ORIGIN.split(',').map((origin) => origin.trim());
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow requests with no origin (e.g. mobile apps, curl, postman) or if wildcard
        if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
          return callback(null, true);
        }
        return callback(new Error(`Origin ${origin} not allowed by CORS policy`));
      },
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Meter-API-Key'],
    })
  );

  // 3. Body Parsers with 10MB limits (for batch IoT telemetry payloads)
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // 4. Request Logging & Rate Limiting
  app.use(requestLogger);
  app.use(generalRateLimiter);

  // 5. Serve static files (e.g., GreenGrid landing page)
  app.use(express.static(path.join(__dirname, '..')));

  // 6. Base Root Endpoint
  app.get('/', (_req: Request, res: Response) => {
    return res.json({
      name: 'GreenGrid Energy Management API',
      version: '1.0.0',
      description: 'Production backend for monitoring, optimizing, and managing energy across facilities.',
      docs: '/api/docs',
      health: `${env.API_PREFIX}/health`,
    });
  });

  // 7. Health Check Endpoint
  app.get(`${env.API_PREFIX}/health`, (_req: Request, res: Response) => {
    return ApiResponse.success(
      res,
      {
        status: 'UP',
        uptime: process.uptime(),
        timestamp: new Date().toISOString(),
        environment: env.NODE_ENV,
      },
      'GreenGrid backend service is healthy'
    );
  });

  return app;
};
