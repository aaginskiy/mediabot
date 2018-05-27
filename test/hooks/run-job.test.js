/* global describe it beforeEach */

const assert = require('assert')
const feathers = require('@feathersjs/feathers')
const runJob = require('../../src/hooks/run-job')

describe.skip('\'runJob\' hook', () => {
  let app

  beforeEach(() => {
    app = feathers()

    app.use('/dummy', {
      async get (id) {
        return { id }
      }
    })

    app.service('dummy').hooks({
      before: runJob()
    })
  })

  it('runs the hook', async () => {
    const result = await app.service('dummy').get('test')

    assert.deepEqual(result, { id: 'test' })
  })
})
