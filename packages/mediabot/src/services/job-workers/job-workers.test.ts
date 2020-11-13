/* global describe it beforeAll beforeEach afterEach expect jest */
import feathers from '@feathersjs/feathers'
import express from '@feathersjs/express'
import { EventEmitter } from 'events'
import JobWorkerService from './job-workers.service'
import MemoryService from 'feathers-memory'
import { Application } from '@feathersjs/express'
// import { JobWorkerData, JobData } from '../../declarations'

const app: Application = express(feathers())
app.use('/jobs', MemoryService({ paginate: false, multi: true }))
app.configure(JobWorkerService)

const jobworker = app.service('job-workers')
const jobs = app.service('jobs')

describe("'Job Worker' service", () => {
  let spy: jest.SpyInstance

  beforeAll(() => {
    return Promise.all([
      jobworker.create([{ status: 'active' }, { status: 'active' }, { status: 'active' }, { status: 'active' }]),
      jobs.create({ status: 'running', name: 'spyFunction', args: ['arg1', 'arg2'] }),
      jobs.create({ status: 'queued', name: 'spyFunction', args: ['arg1', 'arg2'] }),
    ])
  })

  beforeEach((done) => {
    spy = jest.spyOn(jobworker, 'scheduleJobs')
    jest.useFakeTimers()
    done()
  })

  afterEach((done) => {
    spy.mockClear()
    jest.clearAllTimers()
    done()
  })

  it('register the service', () => expect(jobworker).toBeTruthy())

  it('should do nothing if no idle workers available', () =>
    expect(jobworker.scheduleJobs().then(() => jobworker.find())).resolves.toMatchObject([
      {
        id: 0,
        status: 'active',
      },
      {
        id: 1,
        status: 'active',
      },
      {
        id: 2,
        status: 'active',
      },
      {
        id: 3,
        status: 'active',
      },
    ]))

  it('should periodically run scheduleJobs after start', () => {
    jobworker.startJobs()
    jest.advanceTimersByTime(260)
    return expect(spy).toBeCalledTimes(2)
  })

  it('should not run scheduleJobs after stop', () => {
    jobworker.startJobs()
    jest.advanceTimersByTime(260)
    jobworker.stopJobs()
    jest.advanceTimersByTime(260)
    return expect(spy).toBeCalledTimes(2)
  })

  describe('workers are available', () => {
    let emitter: EventEmitter
    beforeEach((done) => {
      emitter = new EventEmitter()

      jobs.spyFunction = jest.fn((_arg1, _arg2) => emitter)
      jest.spyOn(jobs, 'patch')
      done()
    })
    afterEach(() => {
      Promise.all([
        jobworker.patch(1, { status: 'active', jobId: undefined }),
        jobworker.patch(2, { status: 'idle', jobId: undefined }),
        jobworker.patch(3, { status: 'active', jobId: undefined }),
        jobworker.patch(0, { status: 'active', jobId: undefined }),
        jobs.patch(0, { status: 'running', name: 'spyFunction', args: ['arg1', 'arg2'] }),
        jobs.patch(1, { status: 'queued', name: 'spyFunction', args: ['arg1', 'arg2'] }),
      ])
      jobs.spyFunction.mockClear()
      jobs.patch.mockClear()
    })

    it('should assign all idle workers', async () => {
      await Promise.all([
        jobworker.patch(1, { status: 'idle', jobId: undefined }),
        jobworker.patch(2, { status: 'idle', jobId: undefined }),
        jobworker.patch(3, { status: 'idle', jobId: undefined }),
        jobworker.patch(0, { status: 'idle', jobId: undefined }),
        jobs.patch(1, { status: 'queued', priority: 'low', name: 'spyFunction', args: ['arg1', 'arg2'] }),
        jobs.patch(0, { status: 'queued', priority: 'high', name: 'spyFunction', args: ['arg1', 'arg2'] }),
      ])

      await jobworker.scheduleJobs()
      const workers = await jobworker.find({ query: { status: 'active' } })
      return expect(workers.length).toBe(2)
    })

    it('should change status to active', async () => {
      await jobworker.scheduleJobs()

      return expect(jobworker.get(2)).resolves.toHaveProperty('status', 'active')
    })

    it('should change jobId to active', async () => {
      await jobworker.scheduleJobs()

      return expect(jobworker.get(2)).resolves.toHaveProperty('jobId', 1)
    })

    it('should run job by jobId', async () => {
      await jobworker.scheduleJobs()

      return expect(jobs.spyFunction).toHaveBeenCalledWith('arg1', 'arg2')
    })

    it('should set job status to running', async () => {
      await jobworker.scheduleJobs()

      return expect(jobs.get(1)).resolves.toHaveProperty('status', 'running')
    })

    it('should update job progress when progress emitted', async () => {
      await jobworker.scheduleJobs()
      emitter.emit('progress', 5)
      return expect(jobs.patch).toHaveBeenLastCalledWith(1, { progress: 5 })
    })

    it('should mark job completed when done', async () => {
      await jobworker.scheduleJobs()
      emitter.emit('done', 'result')
      return expect(jobs.patch).toHaveBeenLastCalledWith(1, { status: 'completed', statusMessage: 'result' })
    })

    it('should mark job failed when error', async () => {
      // console.log(await jobs.find(null))
      await jobworker.scheduleJobs()
      emitter.emit('error', 'error message')
      // await new Promise((r) => setTimeout(r, 50)
      console.log('t3')
      return expect(jobs.patch).toHaveBeenLastCalledWith(1, { status: 'failed', statusMessage: 'error message' })
    })

    it('should run high priority job before low priority', async () => {
      await Promise.all([
        jobs.patch(1, { status: 'queued', priority: 'high' }),
        jobs.patch(0, { status: 'queued', priority: 'low' }),
      ])

      await jobworker.scheduleJobs()

      return expect(jobs.get(1)).resolves.toHaveProperty('status', 'running')
    })
  })
})
