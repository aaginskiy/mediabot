"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseFilename = exports.loadMetadataFromNfo = exports.muxMediaFile = exports.writeMediainfo = exports.loadMediainfoFromFile = exports.findAllMediaFiles = void 0;
const fast_glob_1 = __importDefault(require("fast-glob"));
const logger_1 = __importDefault(require("../logger"));
const logger = new logger_1.default('DiskScanner');
const lodash_1 = require("lodash");
const shellwords_ts_1 = __importDefault(require("shellwords-ts"));
const child_process_1 = __importDefault(require("child_process"));
const events_1 = require("events");
const util_1 = __importDefault(require("util"));
const exec = util_1.default.promisify(child_process_1.default.exec);
const lodash_2 = require("lodash");
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const readdir = util_1.default.promisify(fs_1.default.readdir);
const rename = util_1.default.promisify(fs_1.default.rename);
const readFile = util_1.default.promisify(fs_1.default.readFile);
const xml2js_1 = __importDefault(require("xml2js"));
const change_case_1 = require("change-case");
/**
 * Parse filename for movie title and year
 *
 * @since 0.2.0
 */
function parseFilename(filename) {
    var _a, _b, _c, _d, _e, _f, _g;
    let title, year;
    const folderName = path_1.default
        .dirname(filename)
        .split(path_1.default.sep)
        .pop();
    if (folderName) {
        const reTitle = /^(?<title>.*)\((?<year>(19|20)\d{2})\)$/i;
        const reArticle = /^(?<title>.*),\s+(?<article>(the|a|an))$/i;
        const matchTitle = reTitle.exec(folderName);
        year = ((_a = matchTitle === null || matchTitle === void 0 ? void 0 : matchTitle.groups) === null || _a === void 0 ? void 0 : _a.year) ? parseInt((_b = matchTitle === null || matchTitle === void 0 ? void 0 : matchTitle.groups) === null || _b === void 0 ? void 0 : _b.year) : undefined;
        const intermediateTile = (_e = (_d = (_c = matchTitle === null || matchTitle === void 0 ? void 0 : matchTitle.groups) === null || _c === void 0 ? void 0 : _c.title) === null || _d === void 0 ? void 0 : _d.replace(/\./gi, ' ')) === null || _e === void 0 ? void 0 : _e.trim();
        if (intermediateTile) {
            const matchArticle = reArticle.exec(intermediateTile);
            title = matchArticle ? ((_f = matchArticle.groups) === null || _f === void 0 ? void 0 : _f.article) + ' ' + ((_g = matchArticle.groups) === null || _g === void 0 ? void 0 : _g.title) : intermediateTile;
            title = title ? change_case_1.capitalCase(title) : title;
        }
    }
    else {
        title = undefined;
        year = undefined;
    }
    return {
        title,
        year,
    };
}
exports.parseFilename = parseFilename;
/**
 * Scans directory recursively for any media files
 *
 * @since 0.2.0
 */
async function findAllMediaFiles(directory, existingFilenames) {
    const globString = `${directory}/**/*.mkv`;
    logger.info(`Loading movies from ${directory}.`);
    const mediaOnDisk = await fast_glob_1.default(globString);
    // Filter removed movies
    const removedFilenames = lodash_1.difference(existingFilenames, mediaOnDisk);
    logger.verbose('Found removed movies:');
    logger.verbose(removedFilenames.toString());
    // Filter existing movies
    const updatedFilenames = existingFilenames.filter((filename) => mediaOnDisk.includes(filename));
    logger.verbose('Found existing movies:');
    logger.verbose(updatedFilenames.toString());
    // Filter new movies
    const createdFilenames = lodash_1.difference(mediaOnDisk, updatedFilenames);
    logger.verbose('Found new movies:');
    logger.verbose(createdFilenames.toString());
    return {
        created: lodash_1.compact(createdFilenames),
        updated: lodash_1.compact(updatedFilenames),
        removed: lodash_1.compact(removedFilenames),
    };
}
exports.findAllMediaFiles = findAllMediaFiles;
/**
 * Loads media metadata, artwork and directory files from disk.
 *
 * @since 0.2.0
 */
