import { get } from 'lodash'
import { CheckerBuilder } from '.'
import * as E from 'fp-ts/lib/Either'

const checkEql: CheckerBuilder = (condition) => (mediaFile) =>
  get(mediaFile, condition.parameter) === condition.value
    ? E.right(mediaFile)
    : E.left([
        {
          path: condition.parameter,
          message: `eql: value must match [actual: ${get(mediaFile, condition.parameter)}] [expected: ${
            condition.value
          }]`,
        },
      ])

const checkNotEql: CheckerBuilder = (condition) => (mediaFile) =>
  get(mediaFile, condition.parameter) !== condition.value
    ? E.right(mediaFile)
    : E.left([
        {
          path: condition.parameter,
          message: `notEql: value must not match [actual: ${get(mediaFile, condition.parameter)}] [expected: ${
            condition.value
          }]`,
        },
      ])

export { checkEql, checkNotEql }
