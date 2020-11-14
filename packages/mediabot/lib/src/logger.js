"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
if (!process.env.NODE_ENV)
    process.env.NODE_ENV = 'development';
const prettyPrint = winston_1.format((info) => {
    if (typeof info.message !== 'string') {
        info.message = JSON.stringify(info.message, null, 2);
        info.isString = false;
    }
    else {
        info.isString = true;
    }
    return info;
});
const logFormat = winston_1.format.combine(prettyPrint(), winston_1.format.timestamp(), winston_1.format.align(), winston_1.format.printf((info) => {
    if (info.isString) {
        return `${info.timestamp} [${info.label}] ${info.level}: ${info.message}`;
    }
    else {
        return info.message;
    }
}));
const logFormatColor = winston_1.format.combine(winston_1.format.colorize(), logFormat);
// Configure the Winston logger. For the complete documentation see https://github.com/winstonjs/winston
const logger = winston_1.createLogger({
    level: 'info',
    format: logFormat,
    transports: [],
});
logger.add(new winston_1.transports.Console({
    level: 'debug',
    format: logFormatColor,
}));
if (process.env.NODE_ENV.toLowerCase() === 'test') {
    logger.silent = true;
    // logger.add(
    //   new transports.File({
    //     filename: 'logs/test.log',
    //     format: logFormat,
    //   })
    // )
}
else {
    logger.add(new winston_1.transports.File({
        filename: 'logs/error.log',
        level: 'error',
    }));
    logger.add(new winston_1.transports.File({
        filename: 'logs/combined.log',
    }));
}
class Log {
    constructor(label) {
        this.currentLabel = label;
        this.originalLogger = logger;
    }
    error(message) {
        this.originalLogger.error(message, { label: this.currentLabel });
    }
    warn(message) {
        this.originalLogger.warn(message, { label: this.currentLabel });
    }
    info(message) {
        this.originalLogger.info(message, { label: this.currentLabel });
    }
    http(message) {
        this.originalLogger.http(message, { label: this.currentLabel });
    }
    verbose(message) {
        this.originalLogger.verbose(message, { label: this.currentLabel });
    }
    debug(message) {
        this.originalLogger.debug(message, { label: this.currentLabel });
    }
    silly(message) {
        this.originalLogger.silly(message, { label: this.currentLabel });
    }
}
exports.default = Log;
