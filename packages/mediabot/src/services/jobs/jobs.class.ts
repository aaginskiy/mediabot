import { Service, NedbServiceOptions } from 'feathers-nedb'
import { Application, JobData, Movie, ServiceTypes } from '../../declarations'
import { findAllMediaFiles, loadMediainfoFromFile, parseFilename } from '../../utils/disk-scanner'
import MediaScraper from '../../utils/media-scraper'
import { EventEmitter } from 'events'
import Log from '../../logger'
const logger = new Log('JobService')

// Add this service to the service type index
declare module '../../declarations' {
  interface JobData {
    id: string
    name: string
    args: Array<any>
    status: 'queued' | 'running' | 'completed' | 'failed'
    progress: number
    error: string
    statusMessage: string
  }
}

export class Jobs extends Service<JobData> {
  app: any
  scraper: MediaScraper
  MovieService: ServiceTypes['movies']

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options)
    this.app = app
    this.scraper = new MediaScraper(app.settings?.mediaParser?.tmdbApiKey)
    this.MovieService = this.app.service('movies')
  }

  scanMediaLibrary(): EventEmitter {
    const scanEmitter = new EventEmitter()
    const MovieService: ServiceTypes['movies'] = this.app.service('movies')
    MovieService.find({
      paginate: false,
    })
      .then((existingMovies) => {
        if (!Array.isArray(existingMovies)) existingMovies = existingMovies.data

        const existingMovieFilenames = existingMovies.map((movie) => movie.filename)
        return findAllMediaFiles(this.app.get('movieDirectory'), existingMovieFilenames)
      })
      .then((mediafiles) => {
        if (mediafiles.removed.length > 0)
          MovieService.remove(null, {
            query: {
              filename: {
                $in: mediafiles.removed,
              },
            },
          })

        const createJobs = mediafiles.created.map((file) => {
          return { name: 'addMovie', args: [file] }
        })

        const updateJobs = mediafiles.updated.map((file) => {
          return { name: 'refreshMovie', args: [file] }
        })

        return Promise.all([this.create(updateJobs), this.create(createJobs)])
      })
      .then(() => scanEmitter.emit('done'))
      .catch((e) => scanEmitter.emit('error', e))

    return scanEmitter
  }

  async _createMovieObject(filename: string): Promise<Partial<Movie>> {
    const parsedFilename = parseFilename(filename)
    const movie: Partial<Movie> = {}

    if (!parsedFilename.title) throw new Error(`Unable to detect movie name from filename (${filename})`)

    try {
      const remoteInfo = await this.scraper.scrapeSaveMovieByName(parsedFilename.title, parsedFilename.year, filename)
      movie.imdbId = remoteInfo.imdbId
      movie.tmdbId = remoteInfo.tmdbId
      movie.title = remoteInfo.title
      movie.originalTitle = remoteInfo.originalTitle
      movie.originalLanguage = remoteInfo.originalLanguage
      movie.tagline = remoteInfo.tagline
      movie.plot = remoteInfo.plot
      movie.outline = remoteInfo.outline
      movie.runtime = remoteInfo.runtime
      movie.year = remoteInfo.year
      movie.releaseDate = remoteInfo.releaseDate
      movie.rating = remoteInfo.rating
      movie.genres = remoteInfo.genres
      movie.studios = remoteInfo.studios
    } catch (e) {
      logger.warn(`Unable to scrape remote info for "${filename}".`)
      logger.warn(e.message)
      if (e.stack) logger.debug(e.stack)

      movie.title = parsedFilename.title
      movie.year = parsedFilename.year
    }

    try {
      movie.mediaFiles = await loadMediainfoFromFile(filename)
      return movie
    } catch (e) {
      throw e
    }
  }

  addMovie(filename: string): EventEmitter {
    const addEmitter = new EventEmitter()

    this._createMovieObject(filename)
      .then((movie) => this.MovieService.create(movie))
      .then(() => addEmitter.emit('done'))
      .catch((e) => addEmitter.emit('error', e))

    return addEmitter
  }

  refreshMovie(filename: string): EventEmitter {
    const refreshEmitter = new EventEmitter()

    this._createMovieObject(filename)
      .then((movie) => {
        return this.MovieService.patch(null, movie, {
          query: {
            filename: {
              $in: filename,
            },
          },
        })
      })
      .then(() => refreshEmitter.emit('done'))
      .catch((e) => refreshEmitter.emit('error', e))

    return refreshEmitter
  }
}
