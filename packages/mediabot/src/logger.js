const { createLogger, format, transports } = require('winston')

const prettyPrint = format((info, opts) => {
  if (typeof info.message !== 'string') {
    info.message = JSON.stringify(info.message, null, 2)
    info.isString = false
  } else {
    info.isString = true
  }
  return info
})

const logFormat = format.combine(
  prettyPrint(),
  format.timestamp(),
  format.colorize(),
  format.align(),
  format.printf((info) => {
    if (info.isString) {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
    } else {
      return info.message
    }
  })
)

const logger = createLogger({
  level: 'info',
  format: format.json(),
  transports: [
    new transports.File({
      name: 'error-log',
      filename: 'logs/error.log',
      level: 'error',
    }),
    new transports.File({
      name: 'full-log',
      filename: 'logs/combined.log',
    }),
    new transports.Console({
      name: 'console-log',
      level: 'debug',
      format: logFormat,
    }),
  ],
})

if (process.env.NODE_ENV.toLowerCase() === 'test') {
  logger.silent = true
}

module.exports = logger
