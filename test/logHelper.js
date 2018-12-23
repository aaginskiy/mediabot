
const winston = require('winston')
const fs = require('fs')

module.exports = {
  createLogger: function (filename) {
    return winston.createLogger({
      format: winston.format.combine(
        winston.format((info, opts) => {
          if (typeof info.message !== 'string') {
            info.message = JSON.stringify(info.message, null, 2)
            info.isString = false
          } else {
            info.isString = true
          }
          return info
        })(),
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.align(),
        winston.format.printf(info => {
          if (info.isString) {
            return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`
          } else {
            return info.message
          }
        })
      ),
      transports: [
        new winston.transports.Console()
      ]
    })
  },
  clearLog: function (filename) {
    try { fs.writeFileSync(filename, '') } catch (e) { console.log(e) }
  },
  dumpLog: function (filename) {
    console.log(fs.readFileSync(filename).toString())
  }
}
