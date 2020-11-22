import { Service, NedbServiceOptions } from 'feathers-nedb'
import { Application, JobRecord, Movie } from '../../declarations'
import { findAllMediaFiles, loadMediainfoFromFile, parseFilename } from '../../utils/disk-scanner'
import MetadataEditor from '../../utils/metadata-editor'
import MediaScraper from '../../utils/media-scraper'
import { EventEmitter } from 'events'
import Log from '../../logger'
const logger = new Log('JobService')

export class Jobs extends Service<JobRecord> {
  app: Application
  scraper: MediaScraper

  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options)
    this.app = app
    this.scraper = new MediaScraper(app.settings?.mediaParser?.tmdbApiKey)
  }

  async _scanMediaLibrary(): Promise<JobRecord | JobRecord[]> {
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
    const updateJobs = movies.map(
      (movie): Partial<JobRecord> => {
        return { name: 'refreshMovie', args: [movie.id, movie.filename], progress: 0, status: 'queued' }
      }
    )

    return this.create(updateJobs)
  }

  scanMediaLibrary(): EventEmitter {
    const scanEmitter = new EventEmitter()
    const JobService = this.app.service('api/jobs')
    let jobIds: string[]
    let jobCount: number

    this._scanMediaLibrary()
      .then((jobs) => {
        jobIds = Array.isArray(jobs) ? jobs.map((job) => job.id) : [jobs.id]
        jobCount = jobIds.length
      })
      .catch((e) => scanEmitter.emit('error', e))

    const onCreatedListener = (job: JobRecord) => {
      if (job.status === 'completed' || job.status === 'failed') {
        const index = jobIds.indexOf(job.id)
        if (index > -1) {
          jobIds.splice(index, 1)
        }

        if (jobIds.length > 0) {
          const progress = ((jobCount - jobIds.length) / jobCount) * 100
          console.log(parseFloat(progress.toFixed(1)))
          scanEmitter.emit('progress', parseFloat(progress.toFixed(1)))
        } else {
          scanEmitter.emit('done')
          JobService.removeListener('patched', onCreatedListener)
        }
      }
    }

    JobService.on('patched', onCreatedListener)

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

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  previewMovieFix(id: string, filename: string): EventEmitter {
    const jobEmitter = new EventEmitter()
    const MovieService = this.app.service('api/movies')

    MovieService.get(id)
      .then((movie) => {
        try {
          const rules = this.app.get('movieFixRules')
          return MetadataEditor.executeRules(movie, rules)
        } catch (e) {
          throw e
        }
      })
      .then((movie) => MovieService.update(id, movie))
      .then(() => jobEmitter.emit('done'))
      .catch((e) => jobEmitter.emit('error', e))

    return jobEmitter
  }
}
