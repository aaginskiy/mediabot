/* global describe it afterEach beforeEach beforeAll afterAll expect jest */
const memory = require('feathers-memory')
const DiskScannerService = require('../disk-scanner.service')

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const glob = require('glob-promise')
const _ = require('lodash')
const path = require('path')
const feathers = require('@feathersjs/feathers')
const createService = require('../movies.service')

const app = feathers()
app.set('dataLocation', path.join(__dirname, '../../../../config/data/test/'))
app.configure(createService)

const { Readable } = require('stream')

const nfoJson = require('../__fixtures__/2001 A Space Odyssey (1968).js')

const fixture = {}

describe("'Movies' service", () => {
  it('registered the service', () => {
    expect(app.service('movies')).toBeTruthy()
  })
})
