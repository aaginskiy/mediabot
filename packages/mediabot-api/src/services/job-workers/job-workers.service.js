// Initializes the `job-worker` service on path `/job-worker`
const createService = require('./job-workers.class')
const hooks = require('./job-workers.hooks')

module.exports = function (app) {
  const paginate = app.get('paginate')

  const options = {
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/job-workers', createService(options))

  // Get our initialized service so that we can register hooks
  const service = app.service('job-workers')

  service.hooks(hooks)
}
