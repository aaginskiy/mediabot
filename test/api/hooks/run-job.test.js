/* global describe it beforeEach afterEach */
const chai = require('chai')
const sinon = require('sinon')

chai.use(require('chai-things'))
chai.use(require('chai-like'))
chai.use(require('chai-string'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
// chai.use(require('dirty-chai'));

const { expect } = chai

const feathers = require('@feathersjs/feathers')
const logger = require('feathers-logger')
const runJob = require('../../../src/api/hooks/job/run-job')
const MediaScraperClass = require('../../../src/util/media-scraper').MediaScraper

describe('\'run-job\' hook', () => {
  let app
  let stub, utilstub
  let spy

  beforeEach(() => {
    app = feathers()
    app.configure(logger())

    app.use('/dummy', {
      async get (id) {
        return Promise.resolve(id)
      }
    })

    app.use('/job', {
      async patch (id, data, params) {
        if (id === 'completedJob') {
          data.args = ['completedArg']
          data.service = 'dummy'
          data.function = 'get'
        } else if (id === 'MediaScraper') {
          data.args = ['completedArg']
          data.service = 'media-scraper'
          data.function = 'autoScrapeMovie'
        } else {
          data.args = ['failedArg']
          data.service = 'dummy'
          data.function = 'get'
        }
        return data
      },

      async get (id) {
        return { id }
      }
    })

    app.service('job').hooks({
      after: [
        (context) => {
          if (context.data.status === 'running') context.params.runJob = true
          return context
        },
        runJob()
      ]
    })

    stub = sinon.stub(app.service('dummy'), 'get').resolves()
    stub.withArgs('failedArg').rejects('testreject')

    utilstub = sinon.stub(MediaScraperClass.prototype, 'autoScrapeMovie').resolves()

    spy = sinon.spy(app.service('job'), 'patch')
  })

  afterEach(() => {
    stub.restore()
    spy.restore()
    utilstub.restore()
  })

  it('should thow an error if method is not patch', () =>
    expect(app.service('job').get('test', {}))
      .to.eventually.be.rejected)

  it('should set status to failed if is not successful', () =>
    app.service('job').patch(
      'failedJob',
      { status: 'running' }
    ).then(() => expect(spy)
      .to.have.calledWith('failedJob', { args: ['failedArg'], function: 'get', service: 'dummy', progress: 0, status: 'failed', error: 'testreject' })))

  it('should set status to completed if run is successful', () =>
    app.service('job').patch(
      'completedJob',
      { status: 'running' }
    ).then(() => expect(spy)
      .to.have.been.calledWith('completedJob', { args: ['completedArg'], function: 'get', service: 'dummy', progress: 100, status: 'completed' })))

  it('should call MediaScraper utility if data.service is \'media-scraper\'', async () => {
    await app.service('job').patch(
      'MediaScraper',
      { status: 'running' }
    )
    return expect(utilstub).to.have.been.calledOnce
  })
})
