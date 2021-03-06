import MovieDB from 'node-themoviedb'
import got from 'got'
import util from 'util'
import path from 'path'
import fs from 'fs'
import sharp from 'sharp'
const writeFile = util.promisify(fs.writeFile)
import xml2js from 'xml2js'
import { cloneDeep } from 'lodash'
import { Log, convertLangCode } from '@/utils'
const logger = new Log('MediaScraper')
import { RemoteMovieInfo, RemoteMovieInfoXml } from '../declarations'

declare module '../declarations' {
  interface RemoteMovieInfoXml extends RemoteMovieInfo {
    uniqueid?: Array<any>
  }
}

class MediaScraper {
  tmdb: MovieDB

  constructor(tmdbApiKey: string) {
    this.tmdb = new MovieDB(tmdbApiKey)
  }

  /**
   * Seaches for movie by name and optional year.  Returns the TMDB ID of the movie.
   *
   * @since 0.2.0
   */
  async findTmdbId(name: string, year?: number | undefined): Promise<number> {
    logger.verbose(`Searching TMDB ID of movie ${name} (${year})`)

    if (!name) throw new TypeError('Parameter "name" must be provided')

    const args = {
      query: {
        query: name,
        year: year,
      },
    }

    return this.tmdb.search
      .movies(args)
      .then((res) => res.data.results[0].id)
      .catch((err) => {
        logger.error(`Unable to find TMDB ID for movie ${name} (${year})`)

        throw err
      })
  }

  /**
   * Scrapes movie information by TMDB ID.
   *
   * @since 0.2.0
   */
  async scrapeMovieByTmdbId(id: number): Promise<RemoteMovieInfo> {
    logger.verbose(`Loading information for movie (TMDB ID: ${id}) from TMDB.`)

    const args = {
      pathParameters: {
        movie_id: id,
      },
    }

    return this.tmdb.movie
      .getDetails(args)
      .then((res) => {
        const movieInfo = res.data
        const releaseYear = new Date(movieInfo.release_date).getFullYear()
        const movie: RemoteMovieInfo = {
          imdbId: movieInfo.imdb_id ? movieInfo.imdb_id : undefined,
          tmdbId: movieInfo.id,
          title: movieInfo.title,
          originalTitle: movieInfo.original_title,
          originalLanguage: convertLangCode(movieInfo.original_language),
          tagline: movieInfo.tagline ? movieInfo.tagline : undefined,
          plot: movieInfo.overview ? movieInfo.overview : undefined,
          outline: movieInfo.overview ? movieInfo.overview : undefined,
          runtime: movieInfo.runtime ? movieInfo.runtime : undefined,
          year: releaseYear,
          releaseDate: movieInfo.release_date,
          rating: movieInfo.vote_average,
          genres: movieInfo.genres.map((genre) => genre.name),
          studios: movieInfo.production_companies.map((studio) => studio.name),
          fanart: movieInfo.backdrop_path ? movieInfo.backdrop_path : undefined,
          poster: movieInfo.poster_path ? movieInfo.poster_path : undefined,
        }

        return movie
      })
      .catch((err: Error) => {
        logger.error(`Unable to load information for movie (TMDB ID: ${id}) from TMDB.`)

        throw err
      })
  }

  /**
   * Scrapes movie information by name and optional year
   *
   * @since 0.2.0
   */
  async scrapeMovieByName(name: string, year: number | undefined): Promise<RemoteMovieInfo> {
    logger.info(`Loading information for movie ${name} (${year}) from TMDB.`)
    return this.findTmdbId(name, year).then((id) => this.scrapeMovieByTmdbId(id))
  }

  /**
   * Scrapes movie information by TMDB ID. If missing, saves xml nfo, poster, and fanart.
   *
   * @since 0.2.0
   */
  async scrapeSaveMovieByTmdbId(id: number, filename: string, forced?: boolean): Promise<RemoteMovieInfo> {
    try {
      const { dir, name } = path.parse(filename)

      const returnMovie = await this.scrapeMovieByTmdbId(id)
      const movie: RemoteMovieInfoXml = cloneDeep(returnMovie)

      movie.uniqueid = [
        { $: { type: 'imdb' }, _: movie.imdbId },
        { $: { type: 'tmdb' }, _: movie.tmdbId },
      ]

      delete movie.imdbId
      delete movie.tmdbId

      if (!fs.existsSync(`${dir}/${name}.nfo`) || forced) await writeFile(`${dir}/${name}.nfo`, this.buildXmlNfo(movie))

      if (!fs.existsSync(`${dir}/${name}-poster.jpg`) || forced)
        await this.downloadImage(`https://image.tmdb.org/t/p/original${movie.poster}`, `${dir}/${name}-poster.jpg`)

      if (!fs.existsSync(`${dir}/${name}-fanart.jpg`) || forced)
        await this.downloadImage(`https://image.tmdb.org/t/p/original${movie.fanart}`, `${dir}/${name}-fanart.jpg`)

      return returnMovie
    } catch (error) {
      throw error
    }
  }

  async cacheImages(
    id: string | undefined,
    images: { poster: string | undefined; fanart: string | undefined },
    cacheLocation: string
  ): Promise<any> {
    if (!id) return new Error('Cannot cache images for undefined ID')

    return Promise.all([
      sharp(images.poster)
        .resize(200)
        .toFormat('jpeg')
        .toFile(`${cacheLocation}/${id}-poster-200.jpg`),
      sharp(images.fanart)
        .resize(1920)
        .toFormat('jpeg')
        .toFile(`${cacheLocation}/${id}-fanart-1920.jpg`),
    ])
  }

  /**
   * Scrapes movie information by TMDB ID. If missing, saves xml nfo, poster, and fanart.
   *
   * @since 0.2.0
   */
  async scrapeSaveMovieByName(
    name: string,
    year: number | undefined,
    filename: string,
    forced?: boolean
  ): Promise<RemoteMovieInfo> {
    return this.findTmdbId(name, year).then((id) => this.scrapeSaveMovieByTmdbId(id, filename, forced))
  }

  buildXmlNfo(movie: RemoteMovieInfoXml): string {
    const builder = new xml2js.Builder({
      rootName: 'movie',
    })
    return builder.buildObject(movie)
  }

  downloadImage(uri: string, filename: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const file = fs.createWriteStream(filename, { emitClose: true })
      file
        .on('error', (err) => {
          // console.log(err)
          reject(err)
        })
        .on('close', () => {
          resolve(null)
        })
      // console.log(file)
      got
        .stream(uri)
        .on('error', (err) => {
          file.end()
          reject(err)
        })
        .pipe(file)
    })
  }
}

export default MediaScraper
