/* eslint-disable no-unused-vars */
const util = require('util');
const childProcess = require('child_process');
const glob = require('glob-promise');
const shellwords = require('shellwords');
const _ = require('lodash');
const path = require('path');
const EventEmitter = require('events');

class Service {
  constructor(options) {
    this.options = options || {};
  }

  setup(app) {
    this.app = app;
    this.Movie = app.service('movies');
  }

  async find(params) {
    const _self = this;
    if (!params.query.filenames) return Promise.resolve([]);
    const { filenames } = params.query;

    return Promise.all(filenames.map(filename =>
      _self._readMovieInfo(filename).catch(error => null))).then(res => _.compact(res));
  }

  /**
   * MediaFile#create
   *
   * Loads all movies media directory. Existing movies are refreshed,
   * new movies are added, and missing moves are removed.
   *
   * @param {any} id
   * @param {any} params
   * @returns Promise
   * @memberof MediaFile
   */
  async create(data, params) {
    this.app.info('Called MediaFile#create with:', data, params);
    const _self = this;

    // Load all media files in media directory if no filenames specified
    if (!params.query.filenames || params.query.filenames.length === 0) {
      const globString = `${this.app.get('movieDirectory')}/**/*.mkv`;
      this.app.debug(`MediaFile#create - loading filenames from ${globString}.`);
      glob.promise(globString)
        .then(function(contents) {
          console.log(contents); //=> []
        });
      params.query.filenames = await glob.promise(globString);
    }

    // Load all movies
    const movies = await _self.Movie.find();
    const existingMovies = movies.filter(movie => params.query.filenames.includes(movie.filename));
    const existingFilenames = existingMovies.map(movie => movie.filename);

    // Filter out existing movies
    const createFilenames = _.difference(params.query.filenames, existingFilenames);
    params.query.filenames = createFilenames;

    this.app.debug('MediaFile#create - creating new movies from:', createFilenames);

    // Create new movies
    const createData = await _self.find(params);

    // TODO delete orphaned movie enteries

    return Promise.all([
      _self.Movie.create(createData),
      Promise.all(existingMovies.map(async (movie) => {
        const mediaInfo = await _self.find({ query: { filenames: [movie.filename] } });
        return _self.Movie.patch(movie.id, mediaInfo[0]);
      })),
    ]).then(res => ({
      created: res[0],
      updated: res[1],
    }));
  }

  get(id, params) {
    return this.Movie.get(id)
      .then(async data => this.Movie.update(id, await this._readMovieInfo(data.filename)));
  }

  // update (id, data, params) {
  //   return Promise.resolve(data);
  // }

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
    this.app.info('Called MediaFile#patch with:', id, data, params);

    const exec = util.promisify(childProcess.exec);

    const movieData = await this.Movie.get(id);
    return exec(`mkvpropedit -v ${shellwords.escape(movieData.filename)} ${this._generateInfoCommand(data)}`);
  }

  _readMovieInfo(filename) {
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
          processedTrack.number = _.get(track, 'properties.number');
          processedTrack.newNumber = _.get(track, 'properties.number');
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
        return Promise.resolve(mediaInfo);
      });
  }

  _generateInfoCommand(data) {
    let command = `--edit info --set "title=${data.title}"`;

    if (!data.tracks) return command;

    data.tracks.forEach((track) => {
      command += ` --edit track:${track.number}`;

      [['name', track.name],
        ['language', track.language],
        ['flag-default', track.isDefault ? 1 : 0],
        ['flag-enabled', track.isEnabled ? 1 : 0],
        ['flag-forced', track.isForced ? 1 : 0]].forEach((field) => {
        // if (!field[1]) {
          // command += ` --delete ${field[0]}`;
        // } else {
          command += ` --set \"${field[0]}=${field[1]}\"`;
        // }
      });
    });

    return command;
  }

  _generateMergeCommand(data) {
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

    // let command = 'mkvmerge --output "' + dir + '/' + base + '.rmbtmp"'

    _.sortBy(data.tracks, 'newNumber').forEach((track) => {
      if (track.isMuxed) {
        commandObj[`${track.type}Merge`] = true;

        commandObj[`${track.type}Number`] += `${track.number - 1},`;
      }
      commandObj.trackOrder += `0:${track.number - 1},`;
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

  _update(id, data, progress) {
    return new Promise((resolve, reject) => {
      const command = this._generateMergeCommand(data);
      const updateEvent = childProcess.spawn(command.shift(), command);
      updateEvent.on('exit', (code) => {
        if (code === 1 || code === 0) {
          return resolve(code);
        }

        return reject(new Error(`Received 'exit' message with code '${code}' from mkvmerge on '${data.filename}'`));
      });

      updateEvent.on('error', err => reject(new Error(`Received 'error' message with '${err}' from mkvmerge on '${data.filename}'`)));

      updateEvent.stdout.on('data', (res) => {
        if (_.isFunction(progress)) {
          const re = /(.*): (.*)/;
          const result = re.exec(res.toString());

          if (result[1] === 'Progress') {
            progress(result[2]);
          }
        }
      });
    });
  }
}

module.exports = function moduleExport(options) {
  return new Service(options);
};

module.exports.Service = Service;
