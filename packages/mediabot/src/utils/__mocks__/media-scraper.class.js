/* eslint-disable no-unused-vars */
const fixtureAvengersInfinityWar = require('../../../../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).tmdbinfo')

class MediaScraperMock {
  constructor(options) {
    this.options = options || {}
  }

  setup(app) {
    this.app = app
  }

  findTmdbId(name, year) {
    throw Error('MediaScraperMock Error')
  }

  scrapeMovieByTmdbId(id) {
    if (id === '299536') {
      return fixtureAvengersInfinityWar
    } else {
      console.log(id)
      throw Error('MediaScraperMock Error')
    }
  }

  scrapeMovieByName(name, year) {
    if (
      (name === 'Avengers: Infinity War' || name === 'Avengers Infinity War') &&
      year === '2018'
    ) {
      return fixtureAvengersInfinityWar
    } else {
      console.log(name)
      console.log(year)
      throw Error('MediaScraperMock Error')
    }
  }

  buildXmlNfo(movie) {
    throw Error('MediaScraperMock Error')
  }

  async autoScrapeMovie(name, year, filename) {
    throw Error('MediaScraperMock Error')
  }

  async autoScrapeMovieByTmdbId(id, filename) {
    throw Error('MediaScraperMock Error')
  }

  downloadImage(uri, filename) {
    throw Error('MediaScraperMock Error')
  }
}

module.exports = function moduleExport(options) {
  return new MediaScraperMock(options)
}

module.exports.Service = MediaScraperMock
