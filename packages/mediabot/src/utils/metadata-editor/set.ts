import { get, set } from 'lodash'
import { ValidatorBuilder } from '.'
import * as TH from 'fp-ts/lib/These'

const applySet: ValidatorBuilder = (action) => (entry) =>
  get(entry, action.parameter) === action.value
    ? TH.right(entry)
    : TH.both(
        [
          {
            path: action.parameter,
            message: `set: value must match [actual: ${get(entry, action.parameter)}] [expected: ${action.value}]`,
          },
        ],
        set(entry, action.parameter, action.value)
      )

const applyRemove: ValidatorBuilder = (action) => (entry) =>
  get(entry, `${action.parameter}isMuxed`) === false
    ? TH.right(entry)
    : TH.both(
        [
          {
            path: `${action.parameter}.isMuxed`,
            message: `remove: value for 'isMuxed' must be false [actual: ${get(entry, `${action.parameter}isMuxed`)}]`,
          },
        ],
        set(entry, `${action.parameter}isMuxed`, false)
      )

export { applySet, applyRemove }
