/* eslint-disable no-unused-vars */
const util = require('util');
var child_process = require('child_process');
const glob = require('glob-promise');
const shellwords = require('shellwords');
const _ = require('lodash');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  setup(app) {
    this.app = app;
    this.Movie = app.service('movies');
  }

  async find (params) {
    var filenames, mediaInfo = [];
    var _self = this;
    if (!params.query.filenames) return Promise.resolve([]);
    filenames = params.query.filenames;

    return Promise.all(filenames.map(filename => {
        return _self._readMovieInfo(filename).catch(error => null);
    })).then(res => {
      return _.compact(res)
    });
  }

  async create (data, params) {
    this.app.info('Called MediaFile#create with:', data, params);
    var _self = this;

    // Load all media files in media directory if no filenames specified
    if (!params.query.filenames || params.query.filenames.length == 0) {
      let globString = this.app.get('movieDirectory') + '/**/*.mkv';
      this.app.debug(`MediaFile#create - loading filenames from ${globString}.`)
      params.query.filenames = await glob.promise(globString);
    }

    // Load all movies
    var movies = await _self.Movie.find();
    var existingMovies = movies.filter(movie => params.query.filenames.includes(movie.filename));
    var existingFilenames = existingMovies.map(movie => movie.filename);

    // Filter out existing movies
    var createFilenames = _.difference(params.query.filenames, existingFilenames);
    params.query.filenames = createFilenames;

    this.app.debug('MediaFile#create - creating new movies from:', createFilenames);

    // Create new movies
    var createData = await _self.find(params);

    // TODO delete orphaned movie enteries
    var deleted = [];

    return Promise.all([
      _self.Movie.create(createData),
      Promise.all(existingMovies.map(async movie => {
        let mediaInfo = await _self.find({ query: { filenames: [movie.filename] } });
        
        let data = (!mediaInfo[0]) ? {} : mediaInfo[0];

        return _self.Movie.patch(movie._id, data);
      }))
    ]).then(res => {
      return {
        created: res[0],
        patched: res[1]
      }
    });
  }

  get (id, params) {
    return this.Movie.get(id)
      .then(async data => this.Movie.patch(id, await this._readMovieInfo(data.filename)));
  }

  update (id, data, params) {
    return Promise.resolve(data);
  }

/**
 * MediaFile#patch
 * 
 * Updates mkv file properties with data.  If id is present, filename is extracted from that movie object.
 * 
 * @param {any} id 
 * @param {any} data 
 * @param {any} params 
 * @returns Promise
 * @memberof MediaFile
 */
async patch (id, data, params) {
  this.app.info('Called MediaFile#patch with:', id, data, params);

  const exec = util.promisify(child_process.exec);

  var movieData = await this.Movie.get(id);
  return exec(`mkvpropedit -v ${movieData.filename} ${this._generateInfoCommand(data)}`);
}

  _readMovieInfo (filename) {
    var _self = this;
    //logger.debug(`[Ruby Media Bot] Executing 'mkvmerge -i' to load information for ${filename}`);
    var escapedFilename = shellwords.escape(filename);
    const exec = util.promisify(child_process.exec);
    return exec(`mkvmerge -J ${escapedFilename}`)
      .then(res => {
        var mediaInfo = new Object();
        var stdout = JSON.parse(res.stdout);
        if (stdout) {
          // Set general movie information
          mediaInfo.title = stdout.container.properties.title;
          mediaInfo.filename = stdout.file_name;
          mediaInfo.tracks = new Array();

          // Cycle through tracks and add updates
          _.each(stdout.tracks, function (track) {
            var processedTrack = new Object();

            processedTrack.name = track.properties.track_name;
            processedTrack.language = track.properties.language;
            processedTrack.number = track.properties.number;
            processedTrack.type = track.type;
            processedTrack.codecType = track.codec;
            processedTrack.isDefault = track.properties.default_track;
            processedTrack.isEnabled = track.properties.enabled_track;
            processedTrack.isForced = track.properties.forced_track;

            // Additional parameters for audio tracks
            if (processedTrack.type == 'audio') {
              processedTrack.audioChannels = track.properties.audio_channels;
              processedTrack.bps = track.properties.tag_bps;
            }
            
            processedTrack = _.omitBy(processedTrack, _.isNil);
            mediaInfo.tracks.push(processedTrack);
          });

          mediaInfo = _.omitBy(mediaInfo, _.isNil);

        } else {
          return Promise.reject(new Error('[Ruby Media Bot] \'mkvmerge -i\' could not be parse to json.'));
        }
        return Promise.resolve(mediaInfo);
      })
      .catch(error => Promise.reject(error));
  }

  _generateInfoCommand (data) {
    var command = `--edit info --set "title=${data.title}"`;

    if (!data.tracks) return command;

    data.tracks.forEach(track => {
      command += ` --edit track:${track.number}`;

      [["name", track.name],
      ["language", track.language],
      ["flag-default", track.isDefault ? 1 : 0],
      ["flag-enabled", track.isEnabled ? 1 : 0],
      ["flag-forced", track.isForced ? 1 : 0]].forEach(field => {
        if (!field[1]) {
          command += ` --delete ${field[0]}`;
        } else {
          command += ` --set "${field[0]}=${field[1]}"`;
        }
      });
    });

    return shellwords.escape(command);
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
