/* eslint-disable no-unused-vars */
const util = require('util');
const childProcess = require('child_process');
const glob = require('glob-promise');
const shellwords = require('shellwords');
const _ = require('lodash');
const path = require('path');
const EventEmitter = require('events');
// const Promise = require("bluebird");
const fs = require('fs');
const rename = util.promisify(fs.rename);
// const rename = Promise.promisify

class Service {
  constructor(options) {
    this.options = options || {};
  }

  setup(app) {
    this.app = app;
    this.Movie = app.service('movies');
    this.Job = app.service('jobs');
  }

  /**
   * MediaFileService#loadFromFile
   *
   * Loads movie metadata, artwork and directory files from disk.
   * 
   * @since 0.1.0
   * @memberof MediaFileService
   * @param {String} filename Filename of the media to load.
   * @returns Promise Promise to resolve metadata from file.
   */
  loadFromFile(filename) {
    this.app.info('Loading requested movie from the disk.', { label: "MediaFileService" });
    this.app.debug(filename, { label: "MediaFileService" });

    if (!filename) return Promise.resolve({});

    return this.parseMkvmergeInfo(filename)
      .then(async movie => {
        const readdir = util.promisify(fs.readdir);

        let filePath = path.parse(filename);

        movie.dir = filePath.dir;

        movie.files = await readdir(filePath.dir);

        if (movie.files.includes(filePath.name+"-poster.jpg")) movie.poster = filePath.name+"-poster.jpg";

        if (movie.files.includes(filePath.name+"-fanart.jpg")) movie.fanart = filePath.name+"-fanart.jpg";

        return movie;
      })
      .catch(err => {
        this.app.warn(`Unable to find movie \"${filename}\".`, { label: "MediaFileService"});
        this.app.warn(err.message, { label: "MediaFileService"});
        return {};
      });
  }

  /**
   * MediaFile#create
   *
   * Loads all movies media directory. Existing movies are refreshed,
   * new movies are added, and missing movies are removed.
   *
   * @since 0.1.0
   * @memberof MediaFileService
   * @param {Object} data Unused. Compatibility with FeathersJS services #create signature.
   * @param {Object} params Filenames in FeathersJS params structure: params.query.filenames.
   * @returns {Object} res 
   */
  async create(data, params) {
    this.app.info('Reloading requested movies from the disk.', { label: "MediaFileService" });

    // Load all media files in media directory if no filenames specified
    if (!params.query.filenames || params.query.filenames.length === 0) {
      const globString = `${this.app.get('movieDirectory')}/**/*.mkv`;

      this.app.info(`Loading movies from ${this.app.get('movieDirectory')}.`, { label: "MediaFileService"});
      params.query.filenames = await glob.promise(globString);
    }

    // Load all movies
    const movies = await this.Movie.find();
    const movieFilenames = movies.map(movie => movie.filename);

    const deleteFilenames = _.difference(movieFilenames, params.query.filenames);

    this.app.debug('Deleting missing movies:', { label: "MediaFileService"});
    this.app.debug(deleteFilenames, { label: "MediaFileService"});

    const existingMovies = movies.filter(movie => params.query.filenames.includes(movie.filename));
    const existingFilenames = existingMovies.map(movie => movie.filename);

    // Filter out existing movies
    const createFilenames = _.difference(params.query.filenames, existingFilenames);

    this.app.debug('Loading new movies:', { label: "MediaFileService"});
    this.app.debug(createFilenames, { label: "MediaFileService"});

    this.app.debug('Refreshing existing movies:', { label: "MediaFileService"});
    this.app.debug(existingFilenames, { label: "MediaFileService"});

    return Promise.all([
      Promise.all(createFilenames.map((filename) => this.loadFromFile(filename).then((movie) => {
        return this.Movie.create(movie)
          .catch((err) => {
            this.app.error(err);
          });
      }))),
      Promise.all(existingMovies.map(async (movie) => {
        const mediaInfo = await this.loadFromFile(movie.filename);

        if (_.isEmpty(mediaInfo)) {
          return null;
        } else {
          return this.Movie.update(movie._id, mediaInfo, { skipWrite: true });
        }
      })),
      this.Movie.remove(null, { query: { filename: { $in: deleteFilenames } } }),
    ]).then((res) => {
      return {
        'created': _.compact(res[0]),
        'updated': _.compact(res[1]),
        'deleted': _.compact(res[2]),
      };
    });
  }

