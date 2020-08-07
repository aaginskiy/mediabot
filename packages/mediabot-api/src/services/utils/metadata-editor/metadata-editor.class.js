/* eslint-disable no-unused-vars */
const set = require('lodash/set')
const get = require('lodash/get')
const map = require('lodash/map')
const assign = require('lodash/assign')

class Service {
  constructor(options) {
    this.options = options || {}
  }

  setup(app) {
    this.app = app
    this.DiskScannerService = app.service('utils/disk-scanner')
  }

  executeRules(movie, rules) {
    if (!rules || !Array.isArray(rules)) {
      logger.error('No rules provided to execute.', { label: 'MetadataEditorService' })
      return movie
    }

    rules.forEach((rule) => {
      rule.conditions = rule.conditions.map((condition) => {
        if (condition.value != undefined && typeof condition.value === 'object') {
          condition.value = get(movie, condition.value.location + '.' + condition.value.path)
        }
        return condition
      })

      rule.actions = rule.actions.map((action) => {
        if (typeof action.value === 'object') {
          action.value = get(movie, action.value.location + '.' + action.value.path)
        }
        return action
      })

      if (rule.type === 'track') {
        movie.tracks = movie.tracks.map((track) => {
          return this.executeTrackRule(track, rule)
        })
      }
    })
    return movie
  }

  executeTrackRule(track, rule) {
    let isConditionMatched = rule.conditions.reduce((accumulater, condition) => {
      return (
        accumulater &&
        this['match' + condition.matcher](get(track, condition.parameter), condition.value)
      )
    }, true)

    let modifiedTrack = track
    if (isConditionMatched) {
      rule.actions.forEach((action) => {
        modifiedTrack = this['execute' + action.type](modifiedTrack, action.parameter, action.value)
      })
    }

    return modifiedTrack
  }

  checkRules(movie, rules) {
    let checkStatus = true
    rules.forEach((rule) => {
      rule.conditions = rule.conditions.map((condition) => {
        if (typeof condition.value === 'object') {
          condition.value = get(movie, condition.value.location + '.' + condition.value.path)
        }
        return condition
      })

      rule.actions = rule.actions.map((action) => {
        if (typeof action.value === 'object') {
          action.value = get(movie, action.value.location + '.' + action.value.path)
        }
        return action
      })

      if (rule.type === 'track') {
        movie.tracks.forEach((track) => {
          checkStatus = checkStatus && this.checkTrackRule(track, rule)
        })
      }
    })
    return checkStatus
  }

  checkTrackRule(track, rule) {
    let isConditionMatched = rule.conditions.reduce((accumulater, condition) => {
      return (
        accumulater &&
        this['match' + condition.matcher](get(track, condition.parameter), condition.value)
      )
    }, true)

    let checkStatus = true

    if (isConditionMatched) {
      checkStatus = rule.actions.reduce((accumulater, action) => {
        return accumulater && this['check' + action.type](track, action.parameter, action.value)
      }, true)
    }
    return checkStatus
  }

  matchEql(actualVal, checkVal) {
    return actualVal === checkVal
  }

  matchNotEql(actualVal, checkVal) {
    return actualVal !== checkVal
  }

  matchNotUndefined(actualVal, checkVal) {
    return actualVal !== undefined
  }

  executeSet(track, parameter, value) {
    return set(track, parameter, value)
  }

  checkSet(track, parameter, value) {
    return get(track, parameter) === value
  }

  executeRemove(track, parameter, value) {
    return set(track, 'isMuxed', false)
  }

  checkRemove(track, parameter, value) {
    return get(track, 'isMuxed') === false
  }

  autoFixMetadata(filename, rules) {
    return this.DiskScannerService.loadMediainfoFromFile(filename).then((metadata) => {
      logger.debug(metadata)
      let executedMetadata = this.executeRules(metadata, rules)
      logger.debug(executedMetadata)
      return executedMetadata
    })
  }
}

module.exports = function moduleExport(options) {
  return new Service(options)
}

module.exports.Service = Service
