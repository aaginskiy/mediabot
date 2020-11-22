"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
if (!process.env.NODE_ENV)
    process.env.NODE_ENV = 'development';
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const serve_favicon_1 = __importDefault(require("serve-favicon"));
const compression_1 = __importDefault(require("compression"));
const helmet_1 = __importDefault(require("helmet"));
const cors_1 = __importDefault(require("cors"));
const feathers_1 = __importDefault(require("@feathersjs/feathers"));
const express_1 = __importDefault(require("@feathersjs/express"));
const socketio_1 = __importDefault(require("@feathersjs/socketio"));
const default_config_example_1 = __importDefault(require("../default-config.example"));
const logger_1 = __importDefault(require("./logger"));
const logger = new logger_1.default('main');
const middleware_1 = __importDefault(require("./middleware"));
const services_1 = __importDefault(require("./services"));
const app_hooks_1 = __importDefault(require("./app.hooks"));
const channels_1 = __importDefault(require("./channels"));
// Don't remove this comment. It's needed to format import lines nicely.
const app = express_1.default(feathers_1.default());
// Load config file
const configLocation = path_1.default.join(__dirname, '../../../config/');
const dataLocation = process.env.NODE_ENV.toLowerCase() === 'test'
    ? path_1.default.join(__dirname, '../test/data/')
    : path_1.default.join(configLocation, './data/');
app.set('configLocation', configLocation);
app.set('imageCacheLocation', `${configLocation}cache/images`);
app.set('dataLocation', dataLocation);
const configFile = path_1.default.join(configLocation, './default.json');
if (!fs_1.default.existsSync(configFile)) {
    logger.error(`No configuration found in ${configLocation}`);
    logger.info(`Writing default configuration to ${configLocation}`);
    try {
        if (!fs_1.default.existsSync(configLocation)) {
            fs_1.default.mkdirSync(configLocation);
        }
        console.log(configLocation);
        fs_1.default.writeFileSync(configFile, JSON.stringify(default_config_example_1.default, null, '  '));
    }
    catch (error) {
        logger.error(error.message);
    }
}
process.env['NODE_CONFIG_DIR'] = configLocation;
const configuration_1 = __importDefault(require("@feathersjs/configuration"));
app.configure(configuration_1.default());
// Enable security, CORS, compression, favicon and body parsing
app.use(helmet_1.default());
app.use(cors_1.default());
app.use(compression_1.default());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
app.use(serve_favicon_1.default(path_1.default.join('./public', 'favicon.ico')));
// Host the public folder
app.use('/', express_1.default.static('./public'));
// Set up Plugins and providers
app.configure(express_1.default.rest());
app.configure(socketio_1.default());
// Configure other middleware (see `middleware/index.js`)
app.configure(middleware_1.default);
// Set up our services (see `services/index.js`)
app.configure(services_1.default);
// Set up event channels (see channels.js)
app.configure(channels_1.default);
// Configure a middleware for 404s and the error handler
app.use(express_1.default.notFound());
app.use(express_1.default.errorHandler({ logger }));
app.hooks(app_hooks_1.default);
exports.default = app;
