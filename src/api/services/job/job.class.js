const NedbService = require('feathers-nedb')
const Proto = require('uberproto')

const Scheduler = {
  run: async function (workerId, jobData) {
    if (jobData.status !== 'queued') throw new TypeError('Job status is expected to be \'queued\'')
    if (this.workers[workerId].status !== 'idle') throw new TypeError('Worker status is expected to be \'idle\'')

    this.app.info(`Worker #${workerId} is executing job #${jobData._id}.`, { label: 'JobService' })

    const Service = this.app.service(jobData.service)

    return this.patch(jobData._id, { status: 'running' }, {}).then((data) => {
      const serviceEvent = Service[jobData.function](...jobData.args)

      serviceEvent.on('progress', (progress) => this.JobService.patch(jobData._id, { progress: progress }, {}))
      serviceEvent.on('finished', async (message) => {
        await this.patch(jobData._id, { status: 'completed' }, {})
        this.app.info(`Job #${jobData._id} completed successfully.`, { label: 'JobService' })
        this.workers[workerId].status = 'idle'
      })
      serviceEvent.on('error', (error) => console.log(error))

      return serviceEvent
    })

    // serviceEvent.on('progress', (progress) => this.JobService.patch(jobData._id, { progress: progress }, {}))
    // serviceEvent.on('finished', async (message) => {
    //   await this.JobService.patch(jobData._id, { status: this.app.get('JOB_STATUS.SUCCESS') }, {})
    //   this.app.info(`Job #${jobData._id} completed successfully.`, { label: 'JobSchedulerService' })
    //   this.workers[workerId].status = this.app.get('SCHEDULER_STATUS.IDLE')
    // })
    // serviceEvent.on('error', (error) => console.log(error))
  },

  workers: [{
    id: 0,
    status: 'idle',
    currentJobId: null,
    currentJob: null
  }]
}

class Service extends NedbService {
  constructor (options) {
    super(options)
    // console.log(this)
    Proto.mixin({
      run: Scheduler.run,
      workers: Scheduler.workers
    }, this)
    // console.log(this)
  }

  setup (app) {
    app.info('Job Service initiated with 1 worker.', { label: 'JobService' })
    super.setup(app)
  }
}

module.exports = function moduleExport (options) {
  return new Service(options)
}

module.exports.Service = Service
