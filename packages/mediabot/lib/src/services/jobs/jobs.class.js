"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Jobs = void 0;
const feathers_nedb_1 = require("feathers-nedb");
const disk_scanner_1 = require("../../utils/disk-scanner");
const metadata_editor_1 = __importDefault(require("../../utils/metadata-editor"));
const media_scraper_1 = __importDefault(require("../../utils/media-scraper"));
const events_1 = require("events");
const logger_1 = __importDefault(require("../../logger"));
const logger = new logger_1.default('JobService');
class Jobs extends feathers_nedb_1.Service {
    //eslint-disable-next-line @typescript-eslint/no-unused-vars
    constructor(options, app) {
        var _a, _b;
        super(options);
        this.app = app;
        this.scraper = new media_scraper_1.default((_b = (_a = app.settings) === null || _a === void 0 ? void 0 : _a.mediaParser) === null || _b === void 0 ? void 0 : _b.tmdbApiKey);
    }
    async _scanMediaLibrary() {
        const MovieService = this.app.service('api/movies');
        let existingMovies = await MovieService.find({
            paginate: false,
        });
        if (!Array.isArray(existingMovies))
            existingMovies = existingMovies.data;
        const existingMovieFilenames = existingMovies.map((movie) => movie.filename);
        const mediafiles = await disk_scanner_1.findAllMediaFiles(this.app.get('movieDirectory'), existingMovieFilenames);
        const createMovieData = mediafiles.created.map((filename) => ({ filename }));
        await Promise.all([
            MovieService.remove(null, {
                query: {
                    filename: {
                        $in: mediafiles.removed,
                    },
                },
            }),
            MovieService.create(createMovieData),
        ]);
        let movies = await MovieService.find({
            paginate: false,
        });
        if (!Array.isArray(movies))
            movies = movies.data;
        const updateJobs = movies.map((movie) => {
            return { name: 'refreshMovie', args: [movie.id, movie.filename] };
        });
        return this.create(updateJobs);
    }
    scanMediaLibrary() {
        const scanEmitter = new events_1.EventEmitter();
        this._scanMediaLibrary()
            .then(() => scanEmitter.emit('done'))
            .catch((e) => scanEmitter.emit('error', e));
        return scanEmitter;
    }
    async _createMovieObject(filename) {
        const parsedFilename = disk_scanner_1.parseFilename(filename);
        const movie = { filename };
        if (!parsedFilename.title)
            throw new Error(`Unable to detect movie name from filename (${filename})`);
        try {
            const remoteInfo = await this.scraper.scrapeSaveMovieByName(parsedFilename.title, parsedFilename.year, filename);
            movie.imdbId = remoteInfo.imdbId;
            movie.tmdbId = remoteInfo.tmdbId;
            movie.title = remoteInfo.title;
            movie.originalTitle = remoteInfo.originalTitle;
            movie.originalLanguage = remoteInfo.originalLanguage;
            movie.tagline = remoteInfo.tagline;
            movie.plot = remoteInfo.plot;
            movie.outline = remoteInfo.outline;
            movie.runtime = remoteInfo.runtime;
            movie.year = remoteInfo.year;
            movie.releaseDate = remoteInfo.releaseDate;
            movie.rating = remoteInfo.rating;
            movie.genres = remoteInfo.genres;
            movie.studios = remoteInfo.studios;
        }
        catch (e) {
            logger.warn(`Unable to scrape remote info for "${filename}".`);
            logger.warn(e.message);
            if (e.stack)
                logger.debug(e.stack);
            movie.title = parsedFilename.title;
            movie.year = parsedFilename.year;
        }
        try {
            movie.mediaFiles = await disk_scanner_1.loadMediainfoFromFile(filename);
            movie.dir = movie.mediaFiles.dir;
            movie.poster = movie.mediaFiles.poster;
            movie.fanart = movie.mediaFiles.fanart;
        }
        catch (e) {
            throw e;
        }
        try {
            const rules = this.app.get('movieFixRules');
            movie.fixed = metadata_editor_1.default.checkRules(movie, rules);
        }
        catch (e) {
            throw e;
        }
        return movie;
    }
    refreshMovie(id, filename) {
        const refreshEmitter = new events_1.EventEmitter();
        const MovieService = this.app.service('api/movies');
        this._createMovieObject(filename)
            .then((movie) => MovieService.update(id, movie))
            .then((movie) => {
            return this.scraper.cacheImages(movie.id, { poster: `${movie.dir}/${movie.poster}`, fanart: `${movie.dir}/${movie.fanart}` }, this.app.get('imageCacheLocation'));
        })
            .then(() => refreshEmitter.emit('done'))
            .catch((e) => refreshEmitter.emit('error', e));
        return refreshEmitter;
    }
}
exports.Jobs = Jobs;
