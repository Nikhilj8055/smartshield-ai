
import { app } from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { testDatabaseConnection, pool } from './database/connection';

const PORT = config.port;

let server: ReturnType<typeof app.listen> | null = null;
let isShuttingDown = false;

async function startServer(): Promise<void> {
  try {
    // Verify PostgreSQL before accepting requests.
    await testDatabaseConnection();

    server = app.listen(PORT, () => {
      logger.info(`SmartShield AI Engine running on http://localhost:${PORT}`);
      logger.info(`API v1 Base URL: http://localhost:${PORT}/api/v1`);
      logger.info(`Health check: http://localhost:${PORT}/api/v1/health`);
    });

    server.on('error', (error) => {
      logger.error('HTTP server error.', { error });
      process.exitCode = 1;
    });
  } catch (error) {
    logger.error('Database connection failed. Server startup aborted.', { error });
    await pool.end();
    process.exitCode = 1;
  }
}

async function shutdown(signal: string): Promise<void> {
  if (isShuttingDown) return;

  isShuttingDown = true;
  logger.info(`${signal} received. Shutting down gracefully...`);

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out. Forcing exit.');
    process.exit(1);
  }, 10000);

  forceExitTimer.unref();

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((error) => {
          if (error) reject(error);
          else resolve();
        });
      });
    }

    await pool.end();
    logger.info('SmartShield AI Engine stopped successfully.');
  } catch (error) {
    logger.error('Error during server shutdown.', { error });
    process.exitCode = 1;
  } finally {
    clearTimeout(forceExitTimer);
  }
}

process.on('SIGTERM', () => void shutdown('SIGTERM'));
process.on('SIGINT', () => void shutdown('SIGINT'));

void startServer();
