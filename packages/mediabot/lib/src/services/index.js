"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const movies_service_1 = __importDefault(require("./movies/movies.service"));
const job_workers_service_1 = __importDefault(require("./job-workers/job-workers.service"));
const jobs_service_1 = __importDefault(require("./jobs/jobs.service"));
// Don't remove this comment. It's needed to format import lines nicely.
// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
function default_1(app) {
    app.configure(movies_service_1.default);
    app.configure(job_workers_service_1.default);
    app.configure(jobs_service_1.default);
    app
        .service('api/job-workers')
        .create([{ status: 'idle' }, { status: 'idle' }, { status: 'idle' }, { status: 'idle' }]);
    app.service('api/job-workers').startJobs();
}
exports.default = default_1;
