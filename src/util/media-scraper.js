/* eslint-disable no-unused-vars */
const Promise = require('bluebird')
const request = require('request')
const util = require('util')
const path = require('path')
const fs = require('fs')
const TmdbScraper = require('@mediabot/tmdb')
const tmdb = new TmdbScraper('9cc56c731a06623343d19ce2f7a3c982')
const xml2js = require('xml2js')
class MediaScraper {
  constructor (options = {}, logger) {
    this.options = options
    this.logger = logger || {
      info: () => null,
      debug: () => null,
      error: () => null
    }
  }

  autoSearchMovie (name, year) {
    // this.logger.info(`Searching TMDB for movie ${name} (${year}).`, { label: 'ScrapeService' })
    return tmdb.search.movie({query: name, year: year})
      .then(res => res.results[0].id)
      .catch(err => {
        this.logger.error(err.message, { label: 'ScrapeService' })
        this.logger.debug(err.stack, { label: 'ScrapeService' })
        throw err
      })
  };

  scrapeTmdbMovie (id) {
    this.logger.info(`Loading information for movie (TMDB ID: ${id}) from TMDB.`, { label: 'ScrapeService' })
    return tmdb.movie({id})
      .then(res => {
        const movie = {}

        movie.id = res.imdb_id
        movie.tmdbid = res.id
        movie.title = res.title
        movie.originaltitle = res.original_title
        movie.tagline = res.tagline
        movie.plot = res.overview
        movie.outline = res.overview
        movie.runtime = res.runtime
        movie.year = res.release_date
        movie.rating = res.vote_average
        movie.genre = res.genres.map(genre => genre.name)
        movie.studio = res.production_companies.map(studio => studio.name)
        movie.fanart = res.backdrop_path
        movie.poster = res.poster_path

        return movie
      })
      .catch(err => {
        this.logger.error(err.message, { label: 'ScrapeService' })
        this.logger.debug(err.stack, { label: 'ScrapeService' })
        throw err
      })
  }

  buildXmlNfo (movie) {
    var builder = new xml2js.Builder({rootName: 'movie'})
    return builder.buildObject(movie)
  }

  autoScrapeMovie (name, year, filename) {
    this.logger.debug(`Auto scraping movie with name: ${name}, year: ${year}, filename: ${filename}.`, { label: 'ScrapeService' })
    const writeFile = util.promisify(fs.writeFile)

    return this.autoSearchMovie(name, year)
      .then(id => this.scrapeTmdbMovie(id))
      .then(movie => {
        let { dir, name } = path.parse(filename)
        this.downloadImage(`https://image.tmdb.org/t/p/original${movie.fanart}`, `${dir}/${name}-fanart.jpg`)
        this.downloadImage(`https://image.tmdb.org/t/p/original${movie.poster}`, `${dir}/${name}-poster.jpg`)
        return writeFile(filename, this.buildXmlNfo(movie))
      })
      .catch(err => {
        this.logger.error(err.message, { label: 'ScrapeService' })
        this.logger.debug(err.stack, { label: 'ScrapeService' })
        throw err
      })
  }

  downloadImage (uri, filename) {
    return request
      .get(uri)
      .on('error', err => {
        console.log(err)
        this.logger.error(err.message, { label: 'ScrapeService' })
        this.logger.debug(err.stack, { label: 'ScrapeService' })
      })
      .pipe(fs.createWriteStream(filename)
        .on('error', err => {
          this.logger.error(err.message, { label: 'ScrapeService' })
          this.logger.debug(err.stack, { label: 'ScrapeService' })
        }))
  };
}

module.exports = function (options) {
  return new MediaScraper(options)
}

module.exports.MediaScraper = MediaScraper
