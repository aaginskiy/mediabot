/* global describe it beforeAll beforeEach afterEach expect jest */
const feathers = require('@feathersjs/feathers')
const JobWorkerService = require('../../../src/api/services/job-worker/job-worker.service')
const MemoryService = require('feathers-memory')

const app = feathers()
app.use('/job', MemoryService({ paginate: false }))
app.configure(JobWorkerService)
app.setup()

const jobworker = app.service('job-worker')

describe('\'Job Worker\' service', () => {
  beforeAll(() => {
    return Promise.all([
      app.service('job-worker').create([
        { status: 'active' },
        { status: 'active' },
        { status: 'active' },
        { status: 'active' }
      ]),
      app.service('job').create([
        { status: 'running' },
        { status: 'queued' }
      ])
    ])
  })

  it('register the service', () =>
    expect(app.service('job-worker')).toBeTruthy())

  it('should do nothing if no idle workers available', () =>
    expect(app.service('job-worker').scheduleJobs()
      .then(() => app.service('job-worker').find()))
      .resolves.toMatchObject([
        {
          'id': 0,
          'status': 'active'
        },
        {
          'id': 1,
          'status': 'active'
        },
        {
          'id': 2,
          'status': 'active'
        },
        {
          'id': 3,
          'status': 'active'
        }
      ]))

  describe('worker is available', () => {
    beforeEach(() => Promise.all([
      app.service('job-worker').patch(2, { status: 'idle', jobId: undefined }),
      app.service('job').patch(1, { status: 'queued' })
    ]))

    it('should change status to active', async () => {
      await app.service('job-worker').scheduleJobs()

      return expect(app.service('job-worker').get(2))
        .resolves.toHaveProperty('status', 'active')
    })

    it('should change jobId to active', async () => {
      await app.service('job-worker').scheduleJobs()

      return expect(app.service('job-worker').get(2))
        .resolves.toHaveProperty('jobId', 1)
    })

    it('should run job by jobId', async () => {
      await app.service('job-worker').scheduleJobs()

      return expect(app.service('job').get(1))
        .resolves.toHaveProperty('status', 'running')
    })

    it('should reset to idle after job is completed', (done) => {
      app.service('job-worker').scheduleJobs()
        .then(() => app.service('job').patch(1, { status: 'completed' }))
        .then(() => setTimeout(() => {
          app.service('job-worker').get(2)
            .then((data) => {
              expect(data.status).toBe('idle')
            })
            .then(() => done(), done)
        }, 0))
    })

    it('should reset to idle after job is failed', (done) => {
      app.service('job-worker').scheduleJobs()
        .then(() => app.service('job').patch(1, { status: 'failed' }))
        .then(() => setTimeout(() => {
          app.service('job-worker').get(2)
            .then((data) => {
              expect(data.status).toBe('idle')
            })
            .then(() => done(), done)
        }, 0))
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
      app.service('job-worker').startJobs()
      jest.advanceTimersByTime(260)
      app.service('job-worker').stopJobs()
      jest.advanceTimersByTime(260)
      return expect(spy).toBeCalledTimes(2)
    })
  })
})
