/* global describe it beforeEach expect */
const feathers = require('@feathersjs/feathers')
const { stashBefore } = require('feathers-hooks-common')
const { Conflict } = require('@feathersjs/errors')

const checkJobStatus = require('../../../src/api/hooks/jobs/check-job-status')

describe('\'check-job-status\' hook', () => {
  let app

  beforeEach(() => {
    app = feathers()

    app.use('/dummy', {
      async get (id) {
        let status

        if (id === 'badtest') {
          status = 'running'
        } else {
          status = 'queued'
        }

        return { id, status }
      },
      async patch (id, data) {
        return data
      }
    })

    app.service('dummy').hooks({
      before: {
        patch: [
          stashBefore(),
          checkJobStatus()
        ]
      }
    })
  })

  it('should throw Conflict error if job is already running', () =>
    expect(app.service('dummy').patch('badtest', {status: 'running'}))
      .rejects.toThrow(Conflict))

  it('should resolve successfully if job is not already running', () =>
    expect(app.service('dummy').patch('goodtest', {status: 'running'}))
      .resolves.toMatchObject({'status': 'running'}))
})
