import Log from './logger'
const logger = new Log('Boot')
import app from './app'
import { Application } from './declarations'

import feathers from '@feathersjs/feathers'
import express from '@feathersjs/express'
import socketio from '@feathersjs/socketio'

const appWrapper: Application = express(feathers())

appWrapper.configure(socketio())

appWrapper.use('/api', app)

const port = app.get('port')
const server = app.listen(port)

process.on('unhandledRejection', (reason, p) => logger.info(`Unhandled Rejection at: Promise ${p} ${reason}`))

server.on('listening', () => logger.info(`Mediabot started on http://${app.get('host')}:${port}`))
