"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const job_workers_class_1 = require("./job-workers.class");
const job_workers_hooks_1 = __importDefault(require("./job-workers.hooks"));
function default_1(app) {
    const options = {
        paginate: {
            default: 10,
            max: 50,
        },
        multi: true,
    };
    // Initialize our service with any options it requires
    app.use('/api/job-workers', new job_workers_class_1.JobWorkers(options, app));
    // Get our initialized service so that we can register hooks
    const service = app.service('api/job-workers');
    service.hooks(job_workers_hooks_1.default);
}
exports.default = default_1;
