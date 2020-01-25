// Initializes the `Disk Scanner` utility service on path `/utils/disk-scanner`
const createService = require('./metadata-editor.class.js')
const { disallow } = require('feathers-hooks-common')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'metadata-editor',
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/utils/metadata-editor', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('/utils/metadata-editor')

  service.hooks({
    before: {
      all: [disallow()]
    }
  })
}
