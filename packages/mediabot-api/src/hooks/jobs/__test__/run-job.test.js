/* global describe it beforeEach afterEach jest expect */
const feathers = require('@feathersjs/feathers')
const logger = require('feathers-logger')
const runJob = require('../run-job')
const MediaScraper = require('../../../services/utils/media-scraper/media-scraper.service')

describe("'run-job' hook", () => {
  let app

  beforeEach(() => {
    app = feathers()
    app.configure(logger())
    app.configure(MediaScraper)

    app.use('/dummy', {
      async get(id) {
        return Promise.resolve(id)
      },
    })

    app.use('/jobs', {
      async patch(id, data, params) {
        if (id === 'completedJob') {
          data.args = ['completedArg']
          data.service = 'dummy'
          data.function = 'get'
        } else if (id === 'MediaScraper') {
          data.args = ['completedArg']
          data.service = 'utils/media-scraper'
          data.function = 'autoScrapeMovie'
        } else {
          data.args = ['failedArg']
          data.service = 'dummy'
          data.function = 'get'
        }
        return data
      },

      async get(id) {
        return { id }
      },
    })

    app.service('jobs').hooks({
      after: [
        (context) => {
          if (context.data.status === 'running') context.params.runJob = true
          return context
        },
        runJob(),
      ],
    })

    jest.spyOn(app.service('dummy'), 'get').mockImplementation((id, data) => {
      if (id === 'failedArg') {
        return Promise.reject(new Error('testreject'))
      } else {
        return Promise.resolve('')
      }
    })

    jest.spyOn(app.service('utils/media-scraper'), 'autoScrapeMovie').mockResolvedValue('')

    jest.spyOn(app.service('jobs'), 'patch')
  })

  afterEach(() => {
    app.service('dummy').get.mockRestore()
    app.service('utils/media-scraper').autoScrapeMovie.mockRestore()
  })

  it('should thow an error if method is not patch', () =>
    expect(app.service('jobs').get('test', {})).rejects.toThrow(''))

  it('should set status to failed if is not successful', () =>
    app
      .service('jobs')
      .patch('failedJob', { status: 'running' })
      .then(() =>
        expect(app.service('jobs').patch).toBeCalledWith('failedJob', {
          args: ['failedArg'],
          function: 'get',
          service: 'dummy',
          progress: 0,
          status: 'failed',
          error: 'Error: testreject',
        })
      ))

  it('should set status to completed if run is successful', () =>
    app
      .service('jobs')
      .patch('completedJob', { status: 'running' })
      .then(() =>
        expect(app.service('jobs').patch).toBeCalledWith('completedJob', {
          args: ['completedArg'],
          function: 'get',
          service: 'dummy',
          progress: 100,
          status: 'completed',
        })
      ))

  it("should call MediaScraper utility if data.service is 'utils/media-scraper'", async () => {
    await app.service('jobs').patch('MediaScraper', { status: 'running' })
    return expect(app.service('utils/media-scraper').autoScrapeMovie).toBeCalledTimes(1)
  })
})