  /**
   * MediaFile#get
   *
   * Reload existing movie from file by ID.
   *
   * @since 0.1.0
   * @memberof MediaFileService
   * @param {Integer} id 
   * @param {Object} params Unused. Compatibility with FeathersJS services #get signature.
   * @returns {Object} metadata Reloaded metadata from file.
   */
  get(id, params) {
    this.app.info(`Loading movie #${id} metadata from file.`, { label: "MediaFileService"});

    return this.Movie.get(id)
      .then(data => 
        this.parseMkvmergeInfo(data.filename)
          .then(movie => this.Movie.update(id, movie, { skipWrite: true })))
      .catch(err => {
        this.app.error(`Unable to load movie #${id} metadata from file.`);
        this.app.error(err, { label: "MediaFileService#get"});
        throw err;
      });
  }

  update (id, data, params) {
    const jobData = {
      movieId: id,
      title: data.title,
      status: this.app.get('JOB_STATUS.NEW'),
      args: [
        id,
        data,
      ],
      service: 'media-file',
      function: 'mux',
    };
    return this.Job.create(jobData, {});
  }

  /**
   * MediaFile#patch
   *
   * Updates mkv file properties with data.  If id is present, filename is extracted from
   * that movie object.
   *
   * @param {any} id
   * @param {any} data
   * @param {any} params
   * @returns Promise
   * @memberof MediaFile
   */
  async patch(id, data, params) {
    this.app.info(`Patching movie #${id} metadata to file.`, { label: "MediaFileService"});

    const exec = util.promisify(childProcess.exec);

    const movieData = await this.Movie.get(id);
    return exec(`mkvpropedit -v ${shellwords.escape(movieData.filename)} ${this.generateInfoCommand(data)}`)
      .catch(err => {
        this.app.error(err, { label: "MediaFileService"});
        return Promise.reject(err);
      });
  }

  /**
   * MediaFileService#parseMkvmergeInfo
   *
   * Loads movie metadata, artwork and directory files from disk.
   * 
   * @since 0.1.0
   * @memberof MediaFileService
   * @private
   * @param {String} filename Filename of the media file to parse.
   * @returns Promise Promise to resolve metadata from file by mkvmerge.
   */
  parseMkvmergeInfo(filename) {
    const _self = this;
    const escapedFilename = shellwords.escape(filename);
    const exec = util.promisify(childProcess.exec);
    return exec(`mkvmerge -J ${escapedFilename}`)
      .then((res) => {
        let mediaInfo = {};
        const stdout = JSON.parse(res.stdout);

        // Set general movie information
        mediaInfo.title = _.get(stdout, 'container.properties.title');
        mediaInfo.filename = stdout.file_name;
        mediaInfo.tracks = [];

        // Cycle through tracks and add updates
        _.each(stdout.tracks, (track) => {
          let processedTrack = {};

          processedTrack.name = _.get(track, 'properties.track_name');
          processedTrack.language = _.get(track, 'properties.language');
          processedTrack.number = _.get(track, 'id');
          processedTrack.newNumber = processedTrack.number;
          processedTrack.type = track.type;
          processedTrack.codecType = track.codec;
          processedTrack.isDefault = _.get(track, 'properties.default_track');
          processedTrack.isEnabled = _.get(track, 'properties.enabled_track');
          processedTrack.isForced = _.get(track, 'properties.forced_track');
          processedTrack.isMuxed = true;

          // Additional parameters for audio tracks
          if (processedTrack.type === 'audio') {
            processedTrack.audioChannels = _.get(track, 'properties.audio_channels');
            processedTrack.bps = _.get(track, 'properties.tag_bps');
          }
          processedTrack = _.omitBy(processedTrack, _.isNil);
          mediaInfo.tracks.push(processedTrack);
        });

        mediaInfo = _.omitBy(mediaInfo, _.isNil);
        return mediaInfo;
      });
  }

  generateInfoCommand(data) {
    let command = `--edit info --set "title=${data.title}"`;

    if (!data.tracks) return command;

    data.tracks.forEach((track) => {
      command += ` --edit track:${track.number + 1}`;

      [['name', track.name],
        ['language', track.language]].forEach((field) => {
          if (field[1]) {
            command += ` --set \"${field[0]}=${field[1]}\"`;
          } else {
            command += ` --delete ${field[0]}`;
          }
      });

      [['flag-default', track.isDefault ? 1 : 0],
        ['flag-enabled', track.isEnabled ? 1 : 0],
        ['flag-forced', track.isForced ? 1 : 0]].forEach((field) => {
          command += ` --set \"${field[0]}=${field[1]}\"`;
      });
    });

    return command;
  }

