const path = require('path');
const favicon = require('serve-favicon');
const compress = require('compression');
const cors = require('cors');
const helmet = require('helmet');
const bodyParser = require('body-parser');

const feathers = require('feathers');
const seeder = require('feathers-seeder');
const seederConfig = require('./seeder-config');
const configuration = require('feathers-configuration');
const hooks = require('feathers-hooks');
const rest = require('feathers-rest');
const socketio = require('feathers-socketio');

const swagger = require('feathers-swagger');

const handler = require('feathers-errors/handler');
const notFound = require('feathers-errors/not-found');

const middleware = require('./middleware');
const services = require('./services');
const appHooks = require('./app.hooks');

const app = feathers();

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
app.use('/', feathers.static(app.get('public')));

// Set up Plugins and providers
app.configure(hooks());
app.configure(rest());
app.configure(socketio());

app.configure(swagger({
  docsPath: '/docs',
  info: {
    title: 'A test',
    description: 'A description'
  },
  uiIndex: true
}));

// Configure other middleware (see `middleware/index.js`)
app.configure(middleware);
// Set up our services (see `services/index.js`)
app.configure(services);
// Configure a middleware for 404s and the error handler
app.use(notFound());
app.use(handler());

app.hooks(appHooks);

if (app.settings.env === 'development') {
  app.seed().then(() => {
    console.log('Seeded initial database.');
  });
}

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

module.exports = app;