async function loadMediainfoFromFile(filename) {
    var _a, _b;
    logger.info('Loading requested movie metadata from the disk.');
    logger.info(`Filename: ${filename}`);
    if (!filename)
        throw new TypeError('Filename must be defined and not empty.');
    try {
        const escapedFilename = shellwords_ts_1.default.escape(filename);
        const res = await exec(`mkvmerge -J ${escapedFilename}`);
        const stdout = JSON.parse(res.stdout);
        const mediaInfo = {};
        mediaInfo.title = (_b = (_a = stdout.container) === null || _a === void 0 ? void 0 : _a.properties) === null || _b === void 0 ? void 0 : _b.title;
        mediaInfo.filename = stdout.file_name;
        mediaInfo.dir = path_1.default.dirname(mediaInfo.filename);
        mediaInfo.tracks = [];
        // Cycle through tracks and add updates
        lodash_2.each(stdout.tracks, (track) => {
            var _a, _b, _c, _d, _e, _f, _g;
            const processedTrack = {};
            processedTrack.title = (_a = track.properties) === null || _a === void 0 ? void 0 : _a.track_name;
            processedTrack.language = (_b = track.properties) === null || _b === void 0 ? void 0 : _b.language;
            processedTrack.number = track.id;
            processedTrack.newNumber = processedTrack.number;
            processedTrack.trackType = track.type;
            processedTrack.codecType = track.codec;
            processedTrack.isDefault = (_c = track.properties) === null || _c === void 0 ? void 0 : _c.default_track;
            processedTrack.isEnabled = (_d = track.properties) === null || _d === void 0 ? void 0 : _d.enabled_track;
            processedTrack.isForced = (_e = track.properties) === null || _e === void 0 ? void 0 : _e.forced_track;
            processedTrack.isMuxed = true;
            // Additional parameters for audio tracks
            if (processedTrack.trackType === 'audio') {
                processedTrack.audioChannels = (_f = track.properties) === null || _f === void 0 ? void 0 : _f.audio_channels;
                processedTrack.bps = (_g = track.properties) === null || _g === void 0 ? void 0 : _g.tag_bps;
            }
            mediaInfo.tracks.push(processedTrack);
        });
        const filePath = path_1.default.parse(filename);
        mediaInfo.files = await readdir(filePath.dir);
        if (mediaInfo.files.includes(filePath.name + '-poster.jpg')) {
            mediaInfo.poster = filePath.name + '-poster.jpg';
        }
        else if (mediaInfo.files.includes('poster.jpg')) {
            mediaInfo.poster = 'poster.jpg';
        }
        if (mediaInfo.files.includes(filePath.name + '-fanart.jpg')) {
            mediaInfo.fanart = filePath.name + '-fanart.jpg';
        }
        else if (mediaInfo.files.includes('fanart.jpg')) {
            mediaInfo.fanart = 'fanart.jpg';
        }
        if (mediaInfo.files.includes(filePath.name + '.nfo')) {
            mediaInfo.nfo = filePath.name + '.nfo';
        }
        if (mediaInfo.files.includes(filePath.name + '-landscape.jpg'))
            mediaInfo.landscape = filePath.name + '-landscape.jpg';
        const defaultVideoTracks = lodash_2.filter(mediaInfo.tracks, {
            trackType: 'video',
            isDefault: true,
        });
        const defaultAudioTracks = lodash_2.filter(mediaInfo.tracks, {
            trackType: 'audio',
            isDefault: true,
        });
        if (defaultVideoTracks[0])
            mediaInfo.videoTag = legibleTag(defaultVideoTracks[0].codecType);
        if (defaultAudioTracks[0])
            mediaInfo.audioTag = `${legibleTag(defaultAudioTracks[0].codecType)} ${defaultAudioTracks[0].audioChannels}ch`;
        return mediaInfo;
    }
    catch (error) {
        logger.error(`Unable to load media info for "${filename}".`);
        logger.error(error.message);
        throw error;
    }
}
exports.loadMediainfoFromFile = loadMediainfoFromFile;
/**
 * Updates mkv file properties with data.  If id is present, filename is extracted from
 * that movie object.
 *
 * @memberof DiskScanner
 */
