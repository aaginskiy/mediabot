/* global describe it beforeEach afterEach expect */
const nock = require('nock')

const app = require('../../../src/api/app')
app.setup()
const WebhookService = app.service('webhook')

describe('\'Webhook\' service', () => {
  it('registers the service', () =>
    expect(WebhookService)
      .toBeTruthy())

  describe('#getFilenameFromRadarr', () => {
    beforeEach(done => {
      const movieResponse = {
        'path': '/fake/Movies/Fight Club (1999)',
        'folderName': '/fake/Movies/Fight Club (1999)',
        'movieFile': {
          'relativePath': 'Fight Club (1999).Bluray-1080p.mkv'
        },
        'id': 2
      }

      nock('http://radarr:7878')
        .get('/api/movie/2?apikey=9cc56c731a06623343d19ce2f7a3c982')
        .reply(200, movieResponse)

      app.set('radarr', {
        hostname: 'http://radarr:7878',
        apikey: '9cc56c731a06623343d19ce2f7a3c982'
      })

      done()
    })

    afterEach(done => {
      nock.cleanAll()
      done()
    })

    it('should return correct filename', () =>
      expect(WebhookService.getFilenameFromRadarr(2))
        .resolves.toBe('/fake/Movies/Fight Club (1999)/Fight Club (1999).Bluray-1080p.nfo'))
  })
})
