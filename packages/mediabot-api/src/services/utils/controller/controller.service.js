// Initializes the `utils/controller` service on path `/utils/controller`
const { Controller } = require('./controller.class')
const { disallow } = require('feathers-hooks-common')

module.exports = function(app) {
  const options = {
    paginate: app.get('paginate'),
  }

  // Initialize our service with any options it requires
  app.use('/utils/controller', new Controller(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('utils/controller')

  service.hooks({
    before: {
      all: [disallow()],
    },
  })
}
