import { set, get } from 'lodash'
import { Track, Rule, safeTrackParameters, MovieInfo, Movie, RuleEntry, entryValue } from '../declarations'
import Log from '../logger'
const logger = new Log('MetadataEditor')

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
  '',
]

function checkEntry(track: Track, entries: RuleEntry[]): boolean {
  return entries.reduce<boolean>((accumulater, condition) => {
    if (typeof condition.value === 'object') {
      logger.warn('Skipping condition check: value must not be an object ')
      return accumulater
    }
    const key = 'check' + condition.type

    return isValidChecker(key) && validParameter(condition.parameter)
      ? accumulater && checkers[key](track, condition.parameter, condition.value)
      : accumulater
  }, true)
}

function checkTrackRule(track: Track, rule: Rule): boolean {
  if (checkEntry(track, rule.conditions)) {
    return checkEntry(track, rule.actions)
  } else {
    logger.verbose('Skipping rule: conditions did not match')
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
  if (!rules) return true
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
  if (checkEntry(track, rule.conditions)) {
    rule.actions.forEach((action) => {
      if (typeof action.value === 'object') {
        logger.warn('Skipping condition check: value must not be an object ')
        return true
      }
      const key = 'execute' + action.type
      if (isValidExecutor(key)) modifiedTrack = executors[key](modifiedTrack, action.parameter, action.value)
    })
  }

  return modifiedTrack
}

function executeRules(movie: Movie, rules: Rule[]): Movie {
  if (!rules) return movie

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

const checkers = {
  checkSet,
  checkRemove,
  checkEql,
  checkNotEql,
}

function checkSet(track: Track, parameter: string, value: entryValue): boolean {
  return validParameter(parameter) ? get(track, parameter) === value : true
}

function validParameter(parameter: string | undefined): parameter is string {
  if (parameter === undefined) {
    logger.warn(`Skipping check 'checkSet': requires '${parameter}' to exist`)
    return false
  } else if (!(safeTrackParameters as string[]).includes(parameter)) {
    logger.warn(`Skipping check 'checkSet': '${parameter}' is not valid`)
    return false
  } else {
    return true
  }
}

function checkRemove(track: Track, _parameter: string, _value: entryValue): boolean {
  return get(track, 'isMuxed') === false
}

function isValidChecker(key: string): key is keyof typeof checkers {
  return key in checkers
}

function checkEql(track: Track, parameter: string, value: entryValue): boolean {
  return get(track, parameter) === value
}

function checkNotEql(track: Track, parameter: string, value: entryValue): boolean {
  return get(track, parameter) !== value
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
  checkNotEql,
  checkEntry,
}
