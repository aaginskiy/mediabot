if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development'
import path from 'path'
import fs from 'fs'
import favicon from 'serve-favicon'
import compress from 'compression'
import helmet from 'helmet'
import cors from 'cors'

import feathers from '@feathersjs/feathers'
import express from '@feathersjs/express'
import socketio from '@feathersjs/socketio'

import { Application } from './declarations'
import defaultConfigExample from '../default-config.example'
import logger from './logger'
import middleware from './middleware'
import services from './services'
import appHooks from './app.hooks'
import channels from './channels'
// Don't remove this comment. It's needed to format import lines nicely.

const app: Application = express(feathers())
// Load config file
const configLocation = path.join(__dirname, '../../../config/')

const dataLocation =
  process.env.NODE_ENV.toLowerCase() === 'test'
    ? path.join(__dirname, '../test/data/')
    : path.join(configLocation, './data/')

app.set('configLocation', configLocation)

app.set('dataLocation', dataLocation)

const configFile = path.join(configLocation, './default.json')

if (!fs.existsSync(configFile)) {
  logger.error(`No configuration found in ${configLocation}`, {
    label: 'Settings',
  })
  logger.info(`Writing default configuration to ${configLocation}`, {
    label: 'Settings',
  })

  try {
    if (!fs.existsSync(configLocation)) {
      fs.mkdirSync(configLocation)
    }

    fs.writeFileSync(configFile, JSON.stringify(defaultConfigExample, null, '  '))
  } catch (error) {
    logger.error(error.message, {
      label: 'Settings',
    })
  }
}

process.env['NODE_CONFIG_DIR'] = configLocation

import configuration from '@feathersjs/configuration'

app.configure(configuration())
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet())
app.use(cors())
app.use(compress())
app.use(express.json())
app.use(express.urlencoded({ extended: true }))
app.use(favicon(path.join('./public', 'favicon.ico')))
// Host the public folder
app.use('/', express.static('./public'))

// Set up Plugins and providers
app.configure(express.rest())
app.configure(socketio())

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware)
// Set up our services (see `services/index.js`)
app.configure(services)
// Set up event channels (see channels.js)
app.configure(channels)

// Configure a middleware for 404s and the error handler
app.use(express.notFound())
app.use(express.errorHandler({ logger } as any))

app.hooks(appHooks)

export default app
