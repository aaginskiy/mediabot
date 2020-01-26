const { checkContext } = require('feathers-hooks-common')
const { NotImplemented } = require('@feathersjs/errors')

function updateContextData (data, app) {
  data.status = 'queued'
  data.progress = 0

  switch (data.name) {
    case 'ScanMediaLibrary':
      data.priority = 'high'
      data.service = 'utils/disk-scanner'
      data.function = 'scanMediaLibrary'
      data.args = [app.get('movieDirectory')]
      break
    case 'RefreshAllMediainfo':
      data.priority = 'high'
      data.service = 'utils/disk-scanner'
      data.function = 'refreshAllMediainfo'
      data.args = [app.get('movieDirectory')]
      break
    case 'RefreshMediainfo':
      data.priority = 'high'
      data.service = 'utils/disk-scanner'
      data.function = 'refreshMediainfo'
      break
    case 'MuxMovie':
      data.priority = 'normal'
      data.service = 'movies'
      data.function = 'mux'
      break
    case 'AutoScrapeMovie':
      data.priority = 'high'
      data.service = 'media-scraper'
      data.function = 'autoScrapeMovie'
      break
    default:
      throw new NotImplemented(`Command '${data.name}' is not implemented.`)
  }

  return data
}

module.exports = function (options = {}) {
  return context => {
    checkContext(context, 'before', ['create', 'patch'], 'parseJobData')

    if (!Array.isArray(context.data)) {
      context.data = updateContextData(context.data, context.app)
    } else {
      context.data = context.data.map(item => updateContextData(item, context.app))
    }

    return context
  }
}
