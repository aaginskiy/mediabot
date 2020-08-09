import { createLogger, format, transports } from 'winston'

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

export default logger
