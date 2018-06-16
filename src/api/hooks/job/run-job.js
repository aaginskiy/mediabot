const { checkContext, getByDot } = require('feathers-hooks-common')

module.exports = function (options = {}) {
  return async context => {
    checkContext(context, 'after', ['patch'], 'run-job')

    let status = getByDot(context, 'result.status')

    if (status === 'running') {

    }

    return context
  }
}
