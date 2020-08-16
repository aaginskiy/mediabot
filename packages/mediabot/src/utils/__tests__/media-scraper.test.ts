jest.mock('fs')
import { mocked } from 'ts-jest/utils'
import nock from 'nock'
import streamtest from 'streamtest'
import fs from 'fs'

// Load fixtures
import tmdbResponseAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).tmdbResponse'
import searchResponseAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).searchResponse'
import remoteMovieInfoAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).tmdbinfo'
import nfoAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).nfo'

import MediaScraper from '../media-scraper'

describe('media-scraper utility', () => {
  let scraper: MediaScraper

  beforeAll((done) => {
    scraper = new MediaScraper('fakeapikey')

    nock('https://api.themoviedb.org/3')
      .persist()
      .get('/search/movie')
      .query({ api_key: 'fakeapikey', language: 'en-US', query: 'Avengers Infinity War', year: 2018 })
      .reply(200, searchResponseAvengersInfinityWar)

    nock('https://api.themoviedb.org/3')
      .persist()
      .get('/search/movie')
      .reply(404)

    nock('https://api.themoviedb.org')
      .persist()
      .get('/3/movie/299536')
      .query({ api_key: 'fakeapikey', language: 'en-US' })
      .reply(200, tmdbResponseAvengersInfinityWar)

    nock('https://api.themoviedb.org')
      .persist()
      .get('/3/movie/0')
      .reply(404)

    nock('https://image.tmdb.org')
      .persist()
      .get('/t/p/original/7WsyChQLEftFiDOVTGkv3hFpyyt.jpg')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .reply(200, function(uri, _requestBody) {
        return streamtest['v2'].fromChunks(['a ', 'chunk', 'and', 'another'])
      })

    nock('https://image.tmdb.org')
      .persist()
      .get('/t/p/original/bOGkgRGdhrBYJSLpXaxhXVstddV.jpg')
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      .reply(200, function(uri, requestBody) {
        return streamtest['v2'].fromChunks(['a ', 'chunk', 'and', 'another'])
      })
    done()
  })
  it('register the service', () => expect(scraper).toBeTruthy())

  describe('findTmdbId', () => {
    it('should throw TypeError if name is not provided', () =>
      expect(scraper.findTmdbId('')).rejects.toThrow(TypeError))

    it('should throw Error if TMDB returns error', () => expect(scraper.findTmdbId('Bad Movie')).rejects.toThrow())

    it('should return ID of the first movie in results', () =>
      expect(scraper.findTmdbId('Avengers Infinity War', 2018)).resolves.toBe(299536))
  })

  describe('scrapeMovieByTmdbId', () => {
    it('should return RemoteMovieInfo object for the searched movie', () =>
      expect(scraper.scrapeMovieByTmdbId(299536)).resolves.toStrictEqual(remoteMovieInfoAvengersInfinityWar))

    it('should throw Error if TMDB returns error', () => expect(scraper.scrapeMovieByTmdbId(0)).rejects.toThrow())
  })

  describe('scrapeMovieByTmdbId', () => {
    it('should return RemoteMovieInfo object for the searched movie', () =>
      expect(scraper.scrapeMovieByName('Avengers Infinity War', 2018)).resolves.toStrictEqual(
        remoteMovieInfoAvengersInfinityWar
      ))

    it('should throw Error if TMDB returns error', () => expect(scraper.scrapeMovieByTmdbId(0)).rejects.toThrow())
  })

  describe('scrapeSaveMovieByTmdbId', () => {
    beforeEach((done) => {
      mocked(fs.writeFile).mockClear()
      mocked(fs.createWriteStream).mockClear()
      done()
    })
    it('should return RemoteMovieInfo object for the searched movie', () =>
      expect(
        scraper.scrapeSaveMovieByTmdbId(299536, '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv')
      ).resolves.toStrictEqual(remoteMovieInfoAvengersInfinityWar))

    describe('if "forced" parameter is false', () => {
      it('should save nfo if nfo is missing', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv'
        )
        return expect(mocked(fs.writeFile).mock.calls[0][1]).toStrictEqual(nfoAvengersInfinityWar)
      })

      it('should not save nfo if nfo exists', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv'
        )
        return expect(mocked(fs.writeFile)).not.toBeCalled()
      })

      it('should save poster if poster is missing', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv'
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-poster.jpg',
          expect.anything()
        )
      })

      it('should not save poster if poster exists', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv'
        )
        return expect(fs.createWriteStream).not.toBeCalled()
      })

      it('should save fanart if fanart is missing', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv'
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-fanart.jpg',
          expect.anything()
        )
      })

      it('should not save fanart if fanart exists', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv'
        )
        return expect(fs.createWriteStream).not.toBeCalled()
      })
    })

    describe('if "forced" parameter is true', () => {
      it('should save nfo if nfo exists', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
          true
        )
        return expect(mocked(fs.writeFile).mock.calls[0][1]).toStrictEqual(nfoAvengersInfinityWar)
      })

      it('should save poster if poster exists', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
          true
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-poster.jpg',
          expect.anything()
        )
      })

      it('should save fanart if fanart exists', async () => {
        await scraper.scrapeSaveMovieByTmdbId(
          299536,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
          true
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-fanart.jpg',
          expect.anything()
        )
      })
    })

    it('should throw Error if TMDB returns error', () =>
      expect(scraper.scrapeSaveMovieByTmdbId(0, 'random filename')).rejects.toThrow())
  })

  describe('scrapeSaveMovieByName', () => {
    beforeEach((done) => {
      mocked(fs.writeFile).mockClear()
      mocked(fs.createWriteStream).mockClear()
      done()
    })
    it('should return RemoteMovieInfo object for the searched movie', () =>
      expect(
        scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv'
        )
      ).resolves.toStrictEqual(remoteMovieInfoAvengersInfinityWar))

    describe('if "forced" parameter is false', () => {
      it('should save nfo if nfo is missing', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv'
        )
        return expect(mocked(fs.writeFile).mock.calls[0][1]).toStrictEqual(nfoAvengersInfinityWar)
      })

      it('should not save nfo if nfo exists', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv'
        )
        return expect(mocked(fs.writeFile)).not.toBeCalled()
      })

      it('should save poster if poster is missing', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv'
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-poster.jpg',
          expect.anything()
        )
      })

      it('should not save poster if poster exists', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv'
        )
        return expect(fs.createWriteStream).not.toBeCalled()
      })

      it('should save fanart if fanart is missing', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv'
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-fanart.jpg',
          expect.anything()
        )
      })

      it('should not save fanart if fanart exists', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv'
        )
        return expect(fs.createWriteStream).not.toBeCalled()
      })
    })

    describe('if "forced" parameter is true', () => {
      it('should save nfo if nfo exists', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
          true
        )
        return expect(mocked(fs.writeFile).mock.calls[0][1]).toStrictEqual(nfoAvengersInfinityWar)
      })

      it('should save poster if poster exists', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
          true
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-poster.jpg',
          expect.anything()
        )
      })

      it('should save fanart if fanart exists', async () => {
        await scraper.scrapeSaveMovieByName(
          'Avengers Infinity War',
          2018,
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
          true
        )
        return expect(fs.createWriteStream).toBeCalledWith(
          '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-fanart.jpg',
          expect.anything()
        )
      })
    })

    it('should throw Error if TMDB returns error', () =>
      expect(scraper.scrapeSaveMovieByName('Bad Movie', undefined, 'random filename')).rejects.toThrow())
  })
})
