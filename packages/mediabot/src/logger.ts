import { createLogger, format, transports, Logger } from 'winston'

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'

const prettyPrint = format((info) => {
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
  format.align(),
  format.printf((info) => {
    if (info.isString) {
      return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
    } else {
      return info.message
    }
  })
)

const logFormatColor = format.combine(format.colorize(), logFormat)

// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = createLogger({
  level: 'info',
  format: logFormat,
  transports: [],
})

logger.add(
  new transports.Console({
    level: 'debug',
    format: logFormatColor,
  })
)

if (process.env.NODE_ENV.toLowerCase() === 'test') {
  logger.silent = true
  // logger.add(
  //   new transports.File({
  //     filename: 'logs/test.log',
  //     format: logFormat,
  //   })
  // )
} else {
  logger.add(
    new transports.File({
      filename: 'logs/error.log',
      level: 'error',
    })
  )

  logger.add(
    new transports.File({
      filename: 'logs/combined.log',
    })
  )
}
class Log {
  originalLogger: Logger
  currentLabel: string

  constructor(label: string) {
    this.currentLabel = label
    this.originalLogger = logger
  }

  error(message: string): void {
    this.originalLogger.error(message, { label: this.currentLabel })
  }

  warn(message: string): void {
    this.originalLogger.warn(message, { label: this.currentLabel })
  }

  info(message: string): void {
    this.originalLogger.info(message, { label: this.currentLabel })
  }

  http(message: string): void {
    this.originalLogger.http(message, { label: this.currentLabel })
  }

  verbose(message: string): void {
    this.originalLogger.verbose(message, { label: this.currentLabel })
  }

  debug(message: string): void {
    this.originalLogger.debug(message, { label: this.currentLabel })
  }

  silly(message: string): void {
    this.originalLogger.silly(message, { label: this.currentLabel })
  }
}

export default Log
