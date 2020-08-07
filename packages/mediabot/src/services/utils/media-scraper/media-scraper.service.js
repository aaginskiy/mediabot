// Initializes the `Disk Scanner` utility service on path `/utils/disk-scanner`
const createService = require('./media-scraper.class.js')
const { disallow } = require('feathers-hooks-common')

module.exports = function () {
  const app = this
  const paginate = app.get('paginate')

  const options = {
    name: 'media-scraper',
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/utils/media-scraper', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('/utils/media-scraper')

  service.hooks({
    before: {
      all: [disallow()]
    }
  })
}
