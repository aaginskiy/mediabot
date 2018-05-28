const { checkContext } = require('feathers-hooks-common')
const { pick } = require('lodash')
const { NotImplemented } = require('@feathersjs/errors')

// const VALID_EXTERNAL_COMMANDS = ['RescanMovies']
// const JOB_STATUS = ['queued', 'running', 'completed', 'failed']
// const JOB_PRIORITIES = ['low', 'normal', 'high']

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return context => {
    checkContext(context, 'before', ['create', 'patch'], 'parseJobData')

    let data

    if (context.method === 'create') {
      data = pick(context.data, ['name'])

      data.status = 'queued'

      switch (data.name) {
        case 'RescanMovies':
          data.priority = 'high'
          data.service = 'movies'
          data.function = 'rescan'
          break
        case 'MuxMovie':
          data.priority = 'normal'
          data.service = 'movies'
          data.function = 'mux'
          break
        default:
          throw new NotImplemented(`Command '${data.name}' is not implemented.`)
      }
    } else if (context.method === 'patch') {
      data = pick(context.data, ['status'])
    }

    context.data = data

    return context
  }
}
