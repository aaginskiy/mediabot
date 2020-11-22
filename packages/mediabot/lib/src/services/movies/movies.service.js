"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const movies_class_1 = require("./movies.class");
const movies_model_1 = __importDefault(require("../../models/movies.model"));
const movies_hooks_1 = __importDefault(require("./movies.hooks"));
function default_1(app) {
    const options = {
        Model: movies_model_1.default(app),
        id: 'id',
        multi: ['create', 'patch', 'remove'],
    };
    // Initialize our service with any options it requires
    app.use('/api/movies', new movies_class_1.Movies(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('api/movies');
    service.hooks(movies_hooks_1.default);
}
exports.default = default_1;