async function writeMediainfo(filename, mediainfo) {
    logger.info('Updating file media info without merging.');
    logger.info(`Filename: ${filename}`);
    const infoOptions = generateInfoOptions(mediainfo);
    return exec(`mkvpropedit -v ${shellwords_ts_1.default.escape(filename)} ${infoOptions}`)
        .then(() => mediainfo)
        .catch((err) => {
        logger.error(err);
        return Promise.reject(err);
    });
}
exports.writeMediainfo = writeMediainfo;
/**
 * Mux media file
 *
 * @memberof DiskScanner
 */
function muxMediaFile(filename, mediainfo) {
    logger.info('Called MediaFile#mux with:');
    const muxEvent = new events_1.EventEmitter();
    const command = generateMergeCommand(mediainfo);
    const bin = command.shift();
    if (!bin) {
        logger.warn('Missing command to merge');
        muxEvent.emit('error', 'Missing command to merge');
        return muxEvent;
    }
    const updateEvent = child_process_1.default.spawn(bin, command, { shell: true });
    if (updateEvent.stdout) {
        updateEvent.stdout.on('data', (res) => {
            const result = /(.*): (.*)/.exec(res.toString());
            if (result && result[1] === 'Progress') {
                muxEvent.emit('progress', parseInt(result[2].slice(0, -1)));
            }
        });
    }
    else {
        logger.warn('Unable to connect to stdout of mkvmerge');
    }
    updateEvent.on('exit', async (code) => {
        if (code === 1 || code === 0) {
            logger.verbose(`Backing up ${mediainfo.filename} to ${mediainfo.filename + 'bak'}.`);
            try {
                await rename(mediainfo.filename, mediainfo.filename + 'bak');
                await rename(mediainfo.filename.slice(0, -3) + 'rmbtmp', mediainfo.filename);
                muxEvent.emit('done', `Received 'exit' message with code '${code}' from mkvmerge on '${mediainfo.filename}'`);
            }
            catch (error) {
                muxEvent.emit('error', mediainfo.filename);
            }
        }
        else {
            const e = new Error(`Received 'exit' message with code '${code}' from mkvmerge on '${mediainfo.filename}'`);
            muxEvent.emit('error', e);
        }
    });
    updateEvent.on('error', (error) => muxEvent.emit('error', error));
    return muxEvent;
}
exports.muxMediaFile = muxMediaFile;
function legibleTag(tag) {
    let legibleTag;
    switch (tag) {
        default:
            legibleTag = tag;
    }
    return legibleTag;
}
function generateInfoOptions(mediainfo) {
    let command = `--edit info --set "title=${mediainfo.title}"`;
    if (!mediainfo.tracks)
        return command;
    mediainfo.tracks.forEach((track) => {
        command += ` --edit track:${track.number + 1}`;
        [
            ['name', track.title],
            ['language', track.language],
        ].forEach((field) => {
            if (field[1]) {
                command += ` --set "${field[0]}=${field[1]}"`;
            }
            else {
                command += ` --delete ${field[0]}`;
            }
        });
        [
            ['flag-default', track.isDefault ? 1 : 0],
            ['flag-enabled', track.isEnabled ? 1 : 0],
            ['flag-forced', track.isForced ? 1 : 0],
        ].forEach((field) => {
            command += ` --set "${field[0]}=${field[1]}"`;
        });
    });
    return command;
}
function generateMergeCommand(mediainfo) {
    const base = path_1.default.basename(mediainfo.filename, '.mkv');
    const dir = path_1.default.dirname(mediainfo.filename);
    const commandObj = {
        audioMerge: false,
        videoMerge: false,
        subtitlesMerge: false,
        audioNumber: '',
        videoNumber: '',
        subtitlesNumber: '',
        trackOrder: '',
        command: ['mkvmerge', '--output', `"${dir}/${base}.rmbtmp"`],
    };
    lodash_2.sortBy(mediainfo.tracks, 'newNumber').forEach((track) => {
        if (track.isMuxed) {
            switch (track.trackType) {
                case 'audio':
                    commandObj['audioMerge'] = true;
                    commandObj['audioNumber'] += `${track.number},`;
                    break;
                case 'video':
                    commandObj['videoMerge'] = true;
                    commandObj['videoNumber'] += `${track.number},`;
                    break;
                case 'subtitles':
                    commandObj['subtitlesMerge'] = true;
                    commandObj['subtitlesNumber'] += `${track.number},`;
                    break;
            }
            commandObj.trackOrder += `0:${track.number},`;
        }
    });
    if (commandObj.videoMerge) {
        commandObj.command.push('-d');
        commandObj.command.push(`${commandObj.videoNumber.slice(0, -1)}`);
    }
    else {
        commandObj.command.push('-D');
    }
    if (commandObj.audioMerge) {
        commandObj.command.push('-a');
        commandObj.command.push(`${commandObj.audioNumber.slice(0, -1)}`);
    }
    else {
        commandObj.command.push('-A');
    }
    if (commandObj.subtitlesMerge) {
        commandObj.command.push('-s');
        commandObj.command.push(`${commandObj.subtitlesNumber.slice(0, -1)}`);
    }
    else {
        commandObj.command.push('-S');
    }
    // Remove attachments
    // TODO: make configurable
    commandObj.command.push('-M');
    commandObj.command.push(`"${mediainfo.filename}"`);
    commandObj.command.push('--title');
    commandObj.command.push(`"${mediainfo.title}"`);
    commandObj.command.push('--track-order');
    commandObj.command.push(commandObj.trackOrder.slice(0, -1));
    return commandObj.command;
}
/**
 * DiskScannerService#_loadMetadataFromNfo
 *
 * Loads media metadata from local nfo file
 *
 * @since 0.2.0
 * @memberof DiskScannerService
 * @param {String} filename Filename of the nfo file to load.
 * @returns Promise Promise to resolve metadata from nfo.
 */
