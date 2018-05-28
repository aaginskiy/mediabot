/* global describe it */
const assert = require('assert')
const app = require('../../../src/api/app')

describe('\'Movies\' service', () => {
  it('registered the service', () => {
    const service = app.service('movies')

    assert.ok(service, 'Registered the service')
  })
})
