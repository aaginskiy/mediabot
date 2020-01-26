const movies = require('./movies/movies.service.js')

const diskScanner = require('./utils/disk-scanner/disk-scanner.service.js')

const mediaScraper = require('./utils/media-scraper/media-scraper.service.js')

const jobs = require('./jobs/jobs.service.js')

const image = require('./image/image.service.js')

const webhook = require('./webhook/webhook.service.js')

const settings = require('./settings/settings.service.js')

const jobWorkers = require('./job-workers/job-workers.service.js')

module.exports = function () {
  const app = this
  app.configure(settings)
  app.configure(movies)
  app.configure(mediaScraper)
  app.configure(diskScanner)
  app.configure(jobs)
  app.configure(jobWorkers)
  app.service('job-workers').create([
    { status: 'idle' },
    { status: 'idle' },
    { status: 'idle' },
    { status: 'idle' }
  ])
  app.service('job-workers').startJobs()
  app.configure(image)
  app.configure(webhook)
}
