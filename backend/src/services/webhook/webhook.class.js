/* eslint-disable no-unused-vars */
const path = require('path');
class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) {
    this.app = app;
    this.ScrapeService = app.service('scrape');
  }

  // async find (params) {
  //   return [];
  // }

  // async get (id, params) {
  //   return {
  //     id, text: `A new message with ID: ${id}!`
  //   };
  // }

  async create (data, params) {
    // Check for radarr webhook
    if (data.movie && data.movieFile && data.eventType === 'Download') {
      let filename = path.parse(data.movieFile.path);
      let name = data.remoteMovie.title;
      let year = data.remoteMovie.year;

      filename.ext = '.nfo';
      delete filename.base;

      filename = path.format(filename);

      return this.ScrapeService.autoScrapeMovie(name, year, filename);
    }
    return data;
  }

  // async update (id, data, params) {
  //   return data;
  // }

  // async patch (id, data, params) {
  //   return data;
  // }

  // async remove (id, params) {
  //   return { id };
  // }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
