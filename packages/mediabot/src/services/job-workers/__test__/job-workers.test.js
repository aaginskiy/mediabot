/* global describe it beforeAll beforeEach afterEach expect jest */
const feathers = require('@feathersjs/feathers')
const JobWorkerService = require('../job-workers.service')
const MemoryService = require('feathers-memory')

const app = feathers()
app.use('/jobs', MemoryService({ paginate: false }))
app.configure(JobWorkerService)
app.setup()

const jobworker = app.service('job-workers')
const jobs = app.service('jobs')

describe("'Job Worker' service", () => {
  beforeAll(() => {
    return Promise.all([
      jobworker.create([
        { status: 'active' },
        { status: 'active' },
        { status: 'active' },
        { status: 'active' },
      ]),
      jobs.create([{ status: 'running' }, { status: 'queued' }]),
    ])
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

  describe('worker is available', () => {
    beforeEach(() =>
      Promise.all([
        jobworker.patch(2, { status: 'idle', jobId: undefined }),
        jobs.patch(1, { status: 'queued' }),
      ])
    )

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

      return expect(jobs.get(1)).resolves.toHaveProperty('status', 'running')
    })

    it('should reset to idle after job is completed', (done) => {
      jobworker
        .scheduleJobs()
        .then(() => jobs.patch(1, { status: 'completed' }))
        .then(() =>
          setTimeout(() => {
            jobworker
              .get(2)
              .then((data) => {
                expect(data.status).toBe('idle')
              })
              .then(() => done(), done)
          }, 0)
        )
    })

    it('should reset to idle after job is failed', (done) => {
      jobworker
        .scheduleJobs()
        .then(() => jobs.patch(1, { status: 'failed' }))
        .then(() =>
          setTimeout(() => {
            jobworker
              .get(2)
              .then((data) => {
                expect(data.status).toBe('idle')
              })
              .then(() => done(), done)
          }, 0)
        )
    })
  })

  describe('when running jobs periodically', () => {
    let spy

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
  })
})
