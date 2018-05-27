/* eslint-disable no-console */
const app = require('./app');
const port = app.get('port');
const host = app.get('host');
const server = app.listen(port);

process.on('unhandledRejection', (reason, p) =>
  app.error('Unhandled Rejection at: Promise ', p, reason)
);

server.on('listening', () =>
  app.info(`Feathers application started on http://${host}:${port}`)
);
