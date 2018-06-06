// Initializes the `Media File` service on path `/media-file`
const createService = require('./media-file.class.js')
const hooks = require('./media-file.hooks')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'media-file',
    paginate
  }
  console.log(createService)
  console.log(createService(options))
  // Initialize our service with any options it requires
  app.use('/media-file', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('media-file')

  service.hooks(hooks)
}
