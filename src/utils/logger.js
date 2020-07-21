import winston from 'winston';
import Config from './config';

const config = Config.getConfig();

const options = {
  file: {
    level: 'info',
    filename: config.log_file,
    handleExceptions: true,
    json: true,
    maxsize: 5242880,
    maxFiles: 5,
    colorize: false,
    format: winston.format.combine(
      winston.format.label({ label: 'API' }),
      winston.format.timestamp(),
      winston.format.printf(({ level, message, label, timestamp }) => {
        return `[${label}]: ${timestamp} ${level}: ${message}`;
      })
    )
  },
  console: {
    level: 'debug',
    handleExceptions: true,
    json: false,
    colorize: true,
    format: winston.format.combine(
      winston.format.label({ label: 'API' }),
      winston.format.timestamp(),
      winston.format.colorize(),
      winston.format.printf(({ level, message, label, timestamp }) => {
        return `[${label}]: ${timestamp} ${level}: ${message}`;
      })
    )
  }
};

// eslint-disable-next-line new-cap
const Logger = new winston.createLogger({
  transports: [
    new winston.transports.File(options.file),
    new winston.transports.Console(options.console)
  ],
  exitOnError: false
});

Logger.stream = {
  write: function(message, encoding) {
    Logger.info(message);
  }
};

export default Logger;
