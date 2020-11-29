import { Rule } from '../../../declarations'
import { assign, cloneDeep } from 'lodash'

const baseRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'eql',
      parameter: 'language',
      value: 'fra',
    },
  ],
  actions: [
    {
      type: 'remove',
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
