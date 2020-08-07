/* global describe it beforeAll afterAll afterEach expect jest */
const fs = require('fs')

const feathers = require('@feathersjs/feathers')
const settings = require('../settings.service.js')

describe.skip("'Settings' service", () => {
  it('registers the service', async () => expect(SettingsService).toBeTruthy())

  let app, SettingsService

  beforeAll((done) => {
    app = feathers()
    app.configure(settings)

    app.setup()

    app.set('settings', {})

    SettingsService = app.service('settings')

    const settingsJSON = JSON.stringify({
      movieDirectory: '/dev/test',
    })

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

  afterEach((done) => {
    fs.readFile.mockClear()
    fs.writeFile.mockClear()
    SettingsService.update.mockClear()
    done()
  })

  afterAll((done) => {
    fs.readFile.mockRestore()
    fs.writeFile.mockRestore()
    SettingsService.update.mockRestore()
    done()
  })

  describe('#find', () => {
    it('resolves with settings object if settings exist', () => {
      app.set('settings', { movieDirectory: '/dev/test/no/file' })
      return expect(SettingsService.find({})).resolves.toHaveProperty(
        'movieDirectory',
        '/dev/test/no/file'
      )
    })

    it('rejects with settings object if settings exist', () => {
      app.set('settings', undefined)
      app.set('configLocation', '/good')
      return expect(SettingsService.find({})).resolves.toHaveProperty('movieDirectory', '/dev/test')
    })
  })

  describe('#find', () => {
    it('resolves with specific setting if settings exist', () => {
      app.set('settings', { movieDirectory: '/dev/test/get/file' })
      return expect(SettingsService.get('movieDirectory')).resolves.toEqual('/dev/test/get/file')
    })
  })

  describe('#update', () => {
    it('resolves with settings object if successful', () => {
      app.set('configLocation', '/good')
      return SettingsService.update(1, {}).then(() =>
        expect(fs.writeFile).toBeCalledWith('/good/config.json', '{}', expect.any(Function))
      )
    })

    it('rejects if unsuccessful', () => {
      app.set('configLocation', '/bad')
      return expect(SettingsService.update(1, {})).rejects.toThrow('File stub error')
    })
  })

  describe('#patch', () => {
    it('calls update with updated settings object', () => {
      app.set('configLocation', '/good')
      return SettingsService.patch(
        'movieDirectory',
        { movieDirectory: '/new/directory' },
        {}
      ).then(() =>
        expect(SettingsService.update).toBeCalledWith(
          'movieDirectory',
          { movieDirectory: '/new/directory' },
          {}
        )
      )
    })
  })
})
