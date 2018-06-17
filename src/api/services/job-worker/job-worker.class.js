const MemoryService = require('feathers-memory')

class Service extends MemoryService.Service {
  setup (app) {
    this.app = app
  }

  async scheduleJobs () {
    let workers = await this.find({ query: { status: 'idle' } })

    if (workers.length) {
      let jobs = await this.app.service('job').find({ query: { status: 'queued' } })

      workers.forEach(worker => {
        let job = jobs.shift()

        if (job) {
          this.patch(worker.id, { jobId: job.id, status: 'active' })
          this.app.service('job').patch(job.id, { status: 'running' })
        }
      })
    }

    this.app.service('job').on('patched', async job => {
      if (job.status === 'completed' || job.status === 'failed') {
        let data = await this.find({ query: { jobId: job.id } })
        await this.patch(data[0].id, { status: 'idle', jobId: undefined })
      }
    })

    return this.find()
  }

  startJobs () {
    this.scheduleJobs()
    this.runner = setTimeout(this.startJobs.bind(this), 250)
  }

  stopJobs () {
    clearTimeout(this.runner)
  }
}

module.exports = function (options) {
  return new Service(options)
}

module.exports.Service = Service
