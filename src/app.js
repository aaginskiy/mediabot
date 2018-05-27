// Load global dependencies
const path = require('path')
const parseArgs = require('minimist')
const fs = require('fs')

// Set up base app
const feathers = require('@feathersjs/feathers')
const express = require('@feathersjs/express')
const app = express(feathers())

// Load config file
var argv = parseArgs(process.argv.slice(2))
var configLocation

if (argv['config']) {
  configLocation = path.join(__dirname, argv['config'])
} else {
  configLocation = path.join(__dirname, '../../config/')
}

app.set('configLocation', configLocation)

const configFile = path.join(configLocation, './config.json')

if (fs.existsSync(configFile)) {
  let settings = require(configFile)
  Object.keys(settings).forEach(key => app.set(key, settings[key]))
} else {
  var defaultConfig = {
    'movieDirectory': '/default/movie/directory'
  }

  if (fs.existsSync(configLocation) === false) {
    fs.mkdirSync(configLocation, '0775')
  }

  fs.writeFile(configFile, JSON.stringify(defaultConfig), (err) => {
    if (err) throw err
    console.log('Created new ruby-media-bot config file.')
  })
}

// Set global constants
app.set('JOB_STATUS.NEW', 0)
app.set('JOB_STATUS.RUNNING', 1)
app.set('JOB_STATUS.SUCCESS', 2)
app.set('JOB_STATUS.ERROR', -1)

app.set('SCHEDULER_STATUS.OFF', 0)
app.set('SCHEDULER_STATUS.IDLE', 1)
app.set('SCHEDULER_STATUS.RUNNING', 2)
app.set('SCHEDULER_STATUS.ERROR', -1)

// const favicon = require('serve-favicon')
const compress = require('compression')
const cors = require('cors')
const helmet = require('helmet')
const bodyParser = require('body-parser')
const configuration = require('@feathersjs/configuration')
const rest = require('@feathersjs/express/rest')
const socketio = require('@feathersjs/socketio')

// const swagger = require('feathers-swagger');

const handler = require('@feathersjs/express/errors')
const notFound = require('@feathersjs/errors/not-found')

const middleware = require('./middleware')
const services = require('./services')
const appHooks = require('./app.hooks')
const channels = require('./channels')

const winston = require('winston')
// const moment = require('moment');
const logger = require('feathers-logger')

// Load app configuration
app.configure(configuration())
// Enable CORS, security, compression, favicon and body parsing
app.use(cors())
app.use(helmet())
app.use(compress())
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))
// app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')))

app.configure(rest())
app.configure(socketio())

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware)
// Set up our services (see `services/index.js`)
app.configure(services)
app.configure(channels)
// Configure a middleware for 404s and the error handler
app.use(notFound())
app.use(handler())

app.hooks(appHooks)

const prettyPrint = winston.format((info, opts) => {
  if (typeof info.message !== 'string') {
    info.message = JSON.stringify(info.message, null, 2)
    info.isString = false
  } else {
    info.isString = true
  }
  return info
})

const logFormat = winston.format.combine(
  prettyPrint(),
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
)

const wlog = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
})

if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'

if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV.toLowerCase() !== 'test') {
  wlog.add(new winston.transports.Console({
    level: 'debug',
    format: logFormat
  }))
}

if (process.env.NODE_ENV.toLowerCase() === 'test') {
  wlog.add(new winston.transports.File({
    filename: 'test/logs/mocha.log',
    level: 'debug',
    format: logFormat
  }))
}

app.configure(logger(wlog))

app.silly = wlog.silly

module.exports = app
