// Load global dependencies
const path = require('path')
const parseArgs = require('minimist')
const fs = require('fs')

// Set up base app
const feathers = require('@feathersjs/feathers')
const express = require('@feathersjs/express')
const logger = require('./logger')
const app = express(feathers())

// Load config file
var argv = parseArgs(process.argv.slice(2))
var configLocation

if (argv['config']) {
  configLocation = path.join(__dirname, argv['config'])
} else {
  configLocation = path.join(__dirname, '../config/')
}

let dataLocation

if (process.env.NODE_ENV.toLowerCase() === 'test') {
  dataLocation = path.join(__dirname, '../../test/data/')
} else {
  dataLocation = path.join(configLocation, './data/')
}

app.set('configLocation', configLocation)

app.set('dataLocation', dataLocation)

const configFile = path.join(configLocation, './default.json')

if (!fs.existsSync(configFile)) {
  console.log(`No configuration found in ${configLocation}`)
  console.log('Exiting...')
  process.exit()
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

const handler = require('@feathersjs/express').errorHandler
const { NotFound, GeneralError, BadRequest } = require('@feathersjs/errors')

const middleware = require('./middleware')
const services = require('./services')
const appHooks = require('./app.hooks')
const channels = require('./channels')

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
// app.use('/', express.static(app.get('public')))

app.configure(rest())
app.configure(socketio())

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware)
// Set up our services (see `services/index.js`)
app.configure(services)
app.configure(channels)
// Configure a middleware for 404s and the error handler
// app.use(NotFound())
app.use(handler())

app.hooks(appHooks)

app.logger = logger

module.exports = app
