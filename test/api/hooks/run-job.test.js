/* global describe it beforeEach */
const chai = require('chai')
// const sinon = require('sinon')

chai.use(require('chai-things'))
chai.use(require('chai-like'))
chai.use(require('chai-string'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
// chai.use(require('dirty-chai'));

const { expect } = chai

const feathers = require('@feathersjs/feathers')
const runJob = require('../../../src/api/hooks/job/run-job')

describe('\'run-job\' hook', () => {
  let app

  beforeEach(() => {
    app = feathers()

    app.use('/dummy', {
      async patch (id, data, params) {
        return { id }
      },

      async get (id) {
        return { id }
      }
    })

    app.service('dummy').hooks({
      after: runJob()
    })
  })

  it('should thow an error if method is not patch', () =>
    expect(app.service('dummy').get('test', {}))
      .to.eventually.be.rejected)

  it('should not run if data.status is not \'running\'')

  it('should throw an error ')

  // it('should not run if query param \`status\` is not \'running\'', () =>
  //   expect(app.service('dummy').get('test', {}, { status: 'queued' }))
  //     .to.eventually)
})
