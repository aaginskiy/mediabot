/* global describe it beforeEach afterEach jest expect */
const path = require('path')

const feathers = require('@feathersjs/feathers')
const logger = require('feathers-logger')
const runJob = require('../../../src/api/hooks/job/run-job')
const MediaScraperClass = require('../../../src/util/media-scraper').MediaScraper

const logHelper = require('../../logHelper')
const logfile = path.join(__dirname, '../../logs/run-job.mocha.log')
const wlog = logHelper.createLogger(logfile)

describe('\'run-job\' hook', () => {
  let app
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

    jest.spyOn(app.service('dummy'), 'get').mockImplementation((id, data) => {
      if (id === 'failedArg') {
        return Promise.reject(new Error('testreject'))
      } else {
        return Promise.resolve('')
      }
    })

    jest.spyOn(MediaScraperClass.prototype, 'autoScrapeMovie').mockResolvedValue('')

    jest.spyOn(app.service('job'), 'patch')
  })

  afterEach(() => {
    app.service('dummy').get.mockRestore()
    app.service('job').patch.mockRestore()
    MediaScraperClass.prototype.autoScrapeMovie.mockRestore()
  })

  it('should thow an error if method is not patch', () =>
    expect(app.service('job').get('test', {}))
      .rejects.toThrow(''))

  it('should set status to failed if is not successful', () =>
    app.service('job').patch(
      'failedJob',
      { status: 'running' }
    ).then(() => expect(app.service('job').patch)
      .toBeCalledWith('failedJob', { args: ['failedArg'], function: 'get', service: 'dummy', progress: 0, status: 'failed', error: 'Error: testreject' })))

  it('should set status to completed if run is successful', () =>
    app.service('job').patch(
      'completedJob',
      { status: 'running' }
    ).then(() => expect(app.service('job').patch)
      .toBeCalledWith('completedJob', { args: ['completedArg'], function: 'get', service: 'dummy', progress: 100, status: 'completed' })))

  it(
    'should call MediaScraper utility if data.service is \'media-scraper\'',
    async () => {
      await app.service('job').patch(
        'MediaScraper',
        { status: 'running' }
      )
      return expect(MediaScraperClass.prototype.autoScrapeMovie).toBeCalledTimes(1)
    }
  )
})
