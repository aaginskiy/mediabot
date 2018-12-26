/* global describe it */
const assert = require('assert')
const feathers = require('@feathersjs/feathers')
const createService = require('../../../src/api/services/image/image.service')
let app = feathers()
app.configure(createService)
app.setup()

describe('\'image\' service', () => {
  it('registered the service', () => {
    const service = app.service('image')

    assert.ok(service, 'Registered the service')
  })
})
