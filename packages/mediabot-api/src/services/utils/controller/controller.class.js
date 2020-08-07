/* eslint-disable no-unused-vars */
const fs = require('fs')
const path = require('path')
const EventEmitter = require('events')
const logger = require('../../../logger')
const { get } = require('lodash')
let Movies, Jobs, MediaScraper, MetadataEditor, DiskScanner

/**
 *
 * Controller for managing commands
 *
 * @since 0.2.0
 */
exports.Controller = class Controller {
  constructor(options) {
    this.options = options || {}
  }

  setup(app) {
    this.app = app
    Movies = app.service('movies')
    Jobs = app.service('jobs')
    MediaScraper = app.service('utils/media-scraper')
    MetadataEditor = app.service('utils/metadata-editor')
    DiskScanner = app.service('utils/disk-scanner')
  }

  /**
   *
   * Refresh movie from disk
   *
   * @since 0.2.0
   * @param {Integer} id Movie ID to refresh
   * @returns Promise Promise to resolve to movie
   */
  async refreshMovie(id, localOnly) {
    try {
      let movie = await Movies.get(id)
      movie = loadFromLocalFile(movie) 

      if (movie.tmdbId) {
        movie.tmdbInfo = await MediaScraper.scrapeMovieByTmdbId(movie.tmdbId)
      } else {
        if (!(movie.title && movie.year)) {
          let re = /([\s\w]+?)\s\((\d+)\)/g
          let matches = re.exec(path.basename(path.dirname(movie.filename)))
          movie.title = matches[1]
          movie.year = matches[2]
        }

        movie.tmdbInfo = await MediaScraper.scrapeMovieByName(movie.title, movie.year)
      }

      movie.mediaInfo.isFixed = MetadataEditor.checkRules(
        movie.MediaInfo,
        this.app.get('metadataRules')
      )

      return Movies.update(id, movie)
    } catch (error) {
      throw error
    }
  }

  async loadFromLocalFile(movie) {
    movie.mediaInfo = await DiskScanner.loadMediainfoFromFile(movie.filename)

      let nfoFilename = path.join(
        path.dirname(movie.filename),
        path.basename(movie.filename, path.extname(movie.filename)) + '.nfo'
      )

      if (fs.existsSync(nfoFilename)) {
        let nfo = await DiskScanner.loadMetadataFromNfo(nfoFilename)
        movie.mediaInfo.localInfo = nfo
        movie.title = get(nfo, 'title')
        movie.year = get(nfo, 'year')
        movie.tmdbId = get(nfo, 'uniqueid.tmdbid')
      }
      
      return movie
  }

  /**
   * DiskScanner#refreshAllMediainfo
   *
   * Loads all movies media directory. Existing movies are refreshed,
   * new movies are added, and missing movies are removed.
   *
   * @since 0.2.0
   * @param {Object} directory Root directory where to refresh movies
   * @returns {Object} Promise Promise to queue jobs to update each movie
   */
  async refreshAllMovies(directory) {
    try {
      let mediaFiles = await DiskScanner.findAllMediaFiles(directory)

      let existingMovies = await Movies.find({
        query: {
          filename: {
            $in: mediaFiles.updated,
          },
          $select: ['_id', 'filename'],
        },
      })

      let createData = mediaFiles.created.map((filename) => {
        return {
          filename: filename,
        }
      })

      let createdMovies = await Movies.create(createData, {})

      let createJobsData = (movies) => {
        return movies.map((movie) => ({
          args: [movie._id],
          name: 'RefreshMovie',
        }))
      }

      let createJobs = (movie) => {
        this.Jobs.create(
          {
            args: [movie._id],
            name: 'RefreshMovie',
          },
          {}
        )
      }

      return Promise.all([
        Jobs.create(createJobsData(createdMovies), {}),
        Movies.remove(null, { query: { filename: { $in: mediaFiles.removed } } }),
        Jobs.create(createJobsData(existingMovies), {}),
      ])
    } catch (error) {
      throw error
    }
  }

  async scanMediaLibrary(directory) {
    let mediaFiles = await this.findAllMediaFiles(directory)

    let createData = mediaFiles.created.map((filename) => {
      return { filename: filename }
    })

    let movies = await this.Movies.create(createData, {})

    let createJobs = (movie) => {
      this.Jobs.create(
        {
          args: [movie._id, movie.filename],
          name: 'RefreshMediainfo',
        },
        {}
      )
    }

    return Promise.all([
      Promise.map(movies, createJobs, { concurrency: 1 }),
      this.Movies.remove(null, { query: { filename: { $in: mediaFiles.removed } } }),
    ])
  }

  async scanScrapeSingleMovieByTmdbId(tmdbId, filename) {
    try {
      let existingMovies = await Movies.find({
        query: {
          filename: filename,
          $select: ['_id', 'filename'],
        },
      })

      let existingMovie = existingMovies[0]

      if (!existingMovie) existingMovie = await Movies.create({ filename: filename })
      
      let tmdbInfo = await MediaScraper.autoScrapeMovieByTmdbId(tmdbId, filename)

      let movie = await this.loadFromLocalFile(existingMovie)

      let fixedMediaInfo = MetadataEditor.executeRules(movie.mediaInfo, this.app.get('metadataRules'))
      const fixEvent = new EventEmitter()
      let muxEvent = DiskScanner
      .mux(movie._id, fixedMediaInfo)

      muxEvent.on('error', (error) => fixEvent.emit('error', error))
      muxEvent.on('progress', (progress) => fixEvent.emit('progress', progress))
      muxEvent.on('finished', (val) => {
        this.loadFromLocalFile(movie)
          .then(movie => {
            console.log(movie)
            Movies.update(movie._id, movie)
          })
          .then((metadata) => fixEvent.emit('finished', val))
          .catch((error) => fixEvent.emit('error', error))
      })
      return fixEvent
    } catch (error) {
      logger.error(`Failed to automatically scan, scrape and fix movie with tmdbID: ${tmdbId} and filename: ${filename}.`, { label: 'Controller' })
    }
  }

  async autoFixMovie(id) {
    let data = await Movies.get(id)
    data = MetadataEditor.executeRules(data.mediaInfo, this.app.get('metadataRules'))
    const fixEvent = new EventEmitter()
    let muxEvent = this.mux(id, data)

    muxEvent.on('error', (error) => fixEvent.emit('error', error))
    muxEvent.on('progress', (progress) => fixEvent.emit('progress', progress))
    muxEvent.on('finished', (val) => {
      this.refreshMovie(id)
        .then((metadata) => fixEvent.emit('finished', val))
        .catch((error) => fixEvent.emit('error', error))
    })
    return fixEvent
  }

  /**
   * DiskScanner#saveMediainfo
   *
   * Updates mkv file properties with data.  If id is present, filename is extracted from
   * that movie object.
   *
   * @param {any} id
   * @returns Promise
   * @memberof DiskScanner
   */
  async saveMediainfo(id, mediainfo) {
    logger.info(`Patching movie #${id} metadata to file.`, { label: 'MediaFileService' })

    const exec = util.promisify(childProcess.exec)

    const movieData = await this.Movies.get(id)
    return exec(
      `mkvpropedit -v ${shellwords.escape(movieData.filename)} ${this.generateInfoCommand(
        mediainfo
      )}`
    ).catch((err) => {
      logger.error(err, { label: 'MediaFileService' })
      return Promise.reject(err)
    })
  }

  createMediaFromMediainfo(filename) {
    return this.loadMediainfoFromFile(filename).then((metadata) => this.Movies.create(metadata, {}))
  }
}
