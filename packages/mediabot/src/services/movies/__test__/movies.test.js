/* global describe it expect */
const path = require('path')
const feathers = require('@feathersjs/feathers')
const createService = require('../movies.service')

const app = feathers()
app.set('dataLocation', path.join(__dirname, '../../test/data/'))
app.configure(createService)

describe("'Movies' service", () => {
  it('registered the service', () => {
    expect(app.service('movies')).toBeTruthy()
  })
})
