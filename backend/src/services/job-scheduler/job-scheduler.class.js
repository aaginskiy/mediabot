/* eslint-disable no-unused-vars */
const _ = require('lodash');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) {
    app.info('Service initiated with 1 worker.', { label: 'JobSchedulerService'});
    this.app = app;
    this.workers = [];
    this.JobService = app.service('jobs');
    this.MovieService = app.service('movies');
    this.workers.push({
      id: 0,
      status: app.get('SCHEDULER_STATUS.IDLE'),
      currentJobId: null,
      currentJob: null,
    });
    this.nextTick();
  }

  async nextTick() {
    this.app.silly('Executing nextTick.', { label: 'JobSchedulerService'});

    if (!_.some(this.workers, ['status', this.app.get('SCHEDULER_STATUS.IDLE')])) {
      this.app.debug('No workers available.', { label: 'JobSchedulerService'});
    } else {
      this.app.silly('Loading pending jobs.', { label: 'JobSchedulerService'});
      var jobs = await this.JobService.find({ query: { status: this.app.get('JOB_STATUS.NEW') }});

      this.workers.forEach((worker) => {
        let job = jobs.shift();

        if (worker.status === this.app.get('SCHEDULER_STATUS.IDLE') && job && job.status === this.app.get('JOB_STATUS.NEW')) {
          this.app.debug(`Adding job #${job._id} to worker #${worker.id}.`, { label: 'JobSchedulerService'});
          this.run(worker.id, job);
        }
      });
    }
    setTimeout(this.nextTick.bind(this), 5000);
  }

  async run(workerId, jobData) {
    this.app.info(`Worker #${workerId} is executing job #${jobData._id}.`, { label: 'JobSchedulerService'});
    const Service = this.app.service(jobData.service);
    const item = await this.MovieService.get(jobData.movieId);

    if (jobData.status === this.app.get('JOB_STATUS.RUNNING')) {
      return new Error(`Job #${jobData._id} is already running.`);
    } else if (jobData.status === this.app.get('JOB_STATUS.NEW')) {
      await this.JobService.patch(jobData._id, {status: this.app.get('JOB_STATUS.RUNNING')}, {});
      const serviceEvent = Service[jobData.function](item._id, item);

      serviceEvent.on('progress', (progress) => this.JobService.patch(jobData._id, {progress: progress}, {}));
      serviceEvent.on('finished', async (message) => {
        await this.JobService.patch(jobData._id, {status: this.app.get('JOB_STATUS.SUCCESS')}, {});
        this.app.info(`Job #${jobData._id} completed successfully.`, { label: 'JobSchedulerService'});
        this.workers[workerId].status = this.app.get('SCHEDULER_STATUS.IDLE');
      });
      serviceEvent.on('error', (error) => console.log(error));
    }
  }

  // async find (params) {
  //   return [];
  // }

  // async get (id, params) {
  //   return {
  //     id, text: `A new message with ID: ${id}!`
  //   };
  // }

  // async create (data, params) {
  //   if (Array.isArray(data)) {
  //     return await Promise.all(data.map(current => this.create(current)));
  //   }

  //   return data;
  // }

  // async update (id, data, params) {
  //   return data;
  // }

  // async patch (id, data, params) {
  //   return data;
  // }

  // async remove (id, params) {
  //   return { id };
  // }

}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