async function loadMetadataFromNfo(filename) {
    try {
        const xml = await readFile(filename);
        const xml2nfo = await new xml2js_1.default.Parser({
            explicitArray: false,
            ignoreAttrs: true,
        }).parseStringPromise(xml);
        const uniqueid = xml2nfo.movie.uniqueid;
        const nfo = {};
        nfo.title = xml2nfo.movie.title;
        nfo.originalTitle = xml2nfo.movie.originalTitle;
        nfo.originalLanguage = xml2nfo.movie.originalLanguage;
        nfo.tagline = xml2nfo.movie.tagline;
        nfo.plot = xml2nfo.movie.plot;
        nfo.outline = xml2nfo.movie.outline;
        nfo.runtime = parseInt(xml2nfo.movie.runtime);
        nfo.year = parseInt(xml2nfo.movie.year);
        nfo.rating = parseFloat(xml2nfo.movie.rating);
        nfo.releaseDate = xml2nfo.movie.releaseDate;
        if (Array.isArray(xml2nfo.movie.genres)) {
            nfo.genres = xml2nfo.movie.genres;
        }
        else {
            nfo.genres = [xml2nfo.movie.genres];
        }
        if (Array.isArray(xml2nfo.movie.studios)) {
            nfo.studios = xml2nfo.movie.studios;
        }
        else {
            nfo.studios = [xml2nfo.movie.studios];
        }
        nfo.fanart = xml2nfo.movie.fanart;
        nfo.poster = xml2nfo.movie.poster;
        const imdbidIndex = lodash_2.findIndex(uniqueid, function (o) {
            return o.startsWith('tt');
        });
        const tmdbidIndex = lodash_2.findIndex(uniqueid, function (o) {
            return !!o.match(/^\d/);
        });
        nfo.imdbId = uniqueid[imdbidIndex];
        nfo.tmdbId = parseInt(uniqueid[tmdbidIndex]);
        return nfo;
    }
    catch (error) {
        logger.error(`Unable to read nfo @ ${filename}`);
        throw error;
    }
}
exports.loadMetadataFromNfo = loadMetadataFromNfo;
