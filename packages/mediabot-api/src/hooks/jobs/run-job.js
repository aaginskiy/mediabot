const { checkContext, getByDot } = require('feathers-hooks-common')

module.exports = function (options = {}) {
  return async context => {
    checkContext(context, 'after', ['patch'], 'run-job')

    if (context.params.runJob === true) {
      let result = getByDot(context, 'result')

      let service = context.app.service(result.service)

      context.app.info(`Running Job #${context.id} - ${service.options.name}#${result.function} with ${result.args}`, { label: 'JobService' })
      service[result.function](...result.args)
        .then(() =>
          context.service.patch(context.id, { progress: 100, status: 'completed' }))
        .catch(error =>
          context.service.patch(context.id, { progress: 0, status: 'failed', error: error.toString() }))
    }

    return context
  }
}