  generateMergeCommand(data) {
    const base = path.basename(data.filename, '.mkv');
    const dir = path.dirname(data.filename);

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

    _.sortBy(data.tracks, 'newNumber').forEach((track) => {
      if (track.isMuxed) {
        commandObj[`${track.type}Merge`] = true;

        commandObj[`${track.type}Number`] += `${track.number},`;

        commandObj.trackOrder += `0:${track.number},`;
      }
    });

    if (commandObj.videoMerge) {
      commandObj.command.push('-d');
      commandObj.command.push(`${commandObj.videoNumber.slice(0, -1)}`);
    } else {
      commandObj.command.push('-D');
    }

    if (commandObj.audioMerge) {
      commandObj.command.push('-a');
      commandObj.command.push(`${commandObj.audioNumber.slice(0, -1)}`);
    } else {
      commandObj.command.push('-A');
    }

    if (commandObj.subtitlesMerge) {
      commandObj.command.push('-s');
      commandObj.command.push(`${commandObj.subtitlesNumber.slice(0, -1)}`);
    } else {
      commandObj.command.push('-S');
    }

    // Remove attachments
    // TODO: make configurable
    commandObj.command.push('-M');

    commandObj.command.push(`"${data.filename}"`);
    commandObj.command.push('--title');
    commandObj.command.push(`"${data.title}"`);

    commandObj.command.push('--track-order');

    commandObj.command.push(commandObj.trackOrder.slice(0, -1));

    this.app.debug('Executing \'mkvmerge\' command');
    this.app.debug(`    ${commandObj.command}`);

    return commandObj.command;
  }

  mux(id, data) {
    this.app.silly('Called MediaFile#mux with:', { label: "MediaFileService"});
    this.app.silly({ id: id, data: data }, { label: "MediaFileService"});

    const muxEvent = new EventEmitter();
    const command = this.generateMergeCommand(data);
    const updateEvent = childProcess.spawn(command.shift(), command, {shell: true});
    updateEvent.stdout.on('data', (res) => {
      const re = /(.*): (.*)/;
      const result = re.exec(res.toString());
      if (result && result[1] === 'Progress') {
        muxEvent.emit('progress', result[2].slice(0,-1));
      }
    });

    updateEvent.on('exit', (code) => {
      if (code === 1 || code === 0) {
        this.app.debug(`Backing up ${data.filename} to ${data.filename + 'bak'}.`, { label: "MediaFileService#mux"});
        rename(data.filename, data.filename + 'bak')
          .catch((err) => {
            this.app.error(`Unable to rename ${data.filename} to ${data.filename + 'bak'}.`, { label: "MediaFileService#mux"});
            muxEvent.emit('finished', new Error('Unable to rename MKV file to back up.'));
            return Promise.reject(err);
          })
          .then((val) => {
            this.app.debug(`Renaming ${data.filename.slice(0,-3) + 'rmbtmp'} to ${data.filename}.`, { label: "MediaFileService#mux"});
            return rename(data.filename.slice(0,-3) + 'rmbtmp', data.filename);
          })
          .catch((err) => {
            this.app.error(`Unable to rename ${data.filename.slice(0,-3) + 'rmbtmp'} to ${data.filename}.`, { label: "MediaFileService#mux"});
            muxEvent.emit('finished', new Error('Unable to rename MKV file from new mux.'));
            return Promise.reject(err);
          })
          .then((val) => {
            this.get(id, {});
            muxEvent.emit('finished', `Received 'exit' message with code '${code}' from mkvmerge on '${data.filename}'`);
          });
      } else {
        muxEvent.emit('finished', new Error(`Received 'exit' message with code '${code}' from mkvmerge on '${data.filename}'`));
      }
    });

    updateEvent.on('error', err => Promise.reject(new Error(`Received 'error' message with '${err}' from mkvmerge on '${data.filename}'`)));

    return muxEvent;
  }
}

module.exports = function moduleExport(options) {
  return new Service(options);
};

module.exports.Service = Service;
