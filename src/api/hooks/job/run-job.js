const { checkContext, getByDot } = require('feathers-hooks-common')

module.exports = function (options = {}) {
  return async context => {
    checkContext(context, 'after', ['patch'], 'run-job')

    if (context.params.runJob === true) {
      let result = getByDot(context, 'result')

      context.app.service(result.service)[result.function](...result.args)
        .then(() =>
          context.service.patch(context.id, { progress: 100, status: 'completed' }))
        .catch(error =>
          context.service.patch(context.id, { progress: 0, status: 'failed', error: error.toString() }))
    }

    return context
  }
}
