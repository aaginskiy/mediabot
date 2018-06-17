/* global describe it before beforeEach afterEach */
const chai = require('chai')
const sinon = require('sinon')

chai.use(require('chai-things'))
chai.use(require('chai-like'))
chai.use(require('chai-string'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const { expect } = chai

const feathers = require('@feathersjs/feathers')
const JobWorkerService = require('../../../src/api/services/job-worker/job-worker.service')
const MemoryService = require('feathers-memory')

const app = feathers()
app.use('/job', MemoryService({ paginate: false }))
app.configure(JobWorkerService)
app.setup()

describe('\'Job Worker\' service', () => {
  before(() => {
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

  it('registered the service', () =>
    expect(app.service('job-worker')).to.be.ok)

  it('should do nothing if no idle workers available', () =>
    expect(app.service('job-worker').scheduleJobs()
      .then(() => app.service('job-worker').find()))
      .to.eventually.eql([
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
        .to.eventually.have.property('status', 'active')
    })

    it('should change jobId to active', async () => {
      await app.service('job-worker').scheduleJobs()

      return expect(app.service('job-worker').get(2))
        .to.eventually.have.property('jobId', 1)
    })

    it('should run job by jobId', async () => {
      await app.service('job-worker').scheduleJobs()

      return expect(app.service('job').get(1))
        .to.eventually.have.property('status', 'running')
    })

    it('should reset to idle after job is completed', (done) => {
      app.service('job-worker').scheduleJobs()
        .then(() => app.service('job').patch(1, { status: 'completed' }))
        .then(() => setTimeout(() => {
          app.service('job-worker').get(2)
            .then((data) => {
              expect(data.status).to.eq('idle')
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
              expect(data.status).to.eq('idle')
            })
            .then(() => done(), done)
        }, 0))
    })
  })

  describe('when running jobs periodically', () => {
    let clock
    let spy

    beforeEach((done) => {
      spy = sinon.spy(app.service('job-worker'), 'scheduleJobs')
      clock = sinon.useFakeTimers()
      done()
    })

    afterEach((done) => {
      spy.restore()
      clock.restore()
      done()
    })

    it('should periodically run scheduleJobs after start', () => {
      app.service('job-worker').startJobs()
      clock.tick(260)
      return expect(spy).to.be.calledTwice
    })

    it('should not run scheduleJobs after stop', () => {
      app.service('job-worker').startJobs()
      clock.tick(260)
      app.service('job-worker').stopJobs()
      clock.tick(260)
      return expect(spy).to.be.calledTwice
    })
  })
})
