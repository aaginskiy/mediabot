const { checkContext } = require('feathers-hooks-common')
const { NotImplemented } = require('@feathersjs/errors')

module.exports = function (options = {}) {
  return context => {
    checkContext(context, 'before', ['create', 'patch'], 'parseJobData')

    context.data.status = 'queued'
    context.data.progress = 0

    switch (context.data.name) {
      case 'ScanMediaLibrary':
        context.data.priority = 'high'
        context.data.service = 'utils/disk-scanner'
        context.data.function = 'scanMediaLibrary'
        context.data.args = [context.app.get('settings').movieDirectory]
        break
      case 'RefreshAllMediainfo':
        context.data.priority = 'high'
        context.data.service = 'utils/disk-scanner'
        context.data.function = 'refreshAllMediainfo'
        context.data.args = [context.app.get('settings').movieDirectory]
        break
      case 'RefreshMediainfo':
        context.data.priority = 'high'
        context.data.service = 'utils/disk-scanner'
        context.data.function = 'refreshMediainfo'
        break
      case 'MuxMovie':
        context.data.priority = 'normal'
        context.data.service = 'movies'
        context.data.function = 'mux'
        break
      case 'AutoScrapeMovie':
        context.data.priority = 'high'
        context.data.service = 'media-scraper'
        context.data.function = 'autoScrapeMovie'
        break
      default:
        throw new NotImplemented(`Command '${context.data.name}' is not implemented.`)
    }

    return context
  }
}
