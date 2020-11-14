"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const jobs_class_1 = require("./jobs.class");
const jobs_model_1 = __importDefault(require("../../models/jobs.model"));
const jobs_hooks_1 = __importDefault(require("./jobs.hooks"));
function default_1(app) {
    const options = {
        Model: jobs_model_1.default(app),
        id: 'id',
        paginate: app.get('paginate'),
        multi: ['create', 'update', 'remove'],
    };
    // Initialize our service with any options it requires
    app.use('api/jobs', new jobs_class_1.Jobs(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('api/jobs');
    service.hooks(jobs_hooks_1.default);
}
exports.default = default_1;
