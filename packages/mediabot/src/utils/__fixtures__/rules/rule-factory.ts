import { Rule } from '../../../declarations'
import { assign, cloneDeep } from 'lodash'

const baseRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'Eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'Eql',
      parameter: 'language',
      value: 'fra',
    },
  ],
  actions: [
    {
      type: 'Remove',
      parameter: '',
      value: '',
    },
  ],
}

export default class RuleFactory {
  static createRule(rule: Partial<Rule>): Rule {
    return assign(cloneDeep(baseRule), rule)
  }
}
