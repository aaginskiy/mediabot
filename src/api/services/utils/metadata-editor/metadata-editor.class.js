/* eslint-disable no-unused-vars */
const set = require('lodash/set')
const get = require('lodash/get')
const map = require('lodash/map')
const assign = require('lodash/assign')

class Service {
  constructor (options) {
    this.options = options || {}
  }

  setup (app) {
    this.app = app
  }

  /**
   * DiskScannerService#refreshMediainfo
   *
   * Refreshes media metadata, artwork and directory files from disk for one media file.
   *
   * @since 0.2.0
   * @memberof DiskScannerService
   * @param {String} filename Filename of the media to load.
   * @returns Promise Promise to resolve metadata from a file.
   */
  setVideoLanguage (data) {
    const language = data.language
    const tracks = map(data.tracks, (track) =>
      get(track, 'type') === 'video' ? set(track, 'language', language) : track)
    return assign({}, data, {tracks})
  }

  /**
   * DiskScannerService#refreshMediainfo
   *
   * Refreshes media metadata, artwork and directory files from disk for one media file.
   *
   * @since 0.2.0
   * @memberof DiskScannerService
   * @param {String} filename Filename of the media to load.
   * @returns Promise Promise to resolve metadata from a file.
   */
  removeNonEngSubtitles (data) {
    const tracks = map(data.tracks, (track) =>
      get(track, 'type') === 'subtitles' && get(track, 'language') !== 'eng'
        ? set(track, 'isMuxed', false) : set(track, 'isMuxed', true))
    return assign({}, data, {
      tracks
    })
  }

  /**
   * DiskScannerService#refreshMediainfo
   *
   * Refreshes media metadata, artwork and directory files from disk for one media file.
   *
   * @since 0.2.0
   * @memberof DiskScannerService
   * @param {String} filename Filename of the media to load.
   * @returns Promise Promise to resolve metadata from a file.
   */
  undefaultSubtitles (data) {
    const tracks = map(data.tracks, (track) =>
      get(track, 'type') === 'subtitles'
        ? set(track, 'isDefault', false) : track)
    return assign({}, data, {
      tracks
    })
  }
}

module.exports = function moduleExport (options) {
  return new Service(options)
}

module.exports.Service = Service
