"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = __importDefault(require("./logger"));
const logger = new logger_1.default('Boot');
const app_1 = __importDefault(require("./app"));
const feathers_1 = __importDefault(require("@feathersjs/feathers"));
const express_1 = __importDefault(require("@feathersjs/express"));
const socketio_1 = __importDefault(require("@feathersjs/socketio"));
const appWrapper = express_1.default(feathers_1.default());
appWrapper.configure(socketio_1.default());
appWrapper.use('/api', app_1.default);
const port = app_1.default.get('port');
const server = app_1.default.listen(port);
process.on('unhandledRejection', (reason, p) => logger.info(`Unhandled Rejection at: Promise ${p} ${reason}`));
server.on('listening', () => logger.info(`Mediabot started on http://${app_1.default.get('host')}:${port}`));
