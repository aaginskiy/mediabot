/* global describe it */
const assert = require('assert')
const app = require('../../../src/api/app')

describe('\'job\' service', () => {
  it('registered the service', () => {
    const service = app.service('job')

    assert.ok(service, 'Registered the service')
  })
})
