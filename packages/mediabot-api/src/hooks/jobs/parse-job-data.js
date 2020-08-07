const { checkContext } = require('feathers-hooks-common')
const { NotImplemented } = require('@feathersjs/errors')

function updateContextData(data, app) {
  data.status = 'queued'
  data.progress = 0

  switch (data.name) {
    case 'ScanMediaLibrary':
      data.priority = 'high'
      data.service = 'utils/disk-scanner'
      data.function = 'scanMediaLibrary'
      data.args = [app.get('movieDirectory')]
      break
    case 'RefreshAllMovies':
      data.priority = 'high'
      data.service = 'utils/controller'
      data.function = 'refreshAllMovies'
      data.args = [app.get('movieDirectory')]
      break
    case 'RefreshMovie':
      data.priority = 'high'
      data.service = 'utils/controller'
      data.function = 'refreshMovie'
      break
    case 'AutoFixMedia':
      data.priority = 'normal'
      data.service = 'utils/disk-scanner'
      data.function = 'autoFixMovie'
      break
    case 'AutoScrapeMovie':
      data.priority = 'high'
      data.service = 'media-scraper'
      data.function = 'autoScrapeMovie'
      break
    case 'ScanScrapeMovie':
      data.priority = 'low'
      data.service = 'utils/controller'
      data.function = 'scanScrapeSingleMovieByTmdbId'
      break
    default:
      throw new NotImplemented(`Command '${data.name}' is not implemented.`)
  }

  return data
}

module.exports = function(options = {}) {
  return (context) => {
    checkContext(context, 'before', ['create', 'patch'], 'parseJobData')

    if (!Array.isArray(context.data)) {
      context.data = updateContextData(context.data, context.app)
    } else {
      context.data = context.data.map((item) => updateContextData(item, context.app))
    }

    return context
  }
}
