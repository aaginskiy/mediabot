const movies = require('./movies/movies.service.js')
const mediaFile = require('./media-file/media-file.service.js')

const job = require('./job/job.service.js')

const image = require('./image/image.service.js')

const scrape = require('./scrape/scrape.service.js')

const webhook = require('./webhook/webhook.service.js')

const settings = require('./settings/settings.service.js')

const jobWorker = require('./job-worker/job-worker.service.js')

module.exports = function () {
  const app = this
  app.configure(movies)
  app.configure(mediaFile)
  app.configure(jobWorker)
  app.configure(job)
  app.configure(image)
  app.configure(scrape)
  app.configure(webhook)
  app.configure(settings)
}
