import { Log } from '@/utils'
const logger = new Log('Boot')
import app from '@/app'

const port = app.get('port')
const server = app.listen(port)

process.on('unhandledRejection', (reason, p) => logger.error(`Unhandled Rejection at: Promise ${p} ${reason}`))

server.on('listening', () => logger.http(`Mediabot started on http://${app.get('host')}:${port}`))
