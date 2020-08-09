import MovieDB from 'node-themoviedb'
import got from 'got'
import util from 'util'
import path from 'path'
import fs from 'fs'
const writeFile = util.promisify(fs.writeFile)
import xml2js from 'xml2js'
import { cloneDeep } from 'lodash'
import logger from '../logger'

interface RemoteMovieInfo {
  id: string | null
  tmdbId: number | null
  title: string
  originalTitle: string
  originalLanguage: string
  tagline: string | null
  plot: string | null
  outline: string | null
  runtime: number | null
  year: number
  releaseDate: string
  rating: number
  genres: Array<string>
  studios: Array<string>
  fanart: string | null
  poster: string | null
}

interface RemoteMovieInfoXml extends RemoteMovieInfo {
  uniqueid?: Array<any>
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
    logger.verbose(`Searching TMDB ID of movie ${name} (${year})`, {
      label: 'MediaScraper',
    })

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
        logger.error(`Unable to find TMDB ID for movie ${name} (${year})`, {
          label: 'MediaScraper',
        })

        throw err
      })
  }

  /**
   * Scrapes movie information by TMDB ID.
   *
   * @since 0.2.0
   */
  async scrapeMovieByTmdbId(id: number): Promise<RemoteMovieInfo> {
    logger.verbose(`Loading information for movie (TMDB ID: ${id}) from TMDB.`, {
      label: 'MediaScraper',
    })

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
          id: movieInfo.imdb_id,
          tmdbId: movieInfo.id,
          title: movieInfo.title,
          originalTitle: movieInfo.original_title,
          originalLanguage: movieInfo.original_language,
          tagline: movieInfo.tagline,
          plot: movieInfo.overview,
          outline: movieInfo.overview,
          runtime: movieInfo.runtime,
          year: releaseYear,
          releaseDate: movieInfo.release_date,
          rating: movieInfo.vote_average,
          genres: movieInfo.genres.map((genre) => genre.name),
          studios: movieInfo.production_companies.map((studio) => studio.name),
          fanart: movieInfo.backdrop_path,
          poster: movieInfo.poster_path,
        }

        return movie
      })
      .catch((err: Error) => {
        logger.error(`Unable to load information for movie (TMDB ID: ${id}) from TMDB.`, {
          label: 'MediaScraper',
        })

        throw err
      })
  }

  /**
   * Scrapes movie information by name and optional year
   *
   * @since 0.2.0
   */
  async scrapeMovieByName(name: string, year: number | undefined): Promise<RemoteMovieInfo> {
    logger.info(`Loading information for movie ${name} (${year}) from TMDB.`, {
      label: 'MediaScraper',
    })
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
        { $: { type: 'imdb' }, _: movie.id },
        { $: { type: 'tmdb' }, _: movie.tmdbId },
      ]

      delete movie.id
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
          console.log(err)
          reject(err)
        })
        .on('close', () => {
          resolve()
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
