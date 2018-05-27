const { disallow, validateSchema } = require('feathers-hooks-common');
const logger = require('../../hooks/logger');

const Ajv = require('ajv');
const createSchema = require('../../models/movies.schema.json');

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [validateSchema(createSchema, Ajv)],
    update: [],
    patch: [],
    remove: [disallow('external')]
  },

  after: {
    all: [logger()],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },

  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
};
