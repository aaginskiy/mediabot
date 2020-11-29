import { template, pick, isString, cloneDeep } from 'lodash'
import { Rule, MovieInfo, safeValuePath, MediaFile, ValidationError, RuleAction, RuleCondition } from '@/declarations'
import { checkEql, checkNotEql } from './eql'
import { applyRemove, applySet } from './set'
import * as t from 'io-ts'
import { getSemigroup, NonEmptyArray } from 'fp-ts/lib/NonEmptyArray'
import { sequence } from 'fp-ts/lib/Array'
import { pipe, pipeable } from 'fp-ts/lib/pipeable'
import * as TH from 'fp-ts/lib/These'
import * as E from 'fp-ts/lib/Either'

const validators = {
  set: applySet,
  remove: applyRemove,
}

const checkers = { eql: checkEql, notEql: checkNotEql }

const safeValuePath: safeValuePath[] = ['title', 'year', 'imdbId', 'tmdbId', 'originalTitle', 'originalLanguage']

const RuleConditionCodec = t.type({
  type: t.keyof(checkers),
  parameter: t.string,
  value: t.union([t.string, t.number, t.boolean]),
})

const RuleActionCodec = t.type({
  type: t.keyof(validators),
  parameter: t.string,
  value: t.union([t.string, t.number, t.boolean]),
})

const RuleCodec = t.type({
  type: t.keyof({ file: null, track: null }),
  conditions: t.array(RuleConditionCodec),
  actions: t.array(RuleActionCodec),
})

declare module '@/declarations' {
  export type RuleAction = t.TypeOf<typeof RuleActionCodec>
  export type RuleCondition = t.TypeOf<typeof RuleConditionCodec>
  export type Rule = t.TypeOf<typeof RuleCodec>
  export type Entry = Track | MediaFile
  export interface ValidationError {
    path: string
    message: string
  }
}
type ValidatedMediaFile = TH.These<NonEmptyArray<ValidationError>, MediaFile>
type Validator = (mediaFile: MediaFile) => ValidatedMediaFile
type ValidatorBuilder = (action: RuleAction) => Validator

type CheckedMediaFile = E.Either<NonEmptyArray<ValidationError>, MediaFile>
type Checker = (mediaFile: MediaFile) => CheckedMediaFile
type CheckerBuilder = (condition: RuleCondition) => Checker

export { RuleCodec, ValidatorBuilder, ValidationError, CheckerBuilder }

const { chain: theseChain } = pipeable(TH.getMonad(getSemigroup<ValidationError>()))

const makeValidator = (ruleEntry: RuleAction): Validator => validators[ruleEntry.type](ruleEntry)
const mapValidators = (ruleEntries: RuleAction[]): Validator[] => ruleEntries.map(makeValidator)

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const applyActions = (mediaFile: MediaFile, ruleEntries: RuleAction[]): ValidatedMediaFile =>
  mapValidators(ruleEntries).reduce<ValidatedMediaFile>(
    (prev, next) => pipe(prev, theseChain(next)),
    TH.right(mediaFile)
  )

const applicativeValidation = E.getValidation(getSemigroup<ValidationError>())

const makeChecker = (ruleEntry: RuleCondition): Checker => checkers[ruleEntry.type](ruleEntry)
const mapCheckers = (ruleEntries: RuleCondition[]): Checker[] => ruleEntries.map(makeChecker)

const checkConditions = (mediaFile: MediaFile, conditions: RuleCondition[]): CheckedMediaFile =>
  conditions.length
    ? pipe(
        sequence(applicativeValidation)(mapCheckers(conditions).map((afb) => afb(mediaFile))),
        E.map(() => mediaFile)
      )
    : E.left([{ path: '', message: 'conditions must not be empty' }])

const applyRuleToEntry = (movieInfo: MovieInfo, index?: number) => (rule: Rule) => (
  mediaFile: MediaFile
): ValidatedMediaFile =>
  pipe(
    checkConditions(mediaFile, rule.conditions.map(parseValue(movieInfo, index))),
    E.fold(
      () => TH.right(mediaFile),
      () => applyActions(mediaFile, rule.actions.map(parseValue(movieInfo, index)))
    )
  )

const makeRule = (movieInfo: MovieInfo) => (rule: Rule) => (mediaFile: MediaFile): ValidatedMediaFile => {
  if (rule.type === 'file') return applyRuleToEntry(movieInfo)(rule)(mediaFile)

  return mediaFile.tracks.reduce<ValidatedMediaFile>(
    (prev, _next, index) => pipe(prev, theseChain(applyRuleToEntry(movieInfo, index)(rule))),
    TH.right(mediaFile)
  )
}

const mapRules = (rules: Rule[], movieInfo: MovieInfo): Validator[] => rules.map(makeRule(movieInfo))

/**
 * Applies rules to Mediafile
 *
 * @since 0.2.0
 */
const applyRules = (mediaFile: MediaFile, rules: Rule[], movieInfo: MovieInfo): ValidatedMediaFile =>
  mapRules(cloneDeep(rules), pick(cloneDeep(movieInfo), safeValuePath)).reduce<ValidatedMediaFile>(
    (prev, next) => pipe(prev, theseChain(next)),
    TH.right(cloneDeep(mediaFile))
  )

const parseValue = (movieInfo: MovieInfo, index?: number) => <T extends RuleAction | RuleCondition>(entry: T): T => {
  const parsedEntry = cloneDeep(entry)
  if (typeof index === 'number') parsedEntry.parameter = `tracks[${index}].${parsedEntry.parameter}`
  if (isString(parsedEntry.value))
    parsedEntry.value = template(parsedEntry.value, { interpolate: /{{([\s\S]+?)}}/g })(movieInfo)
  return parsedEntry
}

export { applyRules, parseValue }
