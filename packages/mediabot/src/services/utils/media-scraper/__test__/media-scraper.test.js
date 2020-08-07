/* global describe it beforeEach afterEach expect jest */
const nock = require('nock')
const stream = require('stream')
const fs = require('fs')
const feathers = require('@feathersjs/feathers')
const MediaScraperService = require('../media-scraper.service')

// Load fixtures
const tmdbResponseAvengersInfinityWar = require('../__fixtures/Avengers Infinity War (2018).tmdbResponse')
const searchResponseAvengersInfinityWar = require('../__fixtures/Avengers Infinity War (2018).searchResponse')
let MediaScraper

describe("'MediaScraper' service", () => {
  beforeAll(() => {
    app = feathers()
    app.set('tmdbApiKey', 'fakeapikey')
    app.configure(MediaScraperService)
    app.setup()

    MediaScraper = app.service('utils/media-scraper')

    nock('https://api.themoviedb.org/3')
      .get('/search/movie')
      .query({ api_key: 'fakeapikey', query: 'Avengers Infinity War', year: '2018' })
      .reply(200, searchResponseAvengersInfinityWar)

    nock('https://api.themoviedb.org/3')
      .get('/search/movie')
      .reply(404)
  })

  it('register the service', () => expect(app.service('utils/media-scraper')).toBeTruthy())

  describe('findTmdbId', () => {
    it('should throw TypeError if name is not provided', () => expect(MediaScraper.findTmdbId()).rejects.toThrow('TypeError'));

    it('should throw Error if TMDB returns error', () => expect(MediaScraper.findTmdbId('Bad Movie')).rejects.toThrow())

    it('should return ID of the first movie in results', () => expect(MediaScraper.findTmdbId('Avengers Infinity War', 2018)).resolves.toBe(299536))
  });

  describe.skip('#downloadImage', () => {
    let streamthrough

    beforeEach((done) => {
      this.readableStream = new stream.PassThrough()
      nock('https://api.themoviedb.org/3')
        .get('/movie/550')
        .reply(200, function (uri, requestBody) {
          return this.readableStream
        })

      nock('https://api.themoviedb.org/3')
        .get('/search/movie')
        .reply(404)

      streamthrough = new stream.PassThrough()

      jest.spyOn(fs, 'createWriteStream').mockImplementation((path) => {
        if (path === '/good/filename.nfo') {
          return streamthrough
        } else {
          throw new Error('fs.createWriteStream File note found Stubbed Error.')
        }
      })

      done()
    })

    afterEach((done) => {
      fs.createWriteStream.mockRestore()
      nock.cleanAll()
      done()
    })

    it('should resolve if writing file is successful', () => {
      setTimeout(() => streamthrough.emit('close'), 10)
      return expect(
        MediaScraper.downloadImage('https://api.themoviedb.org/3/movie/550', '/good/filename.nfo')
      ).resolves.toBe(undefined)
    })

    it('should reject if image stream has error', () => {
      return expect(
        MediaScraper.downloadImage(
          'https://api.themoviedb.org/3/search/movie',
          '/good/filename.nfo'
        )
      ).rejects.toThrow('')
    })

    it('should reject if file write stream has error', () => {
      setTimeout(() => streamthrough.emit('error', new Error()), 10)
      return expect(
        MediaScraper.downloadImage('https://api.themoviedb.org/3/movie/550', '/good/filename.nfo')
      ).rejects.toThrow('')
    })
  })

  describe.skip('when using TMDB MediaScraper by id', () => {
    beforeEach((done) => {
      jest.spyOn(fs, 'writeFile').mockImplementation((file, data, callback) => {
        if (file === '/good/filename.nfo') {
          callback(null, 'success')
        } else {
          callback(new Error('fs.writeFile File note found Stubbed Error.'))
        }
      })

      done()
    })

    afterEach((done) => {
      fs.writeFile.mockRestore()

      done()
    })

    beforeEach((done) => {
      nock('https://api.themoviedb.org')
        .get('/3/movie/299536')
        .query({ api_key: 'fakeapikey' })
        .reply(200, tmdbResponseAvengersInfinityWar)

      nock('https://api.themoviedb.org')
        .get('/3/movie/12')
        .query({ api_key: '9cc56c731a06623343d19ce2f7a3c982' })
        .reply(404)

      nock('https://api.themoviedb.org/3')
        .get('/search/movie')
        .query({ api_key: '9cc56c731a06623343d19ce2f7a3c982', query: 'Fight Club', year: '1999' })
        .reply(200, searchResponse)

      nock('https://api.themoviedb.org/3')
        .get('/search/movie')
        .query({ api_key: '9cc56c731a06623343d19ce2f7a3c982', query: 'Fight Club', year: '2005' })
        .reply(404)

      jest.spyOn(MediaScraper, 'downloadImage')

      done()
    })

    afterEach((done) => {
      MediaScraper.downloadImage.mockClear()
      nock.cleanAll()
      done()
    })

    it('should auto search for movie', () =>
      expect(MediaScraper.autoSearchMovie('Fight Club', 1999)).resolves.toBe(550))

    it('should return an error if auto search fails', () =>
      expect(MediaScraper.autoSearchMovie('Fight Club', 2005)).rejects.toThrow(''))

    it('should set id to imdb_id', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('id', 'tt0137523'))

    it('should set tmdb_id to id', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('tmdbid', 550))

    it('should set title', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('title', 'Fight Club'))

    it('should set original title', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty(
        'originaltitle',
        'Fight Club'
      ))

    it('should set tagline', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty(
        'tagline',
        'Mischief. Mayhem. Soap.'
      ))

    it('should set plot', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty(
        'plot',
        'A ticking-time-bomb insomniac and a slippery soap salesman channel primal male aggression into a shocking new form of therapy. Their concept catches on, with underground "fight clubs" forming in every town, until an eccentric gets in the way and ignites an out-of-control spiral toward oblivion.'
      ))

    it.skip('should set rating', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('rating', 8.3))

    it('should set runtime', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('runtime', 139))

    it('should set year', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('year', '1999-10-15'))

    it.skip('should set certification', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('certification', 550))

    it.skip('should set cast', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('cast', 550))

    it('should set genres', async () => {
      let ret = await MediaScraper.scrapeTmdbMovie(550)
      expect(ret).toHaveProperty('genre', expect.toBeArray())
      expect(ret.genre).toBeArrayOfSize(1)
      expect(ret.genre).toEqual(expect.arrayContaining(['Drama']))
    })

    it('should set studios', async () => {
      let ret = await MediaScraper.scrapeTmdbMovie(550)
      console.log(ret)
      expect(ret).toHaveProperty('studio')
      expect(ret.studio).toBeArrayOfSize(7)
      expect(ret.studio).toEqual(
        expect.arrayContaining(['Regency Enterprises', 'Fox 2000 Pictures'])
      )
    })

    it.skip('should set artwork', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('artwork', 550))

    it('should set poster', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty(
        'poster',
        '/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg'
      ))

    it('should set fanart', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty(
        'fanart',
        '/mMZRKb3NVo5ZeSPEIaNW9buLWQ0.jpg'
      ))

    it.skip('should set trailer', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('trailer', 550))

    it.skip('should set movieset', () =>
      expect(MediaScraper.scrapeTmdbMovie(550)).resolves.toHaveProperty('movieset', 550))

    it('should return an error if scrape fails', () =>
      expect(MediaScraper.scrapeTmdbMovie(12)).rejects.toThrow(''))

    it('should build Kodi NFO', () =>
      expect(MediaScraper.buildXmlNfo(this.movieFixture)).toBe(this.xmlMovieFixture))

    it('should download poster when autoscraping', async () => {
      await MediaScraper.autoScrapeMovie('Fight Club', 1999, '/good/filename.nfo')
      return expect(MediaScraper.downloadImage).toBeCalledWith(
        'https://image.tmdb.org/t/p/original/adw6Lq9FiC9zjYEpOqfq03ituwp.jpg',
        '/good/filename-poster.jpg'
      )
    })

    it('should download poster when autoscraping', async () => {
      await MediaScraper.autoScrapeMovie('Fight Club', 1999, '/good/filename.nfo')
      return expect(MediaScraper.downloadImage).toBeCalledWith(
        'https://image.tmdb.org/t/p/original/mMZRKb3NVo5ZeSPEIaNW9buLWQ0.jpg',
        '/good/filename-fanart.jpg'
      )
    })

    it('should reject autoscrape if steps fail', () =>
      expect(MediaScraper.autoScrapeMovie('Fight Club', 1999, '/bad/filename.nfo')).rejects.toThrow(
        'fs.writeFile File note found Stubbed Error.'
      ))

    it('should autoscrape if steps succeed', () =>
      expect(MediaScraper.autoScrapeMovie('Fight Club', 1999, '/good/filename.nfo')).resolves.toBe(
        'success'
      ))
  })
})
