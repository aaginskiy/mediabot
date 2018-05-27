/* eslint-disable no-unused-vars */
const fs = require('fs');
const path = require('path');
const util = require('util');
const { get, set } = require('lodash');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) {
    this.app = app;
  }

  async find (params) {
    let settings = this.app.get('settings');
    if (settings) {
      return Promise.resolve(settings);
    } else {
      return this.create({}, params);
    }
  }

  async get (id, params) {
    let settings = this.app.get('settings');

    return get(settings, id);
  }

  async create (data, params) {
    const configFile = path.join(this.app.get('configLocation'), './config.json');
    const readFile = util.promisify(fs.readFile);

    return readFile(configFile)
      .then(data => {
        let settings = JSON.parse(data);
        this.app.set('settings', settings);
        this.app.info('Load settings from configuration file.', { label: "SettingsService" });
        return settings;
      })
      .catch(err => {
        this.app.error(`Unable to load settings from configuration file.`, { label: "SettingsService" });
        this.app.error(err.message, { label: "SettingsService" });
        this.app.debug(err.stack, { label: "SettingsService" });
        throw err;
      });
  }

  async update (id, data, params) {
    const configFile = path.join(this.app.get('configLocation'), './config.json');
    const writeFile = util.promisify(fs.writeFile);

    return writeFile(configFile, JSON.stringify(data))
      .then(() => {
        this.app.info('Saved settings to configuration file.', { label: "SettingsService" });
        return this.create(data, params);
      })
      .catch(err => {
        this.app.error(`Unable to save settings to configuration file.`, { label: "SettingsService" });
        this.app.error(err.message, { label: "SettingsService" });
        this.app.debug(err.stack, { label: "SettingsService" });
        throw err;
      });
  }

  async patch (id, data, params) {
    const configFile = path.join(this.app.get('configLocation'), './config.json');
    const writeFile = util.promisify(fs.writeFile);
    let settings = this.app.get('settings');

    set(settings, id, get(data, id));

    return this.update(id, settings, params);
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
