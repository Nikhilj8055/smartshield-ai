import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`SmartShield AI Engine running on http://localhost:${PORT}`);
  logger.info(`API v1 Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
});

process.on('SIGTERM', () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated.');
  });
});
