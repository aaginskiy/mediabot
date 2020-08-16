import { set, get } from 'lodash'
import { Track, Rule, safeTrackParameters, MovieInfo, Movie, RuleEntry, entryValue } from '../declarations'
import logger from '../logger'

const safeTrackParameters: safeTrackParameters[] = [
  'title',
  'language',
  'trackType',
  'codecType',
  'audioChannels',
  'bps',
  'isDefault',
  'isEnabled',
  'isForced',
  'isMuxed',
]

function checkCondition(track: Track, rule: Rule): boolean {
  return rule.conditions.reduce<boolean>((accumulater, condition) => {
    if (typeof condition.value === 'object') {
      logger.warn('Skipping condition check: value must not be an object ', {
        label: 'MetadataEditor',
      })
      return accumulater
    }
    const key = 'match' + condition.type

    return isValidMatcher(key) && validParameter(condition.parameter)
      ? accumulater && matchers[key](get(track, condition.parameter), condition.value)
      : accumulater
  }, true)
}

function checkTrackRule(track: Track, rule: Rule): boolean {
  if (checkCondition(track, rule)) {
    return rule.actions.reduce<boolean>((accumulater, action) => {
      if (typeof action.value === 'object') {
        logger.warn('Skipping condition check: value must not be an object ', {
          label: 'MetadataEditor',
        })
        return accumulater
      }
      const key = 'check' + action.type
      return isValidChecker(key) ? accumulater && checkers[key](track, action.parameter, action.value) : accumulater
    }, true)
  } else {
    logger.verbose('Skipping rule: conditions did not match', {
      label: 'MetadataEditor',
    })
    return true
  }
}

function buildValue(entries: RuleEntry[], movie: MovieInfo): RuleEntry[] {
  return entries.map((entry) => {
    if (typeof entry.value === 'object') {
      entry.value = get(movie, entry.value.path)
    }
    return entry
  })
}

function checkRules(movie: Movie, rules: Rule[]): boolean {
  let checkStatus = true
  rules.forEach((rule) => {
    rule.conditions = buildValue(rule.conditions, movie)
    rule.actions = buildValue(rule.actions, movie)

    if (rule.type === 'track') {
      movie.mediaFiles.tracks.forEach((track) => {
        checkStatus = checkStatus && checkTrackRule(track, rule)
      })
    }
  })
  return checkStatus
}

function executeTrackRule(track: Track, rule: Rule): Track {
  let modifiedTrack = track
  if (checkCondition(track, rule)) {
    rule.actions.forEach((action) => {
      if (typeof action.value === 'object') {
        logger.warn('Skipping condition check: value must not be an object ', {
          label: 'MetadataEditor',
        })
        return true
      }
      const key = 'execute' + action.type
      if (isValidExecutor(key)) modifiedTrack = executors[key](modifiedTrack, action.parameter, action.value)
    })
  }

  return modifiedTrack
}

function executeRules(movie: Movie, rules: Rule[]): Movie {
  rules.forEach((rule) => {
    rule.conditions = buildValue(rule.conditions, movie)

    rule.actions = buildValue(rule.actions, movie)

    if (rule.type === 'track') {
      movie.mediaFiles.tracks = movie.mediaFiles.tracks.map((track) => {
        return executeTrackRule(track, rule)
      })
    }
  })
  return movie
}

/** Checkers */
const checkers = {
  checkSet,
  checkRemove,
}

function checkSet(track: Track, parameter: string | undefined, value: entryValue): boolean {
  return validParameter(parameter) ? get(track, parameter) === value : true
}

function validParameter(parameter: string | undefined): parameter is string {
  if (parameter === undefined) {
    logger.warn(`Skipping check 'checkSet': requires '${parameter}' to exist`, {
      label: 'MetadataEditor',
    })
    return false
  } else if (!(safeTrackParameters as string[]).includes(parameter)) {
    logger.warn(`Skipping check 'checkSet': '${parameter}' is not valid`, {
      label: 'MetadataEditor',
    })
    return false
  } else {
    return true
  }
}

function checkRemove(track: Track, _parameter: string | undefined, _value: entryValue): boolean {
  return get(track, 'isMuxed') === false
}

function isValidChecker(key: string): key is keyof typeof checkers {
  return key in checkers
}

/** Matchers */
const matchers = {
  matchEql,
  matchNotEql,
}

function matchEql(
  actualVal: string | number | boolean | undefined,
  checkVal: string | number | boolean | undefined
): boolean {
  return actualVal === checkVal
}

function matchNotEql(
  actualVal: string | number | boolean | undefined,
  checkVal: string | number | boolean | undefined
): boolean {
  return actualVal !== checkVal
}

function isValidMatcher(key: string): key is keyof typeof matchers {
  if (key in matchers) {
    return true
  } else {
    logger.warn(`Skipping check: condition matcher '${key}' does not exist`, {
      label: 'MetadataEditor',
    })
    return false
  }
}

/** Executors */
const executors = {
  executeSet,
  executeRemove,
}

function executeSet(track: Track, parameter: string, value: entryValue): Track {
  return set(track, parameter, value)
}

function executeRemove(track: Track, _parameter?: string, _value?: entryValue): Track {
  return set(track, 'isMuxed', false)
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function isValidExecutor(key: string): key is keyof typeof executors {
  return key in executors
}

export default {
  checkTrackRule,
  checkRules,
  executeTrackRule,
  executeRules,
}
