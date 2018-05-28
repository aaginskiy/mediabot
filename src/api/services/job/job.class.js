const NedbService = require('feathers-nedb')

class Service extends NedbService {
  constructor (options) {
    super(options)
  }

  setup (app) {
    // app.info('Job Service initiated with 1 worker.', { label: 'JobSchedulerService' })
    // this.app = app
    // this.workers = []
    // this.JobService = app.service('jobs')
    // this.MovieService = app.service('movies')
    // this.workers.push({
    //   id: 0,
    //   status: app.get('SCHEDULER_STATUS.IDLE'),
    //   currentJobId: null,
    //   currentJob: null
    // })
    // this.nextTick()

    super.setup(app)
  }
}

module.exports = function moduleExport (options) {
  return new Service(options)
}

module.exports.Service = Service
