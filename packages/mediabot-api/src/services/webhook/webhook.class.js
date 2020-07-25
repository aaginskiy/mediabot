/* eslint-disable no-unused-vars */
const path = require('path')

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
    this.app.info(`Received webhook request - ${data.eventType}.`, { label: 'WebhookService' })
    this.app.debug(data)

    // Check for radarr webhook
    if (data.movie && data.eventType === 'Download') {
      this.app.info(`Processing 'Download' webhook from Radarr.`, { label: 'WebhookService' })

      let tmdbId = data.remoteMovie.tmdbId
      let filename = path.join(data.movie.folderPath, data.movieFile.relativePath)

      return this.Jobs.create(
        {
          args: [filename, tmdbId],
          name: 'ScanScrapeMedia',
        },
        {}
      ).catch((err) => {
        this.app.error(`Processing 'Download' webhook from Radarr failed.`, {
          label: 'WebhookService',
        })
        this.app.error(err.message, { label: 'WebhookService' })
        this.app.debug(err.stack, { label: 'WebhookService' })
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
