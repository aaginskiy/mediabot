const chai = require('chai');
const sinon = require('sinon');
const nock = require('nock');

chai.use(require('chai-things'));
chai.use(require('chai-like'));
chai.use(require('chai-string'));
chai.use(require('sinon-chai'));
chai.use(require('chai-as-promised'));

const { expect } = chai;
chai.should();

const fs = require('fs');

const app = require('../../src/app');
const WebhookService = app.service('webhook');
const ScrapeService = app.service('scrape');

describe('\'Webhook\' service', () => {
  it('registered the service', () => 
    expect(WebhookService, 'Registered the service')
      .to.be.ok);

  describe('#getFilenameFromRadarr', () =>{
    beforeEach(done => {
      const movieResponse = {
        "path": "/fake/Movies/Fight Club (1999)",
        "folderName": "/fake/Movies/Fight Club (1999)",
        "movieFile": {
          "relativePath": "Fight Club (1999).Bluray-1080p.mkv",
        },
        "id": 2
      };

      nock('http://radarr:7878')
        .get('/api/movie/2?apikey=9cc56c731a06623343d19ce2f7a3c982')
        .reply(200, movieResponse);

      app.set('radarr', {
        hostname: 'http://radarr:7878',
        apikey: '9cc56c731a06623343d19ce2f7a3c982'
      })

      done();
    });

    afterEach(done => {
      nock.cleanAll();
      done();
    });

    it('should return correct filename', () =>
      expect(WebhookService.getFilenameFromRadarr(2))
        .to.eventually.eq('/fake/Movies/Fight Club (1999)/Fight Club (1999).Bluray-1080p.nfo'));

  });
});
