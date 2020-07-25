const { checkContext, getByDot } = require('feathers-hooks-common')
const EventEmitter = require('events')

module.exports = function(options = {}) {
  return async (context) => {
    checkContext(context, 'after', ['patch'], 'run-job')

    if (context.params.runJob === true) {
      let result = getByDot(context, 'result')
      console.log(result)
      let service = context.app.service(result.service)

      context.app.info(
        `Running Job #${context.id} - ${service}#${result.function} with ${result.args}`,
        { label: 'JobService' }
      )
      service[result.function](...result.args)
        .then((result) => {
          if (result instanceof EventEmitter) {
            result.on('finished', (val) => {
              context.service.patch(context.id, { progress: 100, status: 'completed' })
            })

            result.on('progress', (progress) => {
              console.log(progress)
              context.service.patch(context.id, { progress: progress })
            })

            result.on('error', (error) => {
              context.service.patch(context.id, {
                progress: 0,
                status: 'failed',
                error: error.toString(),
              })
            })
          } else {
            console.log('not emitter')
            context.service.patch(context.id, { progress: 100, status: 'completed' })
          }
        })
        .catch((error) =>
          context.service.patch(context.id, {
            progress: 0,
            status: 'failed',
            error: error.toString(),
          })
        )
    }

    return context
  }
}
