import path from 'path';
import fs from 'fs';
import { createLogger, format, transports } from 'winston';
import chalk from 'chalk';

const { combine, timestamp, printf, colorize } = format;

// Ensure logs directory exists
const logDir = 'logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir);
}

// Define the log format, including timestamp and message
const logFormat = printf(({ level, message, timestamp, ...metadata }) => {
    const coloredTimestamp = chalk.blue(timestamp);
    let log = `${coloredTimestamp} [${level}]: ${message}`;

    // Handle additional metadata (splat)
    const splat = metadata[Symbol.for('splat')];
    if (splat && splat.length > 0) {
        const coloredSplat = chalk.yellow(
            splat.map((value) => JSON.stringify(value)).join(' ')
        );
        log += ` ${coloredSplat}`;
    }

    return log;
});

// Create the logger with different log levels and transports
const logger = createLogger({
    format: combine(
        colorize(), // Adds colors to different log levels
        timestamp(), // Adds timestamp to logs
        logFormat // Applies the custom log format
    ),
    transports: [
        new transports.Console(),
        new transports.File({ filename: path.join(logDir, 'app.log') }),
    ],
    level: 'debug', // Minimum log level (can be 'info', 'warn', 'error', etc.)
});

// Handle errors in logging
logger.on('error', (err) => {
    console.error('Error occurred in logging: ', err);
});

// Export the logger for use in other modules
export default logger;
