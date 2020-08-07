/* eslint-disable no-unused-vars */
const path = require('path')
const logger = require('../../logger')

class Service {
  constructor(options) {
    this.options = options || {}
  }

  setup(app) {
    this.app = app
    this.ScrapeService = app.service('utils/media-scraper')
    this.MetadataEditor = app.service('utils/metadata-editor')
    this.DiskScanner = app.service('utils/disk-scanner')
    this.Jobs = app.service('jobs')
  }

  async create(data, params) {
    logger.info(`Received webhook request - ${data.eventType}.`, { label: 'WebhookService' })
    logger.debug(data)

    // Check for radarr webhook
    if (data.movie && data.eventType === 'Download') {
      logger.info(`Processing 'Download' webhook from Radarr.`, { label: 'WebhookService' })

      let tmdbId = data.remoteMovie.tmdbId
      let filename = path.join(data.movie.folderPath, data.movieFile.relativePath)

      return this.Jobs.create(
        {
          args: [tmdbId, filename],
          name: 'ScanScrapeMovie',
        },
        {}
      ).catch((err) => {
        logger.error(`Processing 'Download' webhook from Radarr failed.`, {
          label: 'WebhookService',
        })
        logger.error(err.message, { label: 'WebhookService' })
        logger.debug(err.stack, { label: 'WebhookService' })
        throw err
      })
    }

    return Promise.resolve(data)
  }
}

module.exports = function(options) {
  return new Service(options)
}

module.exports.Service = Service
