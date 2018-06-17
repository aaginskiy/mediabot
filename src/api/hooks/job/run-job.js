const { checkContext, getByDot } = require('feathers-hooks-common')
const MediaScraper = require('../../../util/media-scraper')()

module.exports = function (options = {}) {
  return async context => {
    checkContext(context, 'after', ['patch'], 'run-job')

    if (context.params.runJob === true) {
      let result = getByDot(context, 'result')

      let service

      switch (context.data.service) {
        case 'media-scraper':
          service = MediaScraper
          break
        default:
          service = context.app.service(result.service)
      }

      context.app.info(`Running Job #${context.id} - ${service}#${result.function} with ${result.args}`, { label: 'JobService' })
      service[result.function](...result.args)
        .then(() =>
          context.service.patch(context.id, { progress: 100, status: 'completed' }))
        .catch(error =>
          context.service.patch(context.id, { progress: 0, status: 'failed', error: error.toString() }))
    }

    return context
  }
}
