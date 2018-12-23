/* global describe it beforeEach */
const assert = require('assert')
const feathers = require('@feathersjs/feathers')
const updateMediaFile = require('../../../src/api/hooks/update-media-file')

describe.skip('\'updateMediaFile\' hook', () => {
  let app

  beforeEach(() => {
    app = feathers()

    app.use('/dummy', {
      async get (id) {
        return { id }
      }
    })

    app.service('dummy').hooks({
      before: updateMediaFile()
    })
  })

  test('runs the hook', async () => {
    const result = await app.service('dummy').get('test')

    assert.deepEqual(result, { id: 'test' })
  })
})
