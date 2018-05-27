const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const seeder = require('feathers-seeder');
const seederConfig = require('./seeder-config');
const configuration = require('@feathersjs/configuration');
const rest = require('@feathersjs/express/rest');
const socketio = require('@feathersjs/socketio');

// const swagger = require('feathers-swagger');

const handler = require('@feathersjs/express/errors');
const notFound = require('feathers-errors/not-found');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');
const channels = require('./channels');

const winston = require('winston');
const logger = require('feathers-logger');

const app = express(feathers());

const fs = require('fs');

// Load app configuration
app.configure(configuration());

app.configure(seeder(seederConfig));
// Enable CORS, security, compression, favicon and body parsing
app.use(cors());
app.use(helmet());
app.use(compress());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(favicon(path.join(app.get('public'), 'favicon.ico')));
// Host the public folder
app.use('/', express.static(app.get('public')));

app.configure(rest());
app.configure(socketio());

// app.configure(swagger({
//   docsPath: '/docs',
//   info: {
//     title: 'A test',
//     description: 'A description'
//   },
//   uiIndex: true
// }));

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
// Set up our services (see `services/index.js`)
app.configure(services);
app.configure(channels);
// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(handler());

app.hooks(appHooks);

const wlog = winston.createLogger({
  level: 'info',
  format: winston.format.json(),
  transports: [
    //
    // - Write to all logs with level `info` and below to `combined.log` 
    // - Write all logs error (and below) to `error.log`.
    //
    new winston.transports.File({
      filename: 'logs/error.log',
      level: 'error'
    }),
    new winston.transports.File({
      filename: 'logs/combined.log'
    })
  ]
});

//
// If we're not in production then log to the `console` with the format:
// `${info.level}: ${info.message} JSON.stringify({ ...rest }) `
// 
if (!process.env.NODE_ENV) process.env.NODE_ENV = 'development';
if (process.env.NODE_ENV !== 'production' && process.env.NODE_ENV.toLowerCase() !== 'test') {
  wlog.add(new winston.transports.Console({
    level: 'debug',
    format: winston.format.simple()
  }));
}

app.configure(logger(wlog));

// Seed initial development environment
// if (app.settings.env === 'development') {
//   app.seed().then(() => {
//     app.info('Seeded initial database.');
//   });
// }

const rmbConfigFile = path.join(__dirname, '../rmb.config.json');

if (fs.existsSync(rmbConfigFile)) {
  let settings = require('../rmb.config.json');

  Object.keys(settings).forEach(key => app.set(key, settings[key]));
} else {
  var defaultConfig = {
    'movieDirectory': '/default/movie/directory'
  };

  fs.writeFile(rmbConfigFile, JSON.stringify(defaultConfig), (err) => {
    if (err) throw err;
    console.log('Created new ruby-media-bot config file.');

  });
}

process.on('uncaughtException', function (err) {
  console.error(err.stack);
  process.exit();
});

module.exports = app;
