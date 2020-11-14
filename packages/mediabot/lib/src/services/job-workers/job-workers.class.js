"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JobWorkers = void 0;
const feathers_memory_1 = require("feathers-memory");
const logger_1 = __importDefault(require("../../logger"));
const logger = new logger_1.default('JobWorker');
class JobWorkers extends feathers_memory_1.Service {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options, app) {
        super(options);
        this.app = app;
    }
    isValidJobName(name) {
        return ['scanMediaLibrary', 'addMovie', 'refreshMovie'].includes(name);
    }
    async scheduleJobs() {
        const response = await this.find({ query: { status: 'idle' } });
        let workers;
        const JobService = this.app.service('api/jobs');
        if (Array.isArray(response)) {
            workers = response;
        }
        else {
            workers = response.data;
        }
        if (workers.length) {
            const response = await JobService.find({
                query: {
                    status: 'queued',
                    $sort: {
                        priority: 1,
                    },
                },
            });
            let jobs;
            if (Array.isArray(response)) {
                jobs = response;
            }
            else {
                jobs = response.data;
            }
            workers.forEach(async (worker) => {
                const job = jobs.shift();
                if (job) {
                    try {
                        const tempJobService = JobService;
                        tempJobService[job.name](...job.args)
                            .on('progress', async (progress) => {
                            JobService.patch(job.id, { progress: progress });
                        })
                            .on('done', async (message) => {
                            await JobService.patch(job.id, { status: 'completed', statusMessage: message });
                            await this.patch(worker.id, { jobId: undefined, status: 'idle' });
                        })
                            .on('error', async (e) => {
                            logger.error(`JobID #${job.id} (${job.name}) failed due to error.`);
                            logger.error(e.message);
                            if (e.stack)
                                logger.debug(e.stack);
                            console.log('test1');
                            await Promise.all([
                                JobService.patch(job.id, { status: 'failed', statusMessage: e.message }),
                                this.patch(worker.id, { jobId: undefined, status: 'idle' }),
                            ]);
                            console.log('test2');
                        });
                        await this.patch(worker.id, { jobId: job.id, status: 'active' });
                        await JobService.patch(job.id, { status: 'running' });
                    }
                    catch (e) {
                        logger.error(`JobID #${job.id} (${job.name}) failed due to error.`);
                        logger.error(e.message);
                        logger.debug(e.stack);
                        await Promise.all([
                            JobService.patch(job.id, { status: 'failed', statusMessage: e.message }),
                            this.patch(worker.id, { jobId: undefined, status: 'idle' }),
                        ]);
                    }
                }
            });
        }
        return this.find();
    }
    startJobs() {
        this.scheduleJobs();
        this.runner = setTimeout(this.startJobs.bind(this), 250);
    }
    stopJobs() {
        clearTimeout(this.runner);
    }
}
exports.JobWorkers = JobWorkers;
