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

    _.each(filenames, async function (filename) {
      try {
        let info = await _self._readMovieInfo(filename);
        if (info) mediaInfo.push(info);
      } catch (error) {}
    })

    return Promise.resolve(mediaInfo);
  }

  async create (data, params) {
    this.app.debug('MediaFile#create');
    var _self = this;

    // Load all media files in media directory if no filenames specified
    if (!params.query.filenames || params.query.filenames.length == 0) {
      let globString = this.app.get('movieDirectory') + '/**/*.mkv';
      this.app.debug('[MediaFile#create]', globString)
      params.query.filenames = await glob.promise(globString);
    }

    // Load all movies
    var movies = await _self.Movie.find();
    var existingMovies = movies.filter(movie => params.query.filenames.includes(movie.filename));
    var existingFilenames = existingMovies.map(movie => movie.filename);

    // Filter out existing movies
    var createFilenames = _.difference(params.query.filenames, existingFilenames);
    params.query.filenames = createFilenames;

    // Create new movies
    var createData = await _self.find(params);

    // Create movies from new filenames
    var created = await _self.Movie.create(createData);

    // Patch movies from existing filenames
    var patched = await Promise.all(existingMovies.map(async movie => {
      let mediaInfo = await _self.find({ query: { filenames: [movie.filename] }});
      if (!mediaInfo) return Promise.resolve({});
      return _self.Movie.patch(movie._id, mediaInfo[0]);
    }));

    // TODO delete orphaned movie enteries
    var deleted = [];

    return Promise.resolve({
      created: created,
      patched: patched,
      deleted: deleted
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
    const exec = util.promisify(child_process.exec);

    var movieData = await this.Movie.get(id);
    return exec(`mkvpropedit -v ${movieData.filename} ${this._generateInfoCommand(data)}`);
  }

  _readMovieInfo (filename) {
    //logger.debug(`[Ruby Media Bot] Executing 'mkvmerge -i' to load information for ${filename}`);
    var escapedFilename = shellwords.escape(filename);
    const exec = util.promisify(child_process.exec);
    return exec(`mkvmerge -i ${escapedFilename} -F json`)
      .then(function(stdout, stderr) {
        var mediaInfo = new Object();
        if (stdout) {
          // Set general movie information
          mediaInfo.title = stdout.container.properties.title;
          mediaInfo.filename = stdout.file_name;
          mediaInfo.tracks = new Array();

          // Cycle through tracks and add updates
          _.each(stdout.tracks, function (track) {
            var processedTrack = new Object();

            processedTrack.trackName = track.properties.track_name;
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

            mediaInfo.tracks.push(processedTrack);
          });

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
