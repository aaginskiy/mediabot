// Initializes the `job-worker` service on path `/job-worker`
const createService = require('./job-worker.class')
const hooks = require('./job-worker.hooks')

module.exports = function (app) {
  const paginate = app.get('paginate')

  const options = {
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/job-worker', createService(options))

  // Get our initialized service so that we can register hooks
  const service = app.service('job-worker')

  service.hooks(hooks)
}
