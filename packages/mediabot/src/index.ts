import logger from './logger'
import app from './app'

const port = app.get('port')
const server = app.listen(port)

process.on('unhandledRejection', (reason, p) =>
  logger.info(`Unhandled Rejection at: Promise ${p} ${reason}`, {
    label: 'Boot',
  })
)

server.on('listening', () =>
  logger.info(`Mediabot started on http://${app.get('host')}:${port}`, {
    label: 'Boot',
  })
)
