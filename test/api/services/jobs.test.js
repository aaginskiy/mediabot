/* global describe it */
const assert = require('assert')
const app = require('../../../src/api/app')

describe('\'Jobs\' service', () => {
  it('registered the service', () => {
    const service = app.service('jobs')

    assert.ok(service, 'Registered the service')
  })
})
