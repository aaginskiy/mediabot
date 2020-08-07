/* eslint-disable no-console */
const app = require('./app')
const logger = require('./logger')
const port = app.get('port')
const host = app.get('host')
const server = app.listen(port)

process.on('unhandledRejection', (reason, p) =>
  console.log('Unhandled Rejection at: Promise ', p, reason)
)

server.on('listening', () =>
  logger.info(`Feathers application started on http://${host}:${port}`, { label: 'MovieBotServer' })
)
