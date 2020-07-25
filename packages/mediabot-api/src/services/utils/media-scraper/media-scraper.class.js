/* eslint-disable no-unused-vars */
const Promise = require('bluebird')
const got = require('got')
const util = require('util')
const path = require('path')
const fs = require('fs')
const TmdbScraper = require('@mediabot/tmdb')
let tmdb
const xml2js = require('xml2js')
const { get } = require('lodash')

class Service {
  constructor(options) {
    this.options = options || {}
  }

  setup(app) {
    this.app = app
    tmdb = new TmdbScraper('9cc56c731a06623343d19ce2f7a3c982')
  }

  /**
   * MediaScraperService#findTmdbId
   *
   * Loads all movies media directory. Existing movies are refreshed,
   * new movies are added, and missing movies are removed.
   *
   * @since 0.2.0
   * @memberof MediaScraperService
   * @param {String} name Name of the movie to search
   * @param {Number} year Release year of the movie to search
   * @returns {Object} Promise Promise that resolves to TMDB ID
   */
  findTmdbId(name, year) {
    return tmdb.search
      .movie({
        query: name,
        year: year,
      })
      .then((res) => res.results[0].id)
  }

  /**
   * MediaScraperService#scrapeMovieByTmdbId
   *
   * Loads all movies media directory. Existing movies are refreshed,
   * new movies are added, and missing movies are removed.
   *
   * @since 0.2.0
   * @memberof MediaScraperService
   * @param {Number} id TMDB ID
   * @returns {Object} Promise Promise that resolves to metadata
   */
  scrapeMovieByTmdbId(id) {
    this.app.info(`Loading information for movie (TMDB ID: ${id}) from TMDB.`, {
      label: 'MediaScraperService',
    })
    return tmdb
      .movie({
        id,
      })
      .then((res) => {
        let movie = {}

        movie.id = res.imdb_id
        movie.tmdbid = res.id
        movie.title = res.title
        movie.originalTitle = res.original_title
        movie.originalLanguage = res.original_language
        movie.tagline = res.tagline
        movie.plot = res.overview
        movie.outline = res.overview
        movie.runtime = res.runtime
        movie.year = res.release_date
        // movie.rating = res.vote_average
        movie.genre = res.genres.map((genre) => genre.name)
        movie.studio = res.production_companies.map((studio) => studio.name)
        movie.fanart = res.backdrop_path
        movie.poster = res.poster_path

        return movie
      })
      .catch((err) => {
        this.app.error(`Unable to scrape movie (TMDB ID: ${id}) from TMDB.`)
        this.app.debug(err.message, {
          label: 'MediaScraperService',
        })
        this.app.debug(err.stack, {
          label: 'MediaScraperService',
        })
        throw err
      })
  }

  /**
   * MediaScraperService#scrapeMoviebyName
   *
   * Loads all movies media directory. Existing movies are refreshed,
   * new movies are added, and missing movies are removed.
   *
   * @since 0.2.0
   * @memberof MediaScraperService
   * @param {String} name Name of the movie to search
   * @param {Number} year Release year of the movie to search
   * @returns {Object} Promise Promise that resolves to metadata
   */
  scrapeMoviebyName(name, year) {
    this.app.info(`Loading information for movie (${name} - ${year}) from TMDB.`, {
      label: 'MediaScraperService',
    })
    return this.findTmdbId(name, year)
      .then((id) => tmdb.movie({ id }))
      .then((res) => {
        let movie = {}

        movie.id = res.imdb_id
        movie.tmdbid = res.id
        movie.title = res.title
        movie.originaltitle = res.original_title
        movie.tagline = res.tagline
        movie.plot = res.overview
        movie.outline = res.overview
        movie.runtime = res.runtime
        movie.year = res.release_date
        // movie.rating = res.vote_average
        movie.genre = res.genres.map((genre) => genre.name)
        movie.studio = res.production_companies.map((studio) => studio.name)
        movie.fanart = res.backdrop_path
        movie.poster = res.poster_path

        return movie
      })
      .catch((err) => {
        this.app.error(`Unable to scrape movie (${name} - ${year}) from TMDB.`)
        this.app.debug(err.message, {
          label: 'MediaScraperService',
        })
        this.app.debug(err.stack, {
          label: 'MediaScraperService',
        })
        throw err
      })
  }

