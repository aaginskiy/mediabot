/* global describe it beforeAll afterAll afterEach expect jest */
const fs = require('fs')
const path = require('path')

const feathers = require('@feathersjs/feathers')
const logger = require('feathers-logger')
const settings = require('../../../src/api/services/settings/settings.service.js')

const logHelper = require('../../logHelper')
const logfile = path.join(__dirname, '../../logs/settings.mocha.log')
const wlog = logHelper.createLogger(logfile)

describe('\'Settings\' service', () => {
  it('registers the service', async () =>
    expect(SettingsService)
      .toBeTruthy())

  let app, SettingsService

  beforeAll(done => {
    app = feathers()
    app.configure(settings)
    app.configure(logger())
    app.log = console.log
    app.info = console.log
    app.warn = console.log
    app.error = console.log
    app.debug = console.log

    app.setup()

    SettingsService = app.service('settings')

    const settingsJSON = JSON.stringify({
      movieDirectory: '/dev/test'
    })
    // jest.mock('fs')

    jest.spyOn(fs, 'readFile').mockImplementation((path, callback) => {
      if (path === '/good/config.json') {
        callback(null, settingsJSON)
      } else if (path === '/bad/config.json') {
        callback(new Error('File stub error.'))
      }
    })

    jest.spyOn(fs, 'writeFile').mockImplementation((path, data, callback) => {
      if (path === '/bad/config.json') {
        callback(new Error('File stub error.'))
      } else {
        callback(null, '')
      }
    })

    jest.spyOn(SettingsService, 'update')

    done()
  })

  afterEach(done => {
    fs.readFile.mockClear()
    fs.writeFile.mockClear()
    SettingsService.update.mockClear()
    done()
  })

  afterAll(done => {
    fs.readFile.mockRestore()
    fs.writeFile.mockRestore()
    SettingsService.update.mockRestore()
    done()
  })

  describe('#create', () => {
    it('resolves with settings object if successful', () => {
      app.set('configLocation', '/good')
      return expect(SettingsService.create({}, {}))
        .resolves.toHaveProperty('movieDirectory', '/dev/test')
    })

    it('rejects if unsuccessful', () => {
      app.set('configLocation', '/bad')
      return expect(SettingsService.create({}, {})).rejects.toThrow('File stub error')
    })
  })

  describe('#find', () => {
    it('resolves with settings object if settings exist', () => {
      app.set('settings', { movieDirectory: '/dev/test/no/file' })
      return expect(SettingsService.find({}))
        .resolves.toHaveProperty('movieDirectory', '/dev/test/no/file')
    })

    it('rejects with settings object if settings exist', () => {
      app.set('settings', undefined)
      app.set('configLocation', '/good')
      return expect(SettingsService.find({}))
        .resolves.toHaveProperty('movieDirectory', '/dev/test')
    })
  })

  describe('#find', () => {
    it('resolves with specific setting if settings exist', () => {
      app.set('settings', { movieDirectory: '/dev/test/get/file' })
      return expect(SettingsService.get('movieDirectory'))
        .resolves.toEqual('/dev/test/get/file')
    })
  })

  describe('#update', () => {
    it('resolves with settings object if successful', () => {
      app.set('configLocation', '/good')
      return SettingsService.update(1, {}).then(() => expect(fs.writeFile)
        .toBeCalledWith('/good/config.json', '{}', expect.any(Function)))
    })

    it('rejects if unsuccessful', () => {
      app.set('configLocation', '/bad')
      return expect(SettingsService.update(1, {})).rejects.toThrow('File stub error')
    })
  })

  describe('#patch', () => {
    it('calls update with updated settings object', () => {
      app.set('configLocation', '/good')
      return SettingsService.patch('movieDirectory', { movieDirectory: '/new/directory' }, {}).then(() =>
        expect(SettingsService.update)
          .toBeCalledWith('movieDirectory', { movieDirectory: '/new/directory' }, {}))
    })
  })
})
