
import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';

const PORT = config.port;

const server = app.listen(PORT, () => {
  logger.info(`SmartShield AI Engine running on http://localhost:${PORT}`);
  logger.info(`API v1 Base URL: http://localhost:${PORT}/api/v1`);
  logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
});

let isShuttingDown = false;

function shutdown(signal: string): void {
  if (isShuttingDown) return;

  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);

  forceExitTimer.unref();

  server.close((error) => {
    clearTimeout(forceExitTimer);

    if (error) {
      logger.error('Error during server shutdown.', { error });
      process.exitCode = 1;
      return;
    }

    logger.info('SmartShield AI Engine stopped successfully.');
  });
}

server.on('error', (error) => {
  logger.error('HTTP server error.', { error });
  process.exitCode = 1;
});

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
