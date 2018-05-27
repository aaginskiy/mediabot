/* eslint-disable no-unused-vars */
const path = require('path');
const request = require('request-promise');
class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) {
    this.app = app;
    this.ScrapeService = app.service('scrape');
  }

  async create (data, params) {
    this.app.info(`Received webhook request - ${data.eventType}.`, { label: "WebhookService" });

    // Check for radarr webhook
    if (data.movie && data.eventType === 'Download') {
      this.app.info(`Processing 'Download' webhook from Radarr.`, { label: "WebhookService" });
      let name = data.remoteMovie.title;
      let year = data.remoteMovie.year;
      return this.getFilenameFromRadarr(data.movie.id)
        .then(filename => this.ScrapeService.autoScrapeMovie(name, year, filename))
        .then(() => data)
        .catch((err) => {
          this.app.error(`Processing 'Download' webhook from Radarr failed.`, { label: "WebhookService" });
          this.app.error(err.message, { label: "WebhookService" });
          this.app.debug(err.stack, { label: "WebhookService" });
          throw err;
        });
    }

    return Promise.resolve(data);
  }

  getFilenameFromRadarr(id) {
    this.app.info(`Loading filename from Radarr by id: ${id}.`, { label: "WebhookService" });
    let { hostname, apikey } = this.app.get('radarr');
    let uri = `${hostname}/api/movie/${id}?apikey=${apikey}`
    this.app.debug(`Connecting to Radarr by uri: ${uri}`, { label: "WebhookService" });
    return request(uri)
      .then((res) => {
        let json;

        try {
          json = JSON.parse(res);
        } catch (e) {
          throw e;
        }

        let { dir, name } = path.parse(`${json.path}/${json.movieFile.relativePath}`);

        return `${dir}/${name}.nfo`
      })
      .catch(err => {
        this.app.error(err.message, { label: "WebhookService" });
        this.app.debug(err.stack, { label: "WebhookService" });
        throw err;
      });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
