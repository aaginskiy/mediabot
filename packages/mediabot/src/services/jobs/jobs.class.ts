import { Service, NedbServiceOptions } from 'feathers-nedb'
import { Application, JobData, Movie } from '../../declarations'
import { findAllMediaFiles, loadMediainfoFromFile, parseFilename } from '../../utils/disk-scanner'
import MetadataEditor from '../../utils/metadata-editor'
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
  app: Application
  scraper: MediaScraper

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options)
    this.app = app
    this.scraper = new MediaScraper(app.settings?.mediaParser?.tmdbApiKey)
  }

  async _scanMediaLibrary(): Promise<JobData | JobData[]> {
    const MovieService = this.app.service('api/movies')
    let existingMovies = await MovieService.find({
      paginate: false,
    })

    if (!Array.isArray(existingMovies)) existingMovies = existingMovies.data

    const existingMovieFilenames = existingMovies.map((movie) => movie.filename)
    const mediafiles = await findAllMediaFiles(this.app.get('movieDirectory'), existingMovieFilenames)
    const createMovieData = mediafiles.created.map((filename) => ({ filename }))

    await Promise.all([
      MovieService.remove(null, {
        query: {
          filename: {
            $in: mediafiles.removed,
          },
        },
      }),
      MovieService.create(createMovieData),
    ])

    let movies = await MovieService.find({
      paginate: false,
    })

    if (!Array.isArray(movies)) movies = movies.data
    const updateJobs = movies.map((movie) => {
      return { name: 'refreshMovie', args: [movie.id, movie.filename] }
    })

    return this.create(updateJobs)
  }

  scanMediaLibrary(): EventEmitter {
    const scanEmitter = new EventEmitter()
    this._scanMediaLibrary()
      .then(() => scanEmitter.emit('done'))
      .catch((e) => scanEmitter.emit('error', e))

    return scanEmitter
  }

  async _createMovieObject(filename: string): Promise<Movie> {
    const parsedFilename = parseFilename(filename)
    const movie: Movie = { filename }

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
      movie.dir = movie.mediaFiles.dir
      movie.poster = movie.mediaFiles.poster
      movie.fanart = movie.mediaFiles.fanart
    } catch (e) {
      throw e
    }

    try {
      const rules = this.app.get('movieFixRules')
      movie.fixed = MetadataEditor.checkRules(movie, rules)
    } catch (e) {
      throw e
    }

    return movie
  }

  refreshMovie(id: string, filename: string): EventEmitter {
    const refreshEmitter = new EventEmitter()
    const MovieService = this.app.service('api/movies')

    this._createMovieObject(filename)
      .then((movie) => MovieService.update(id, movie))
      .then((movie) => {
        return this.scraper.cacheImages(
          movie.id,
          { poster: `${movie.dir}/${movie.poster}`, fanart: `${movie.dir}/${movie.fanart}` },
          this.app.get('imageCacheLocation')
        )
      })
      .then(() => refreshEmitter.emit('done'))
      .catch((e) => refreshEmitter.emit('error', e))

    return refreshEmitter
  }
}
