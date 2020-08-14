import { Service, MemoryServiceOptions } from 'feathers-memory'
import { Application, JobData, JobWorkerData } from '../../declarations'
import { Paginated } from '@feathersjs/feathers'
import feathers from '@feathersjs/feathers'
import { Jobs } from '../jobs/jobs.class'

// Add this service to the service type index
declare module '../../declarations' {
  interface JobWorkerData {
    id: string
    jobId: string
    status: 'idle' | 'active'
  }
}

export class JobWorkers extends Service<JobWorkerData> {
  app: Application | feathers.Application
  runner!: NodeJS.Timeout

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application | feathers.Application) {
    super(options)
    this.app = app
  }

  async scheduleJobs(): Promise<Paginated<JobWorkerData> | Array<JobWorkerData>> {
    const response = await this.find({ query: { status: 'idle' } })
    let workers: JobWorkerData[]
    const JobService: Jobs = this.app.service('jobs')

    if (Array.isArray(response)) {
      workers = response
    } else {
      workers = response.data
    }

    if (workers.length) {
      const response = await JobService.find({
        query: {
          status: 'queued',
          $sort: {
            priority: 1,
          },
        },
      })
      let jobs: JobData[]

      if (Array.isArray(response)) {
        jobs = response
      } else {
        jobs = response.data
      }

      workers.forEach(async (worker) => {
        const job = jobs.shift()

        if (job) {
          this.app
            .service('jobs')
            [job.name](...job.args)
            .on('progress', async (progress: number) => {
              JobService.patch(job.id, { progress: progress })
            })
            .on('done', async (message: string) => {
              JobService.patch(job.id, { status: 'completed', statusMessage: message })
            })
            .on('error', async (message: string) => {
              JobService.patch(job.id, { status: 'failed', statusMessage: message })
            })
          await this.patch(worker.id, { jobId: job.id, status: 'active' })
          await JobService.patch(job.id, { status: 'running' })
        }
      })
    }
    return this.find()
  }

  startJobs(): void {
    this.scheduleJobs()
    this.runner = setTimeout(this.startJobs.bind(this), 250)
  }

  stopJobs(): void {
    clearTimeout(this.runner)
  }
}
