const { disallow } = require('feathers-hooks-common')
// const logger = require('../../hooks/logger')

// const Ajv = require('ajv')
// const ajv = new Ajv({ allErrors: true, $data: true})

// const createSchema = require('../../models/movies.schema.json')
// const checkMux = require('../../hooks/check-mux')

const updateMediaFile = require('../../hooks/update-media-file')

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [disallow('external')],
    remove: [disallow('external')],
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
}
