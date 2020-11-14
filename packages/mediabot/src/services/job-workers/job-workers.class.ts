import { Service, MemoryServiceOptions } from 'feathers-memory'
import { Application, JobData, JobName, JobWorkerData } from '../../declarations'
import { Paginated } from '@feathersjs/feathers'
import Log from '../../logger'
const logger = new Log('JobWorker')

// Add this service to the service type index
declare module '../../declarations' {
  interface JobWorkerData {
    id: string
    jobId: string
    status: 'idle' | 'active'
  }

  type JobName = 'scanMediaLibrary' | 'addMovie' | 'refreshMovie'
}

export class JobWorkers extends Service<JobWorkerData> {
  app: Application
  runner!: NodeJS.Timeout

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<MemoryServiceOptions>, app: Application) {
    super(options)
    this.app = app
  }

  isValidJobName(name: string): name is JobName {
    return ['scanMediaLibrary', 'addMovie', 'refreshMovie'].includes(name)
  }

  async scheduleJobs(): Promise<Paginated<JobWorkerData> | Array<JobWorkerData>> {
    const response = await this.find({ query: { status: 'idle' } })
    let workers: JobWorkerData[]
    const JobService = this.app.service('api/jobs')

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
          try {
            const tempJobService: any = JobService
            tempJobService[job.name](...job.args)
              .on('progress', async (progress: number) => {
                JobService.patch(job.id, { progress: progress })
              })
              .on('done', async (message: string) => {
                await JobService.patch(job.id, { status: 'completed', statusMessage: message })

                await this.patch(worker.id, { jobId: undefined, status: 'idle' })
              })
              .on('error', async (e: Error) => {
                logger.error(`JobID #${job.id} (${job.name}) failed due to error.`)
                logger.error(e.message)
                if (e.stack) logger.debug(e.stack)
                console.log('test1')
                await Promise.all([
                  JobService.patch(job.id, { status: 'failed', statusMessage: e.message }),
                  this.patch(worker.id, { jobId: undefined, status: 'idle' }),
                ])

                console.log('test2')
              })

            await this.patch(worker.id, { jobId: job.id, status: 'active' })
            await JobService.patch(job.id, { status: 'running' })
          } catch (e) {
            logger.error(`JobID #${job.id} (${job.name}) failed due to error.`)
            logger.error(e.message)
            logger.debug(e.stack)
            await Promise.all([
              JobService.patch(job.id, { status: 'failed', statusMessage: e.message }),
              this.patch(worker.id, { jobId: undefined, status: 'idle' }),
            ])
          }
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
