const { Conflict } = require('@feathersjs/errors')
const { getByDot } = require('feathers-hooks-common')

module.exports = function (options = {}) {
  return async context => {
    if (getByDot(context, 'data.status') === 'running' && getByDot(context, 'params.before.status') === 'running') {
      throw new Conflict(`Job #${context.id} is already running`)
    }

    return context
  }
}
