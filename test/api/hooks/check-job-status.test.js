/* global describe it beforeEach */
const chai = require('chai')

chai.use(require('chai-things'))
chai.use(require('chai-like'))
chai.use(require('chai-string'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const { expect } = chai

const feathers = require('@feathersjs/feathers')
const { stashBefore } = require('feathers-hooks-common')
const { Conflict } = require('@feathersjs/errors')

const checkJobStatus = require('../../../src/api/hooks/job/check-job-status')

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
      .to.eventually.be.rejectedWith(Conflict))

  it('should resolve successfully if job is not already running', () =>
    expect(app.service('dummy').patch('goodtest', {status: 'running'}))
      .to.eventually.be.fulfilled)
})
