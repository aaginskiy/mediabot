const { checkContext } = require('feathers-hooks-common')
const { NotImplemented } = require('@feathersjs/errors')

module.exports = function (options = {}) {
  return context => {
    checkContext(context, 'before', ['create', 'patch'], 'parseJobData')

    context.data.status = 'queued'
    context.data.progress = 0

    switch (context.data.name) {
      case 'RescanMovies':
        context.data.priority = 'high'
        context.data.service = 'movies'
        context.data.function = 'rescan'
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
