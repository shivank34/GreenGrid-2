import http from 'http';
import { createApp } from './app';
import { env } from './config/env';
import { logger } from './utils/logger';

const startServer = async () => {
  const app = createApp();
  const server = http.createServer(app);

  server.listen(env.PORT, () => {
    logger.info(`🚀 GreenGrid server running in [${env.NODE_ENV}] mode on port ${env.PORT}`);
    logger.info(`📡 API root available at: http://localhost:${env.PORT}${env.API_PREFIX}`);
    logger.info(`💚 Health check available at: http://localhost:${env.PORT}${env.API_PREFIX}/health`);
  });

  // Graceful shutdown handling
  const gracefulShutdown = (signal: string) => {
    logger.warn(`Received ${signal}. Shutting down GreenGrid server gracefully...`);
    server.close(() => {
      logger.info('HTTP server closed. Exiting process.');
      process.exit(0);
    });

    // Force shutdown after 10 seconds if hanging
    setTimeout(() => {
      logger.error('Could not close connections in time, forcefully shutting down');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  process.on('unhandledRejection', (reason: Error) => {
    logger.error('Unhandled Promise Rejection:', reason);
  });

  process.on('uncaughtException', (error: Error) => {
    logger.error('Uncaught Exception:', error);
    process.exit(1);
  });
};

startServer().catch((err) => {
  logger.error('Fatal error during GreenGrid server initialization:', err);
  process.exit(1);
});
