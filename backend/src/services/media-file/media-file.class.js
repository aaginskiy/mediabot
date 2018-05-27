/* eslint-disable no-unused-vars */
const util = require('util');
var child_process = require('child_process');
const shellwords = require('shellwords');
const _ = require('lodash');

class Service {
  constructor (options) {
    this.options = options || {};
  }

  find (params) {
    return Promise.resolve([]);
  }

  get (id, params) {
    return Promise.resolve({
      id, text: `A new message with ID: ${id}!`
    });
  }

  update (id, data, params) {
    return Promise.resolve(data);
  }

  patch (id, data, params) {
    return Promise.resolve(data);
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
      .catch(function(error){
        return Promise.reject(error);
      });
  }
}

module.exports = function (options) {
  return new Service(options);
};

module.exports.Service = Service;