  buildXmlNfo(movie) {
    var builder = new xml2js.Builder({
      rootName: 'movie',
    })
    return builder.buildObject(movie)
  }

  async autoScrapeMovie(name, year, filename) {
    this.app.debug(
      `Auto scraping movie with name: ${name}, year: ${year}, filename: ${filename}.`,
      {
        label: 'MediaScrapeService',
      }
    )
    const writeFile = util.promisify(fs.writeFile)

    return this.autoSearchMovie(name, year)
      .then((id) => this.scrapeTmdbMovie(id))
      .then((movie) => {
        console.log(movie)
        movie.uniqueid = []
        if (movie.id) movie.uniqueid.push({ $: { type: 'imdb' }, _: movie.id })
        if (movie.tmdbid) movie.uniqueid.push({ $: { type: 'tmdb' }, _: movie.tmdbid })
      })
      .then((movie) => {
        console.log(movie)
        let { dir, name } = path.parse(filename)
        this.downloadImage(
          `https://image.tmdb.org/t/p/original${movie.fanart}`,
          `${dir}/${name}-fanart.jpg`
        )
        this.downloadImage(
          `https://image.tmdb.org/t/p/original${movie.poster}`,
          `${dir}/${name}-poster.jpg`
        )
        return writeFile(`${dir}/${name}.nfo`, this.buildXmlNfo(movie))
      })
      .catch((err) => {
        this.app.error(err.message, {
          label: 'MediaScrapeService',
        })
        this.app.debug(err.stack, {
          label: 'MediaScrapeService',
        })
        throw err
      })
  }

  async autoScrapeMovieByTmdbId(id, filename) {
    this.app.info(`Auto scraping movie with TMDB ID: ${id}.`, {
      label: 'MediaScrapeService',
    })
    const writeFile = util.promisify(fs.writeFile)

    return this.scrapeMovieByTmdbId(id)
      .then((movie) => {
        movie.uniqueid = []
        if (movie.id) movie.uniqueid.push({ $: { type: 'imdb' }, _: movie.id })
        if (movie.tmdbid) movie.uniqueid.push({ $: { type: 'tmdb' }, _: movie.tmdbid })

        delete movie.id
        delete movie.tmdbid

        return movie
      })
      .then((movie) => {
        let { dir, name } = path.parse(filename)
        this.downloadImage(
          `https://image.tmdb.org/t/p/original${movie.fanart}`,
          `${dir}/${name}-fanart.jpg`
        )
        this.downloadImage(
          `https://image.tmdb.org/t/p/original${movie.poster}`,
          `${dir}/${name}-poster.jpg`
        )
        return writeFile(`${dir}/${name}.nfo`, this.buildXmlNfo(movie))
      })
      .catch((err) => {
        this.app.error(err.message, {
          label: 'MediaScrapeService',
        })
        this.app.debug(err.stack, {
          label: 'MediaScrapeService',
        })
        throw err
      })
  }

  downloadImage(uri, filename) {
    return new Promise((resolve, reject) => {
      var file = fs.createWriteStream(filename)
      got
        .stream(uri)
        .on('error', (err) => {
          this.app.error(err.message, {
            label: 'MediaScrapeService',
          })
          this.app.debug(err.stack, {
            label: 'MediaScrapeService',
          })
          file.end()
          reject(err)
        })
        .pipe(
          file
            .on('error', (err) => {
              this.app.error(err.message, {
                label: 'MediaScrapeService',
              })
              this.app.debug(err.stack, {
                label: 'MediaScrapeService',
              })
              reject(err)
            })
            .on('close', () => resolve())
        )
    })
  }
}

module.exports = function moduleExport(options) {
  return new Service(options)
}

module.exports.Service = Service
