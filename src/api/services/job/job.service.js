// Initializes the `Jobs` service on path `/jobs`
const createService = require('./job.class')
const createModel = require('../../models/job.model')
const hooks = require('./job.hooks')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'job',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/job', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('job')

  service.hooks(hooks)
}
