// Initializes the `Jobs` service on path `/jobs`
const createService = require('feathers-nedb')
const createModel = require('../../models/jobs.model')
const hooks = require('./jobs.hooks')

module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'jobs',
    id: 'id',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/jobs', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('jobs')

  service.hooks(hooks)
}
