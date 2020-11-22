"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const node_themoviedb_1 = __importDefault(require("node-themoviedb"));
const got_1 = __importDefault(require("got"));
const util_1 = __importDefault(require("util"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const sharp_1 = __importDefault(require("sharp"));
const writeFile = util_1.default.promisify(fs_1.default.writeFile);
const xml2js_1 = __importDefault(require("xml2js"));
const lodash_1 = require("lodash");
const logger_1 = __importDefault(require("../logger"));
const logger = new logger_1.default('MediaScraper');
class MediaScraper {
    constructor(tmdbApiKey) {
        this.tmdb = new node_themoviedb_1.default(tmdbApiKey);
    }
    /**
     * Seaches for movie by name and optional year.  Returns the TMDB ID of the movie.
     *
     * @since 0.2.0
     */
    async findTmdbId(name, year) {
        logger.verbose(`Searching TMDB ID of movie ${name} (${year})`);
        if (!name)
            throw new TypeError('Parameter "name" must be provided');
        const args = {
            query: {
                query: name,
                year: year,
            },
        };
        return this.tmdb.search
            .movies(args)
            .then((res) => res.data.results[0].id)
            .catch((err) => {
            logger.error(`Unable to find TMDB ID for movie ${name} (${year})`);
            throw err;
        });
    }
    /**
     * Scrapes movie information by TMDB ID.
     *
     * @since 0.2.0
     */
    async scrapeMovieByTmdbId(id) {
        logger.verbose(`Loading information for movie (TMDB ID: ${id}) from TMDB.`);
        const args = {
            pathParameters: {
                movie_id: id,
            },
        };
        return this.tmdb.movie
            .getDetails(args)
            .then((res) => {
            const movieInfo = res.data;
            const releaseYear = new Date(movieInfo.release_date).getFullYear();
            const movie = {
                imdbId: movieInfo.imdb_id ? movieInfo.imdb_id : undefined,
                tmdbId: movieInfo.id,
                title: movieInfo.title,
                originalTitle: movieInfo.original_title,
                originalLanguage: movieInfo.original_language,
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
            };
            return movie;
        })
            .catch((err) => {
            logger.error(`Unable to load information for movie (TMDB ID: ${id}) from TMDB.`);
            throw err;
        });
    }
    /**
     * Scrapes movie information by name and optional year
     *
     * @since 0.2.0
     */
    async scrapeMovieByName(name, year) {
        logger.info(`Loading information for movie ${name} (${year}) from TMDB.`);
        return this.findTmdbId(name, year).then((id) => this.scrapeMovieByTmdbId(id));
    }
    /**
     * Scrapes movie information by TMDB ID. If missing, saves xml nfo, poster, and fanart.
     *
     * @since 0.2.0
     */
    async scrapeSaveMovieByTmdbId(id, filename, forced) {
        try {
            const { dir, name } = path_1.default.parse(filename);
            const returnMovie = await this.scrapeMovieByTmdbId(id);
            const movie = lodash_1.cloneDeep(returnMovie);
            movie.uniqueid = [
                { $: { type: 'imdb' }, _: movie.imdbId },
                { $: { type: 'tmdb' }, _: movie.tmdbId },
            ];
            delete movie.imdbId;
            delete movie.tmdbId;
            if (!fs_1.default.existsSync(`${dir}/${name}.nfo`) || forced)
                await writeFile(`${dir}/${name}.nfo`, this.buildXmlNfo(movie));
            if (!fs_1.default.existsSync(`${dir}/${name}-poster.jpg`) || forced)
                await this.downloadImage(`https://image.tmdb.org/t/p/original${movie.poster}`, `${dir}/${name}-poster.jpg`);
            if (!fs_1.default.existsSync(`${dir}/${name}-fanart.jpg`) || forced)
                await this.downloadImage(`https://image.tmdb.org/t/p/original${movie.fanart}`, `${dir}/${name}-fanart.jpg`);
            return returnMovie;
        }
        catch (error) {
            throw error;
        }
    }
    async cacheImages(id, images, cacheLocation) {
        if (!id)
            return new Error('Cannot cache images for undefined ID');
        return sharp_1.default(images.poster)
            .resize(200)
            .toFormat('jpeg')
            .toFile(`${cacheLocation}/${id}-poster-200.jpg`);
    }
    /**
     * Scrapes movie information by TMDB ID. If missing, saves xml nfo, poster, and fanart.
     *
     * @since 0.2.0
     */
    async scrapeSaveMovieByName(name, year, filename, forced) {
        return this.findTmdbId(name, year).then((id) => this.scrapeSaveMovieByTmdbId(id, filename, forced));
    }
    buildXmlNfo(movie) {
        const builder = new xml2js_1.default.Builder({
            rootName: 'movie',
        });
        return builder.buildObject(movie);
    }
    downloadImage(uri, filename) {
        return new Promise((resolve, reject) => {
            const file = fs_1.default.createWriteStream(filename, { emitClose: true });
            file
                .on('error', (err) => {
                // console.log(err)
                reject(err);
            })
                .on('close', () => {
                resolve();
            });
            // console.log(file)
            got_1.default
                .stream(uri)
                .on('error', (err) => {
                file.end();
                reject(err);
            })
                .pipe(file);
        });
    }
}
exports.default = MediaScraper;
