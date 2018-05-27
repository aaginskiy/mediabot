/* global describe it */
const assert = require('assert')
const app = require('../../src/app')

describe('\'JobScheduler\' service', () => {
  it('registered the service', () => {
    const service = app.service('job-scheduler')

    assert.ok(service, 'Registered the service')
  })
})
