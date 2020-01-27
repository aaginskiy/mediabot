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

  executeRules (movie, rules) {
    rules.forEach(rule => {
      rule.conditions = rule.conditions.map(condition => {
        if (typeof condition.value === 'object') {
          condition.value = get(movie, condition.value.location + '.' + condition.value.path)
        }
        return condition
      })

      rule.actions = rule.actions.map(action => {
        if (typeof action.value === 'object') {
          action.value = get(movie, action.value.location + '.' + action.value.path)
        }
        return action
      })

      if (rule.type === 'track') {
        movie.tracks = movie.tracks.map(track => {
          return this.executeTrackRule(track, rule)
        })
      }
    })
    return movie
  }

  executeTrackRule (track, rule) {
    let isConditionMatched = rule.conditions.reduce((accumulater, condition) => {
      return accumulater && this['match' + condition.matcher](get(track, condition.parameter), condition.value)
    }, true)

    let modifiedTrack = track
    if (isConditionMatched) {
      rule.actions.forEach(action => {
        modifiedTrack = this['execute' + action.type](modifiedTrack, action.parameter, action.value)
      })
    }

    return modifiedTrack
  }

  checkRules (movie, rules) {
    let checkStatus = true
    rules.forEach(rule => {
      rule.conditions = rule.conditions.map(condition => {
        if (typeof condition.value === 'object') {
          condition.value = get(movie, condition.value.location + '.' + condition.value.path)
        }
        return condition
      })

      rule.actions = rule.actions.map(action => {
        if (typeof action.value === 'object') {
          action.value = get(movie, action.value.location + '.' + action.value.path)
        }
        return action
      })

      if (rule.type === 'track') {
        movie.tracks.forEach(track => {
          checkStatus = checkStatus && this.checkTrackRule(track, rule)
        })
      }
    })
    return checkStatus
  }

  checkTrackRule (track, rule) {
    let isConditionMatched = rule.conditions.reduce((accumulater, condition) => {
      return accumulater && this['match' + condition.matcher](get(track, condition.parameter), condition.value)
    }, true)

    let checkStatus = true

    if (isConditionMatched) {
      checkStatus = rule.actions.reduce((accumulater, action) => {
        return accumulater && this['check' + action.type](track, action.parameter, action.value)
      }, true)
    }
    return checkStatus
  }

  matchEql (actualVal, checkVal) {
    return actualVal === checkVal
  }

  matchNotEql (actualVal, checkVal) {
    return actualVal !== checkVal
  }

  executeSet (track, parameter, value) {
    return set(track, parameter, value)
  }

  checkSet (track, parameter, value) {
    return get(track, parameter) === value
  }

  executeRemove (track, parameter, value) {
    return set(track, 'isMuxed', false)
  }

  checkRemove (track, parameter, value) {
    return get(track, 'isMuxed') === false
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
