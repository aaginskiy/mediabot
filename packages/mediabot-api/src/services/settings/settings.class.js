/* eslint-disable no-unused-vars */
const fs = require('fs')
const path = require('path')
const util = require('util')
const { get, set } = require('lodash')

class Service {
  constructor(options) {
    this.options = {}
  }

  setup(app) {
    this.app = app
    // const configFile = path.join(this.app.get('configLocation'), './config.json')
    // const readFile = util.promisify(fs.readFile)

    // return readFile(configFile)
    //   .then(data => {
    //     let settings = JSON.parse(data)
    //     Object.keys(settings).forEach(key => {
    //       this.app.set(key, settings[key])
    //       console.log(this.app.get(key))
    //     })

    //     logger.info('Loaded settings from configuration file.', {
    //       label: 'SettingsService'
    //     })
    //     return settings
    //   })
    //   .catch(err => {
    //     logger.error(`Unable to load settings from configuration file.`, {
    //       label: 'SettingsService'
    //     })
    //     logger.error(err.message, {
    //       label: 'SettingsService'
    //     })
    //     logger.debug(err.stack, {
    //       label: 'SettingsService'
    //     })
    //     throw err
    //   })
  }

  async find(params) {
    let settings = this.app.get('settings')
    if (settings) {
      return Promise.resolve(settings)
    } else {
      return this.create({}, params)
    }
  }

  async get(id, params) {
    let settings = this.app.get('settings')

    return get(settings, id)
  }

  async update(id, data, params) {
    const configFile = path.join(this.app.get('configLocation'), './config.json')
    const writeFile = util.promisify(fs.writeFile)

    return writeFile(configFile, JSON.stringify(data))
      .then(() => {
        logger.info('Saved settings to configuration file.', { label: 'SettingsService' })
        return this.create(data, params)
      })
      .catch((err) => {
        logger.error(`Unable to save settings to configuration file.`, {
          label: 'SettingsService',
        })
        logger.error(err.message, { label: 'SettingsService' })
        logger.debug(err.stack, { label: 'SettingsService' })
        throw err
      })
  }

  async patch(id, data, params) {
    const configFile = path.join(this.app.get('configLocation'), './config.json')
    const writeFile = util.promisify(fs.writeFile)
    let settings = this.app.get('settings')

    set(settings, id, get(data, id))

    console.log(settings)

    return this.update(id, settings, params)
  }
}

module.exports = function(options) {
  return new Service(options)
}

module.exports.Service = Service
