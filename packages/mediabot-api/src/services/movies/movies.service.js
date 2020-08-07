// Initializes the `Movies` service on path `/movies`
const createService = require('feathers-nedb')
const createModel = require('../../models/movies.model')
const hooks = require('./movies.hooks')

/**
   * @typedef Movie
   * @property {String} _id Databased entry ID
   * @property {String} title Movie title
   * @property {Integer} year Movie release year
   * @property {String} language Movie language code
   * @property {String} filename Filename of the media file
   * @property {MediaInfo} mediaInfo Media info from the media file
   */
  
module.exports = function () {
  const app = this
  const Model = createModel(app)
  const paginate = app.get('paginate')

  const options = {
    name: 'movies',
    Model,
    paginate
  }

  // Initialize our service with any options it requires
  app.use('/movies', createService(options))

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('movies')

  service.hooks(hooks)
}
