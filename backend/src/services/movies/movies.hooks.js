const { disallow, validateSchema } = require('feathers-hooks-common');
const logger = require('../../hooks/logger');

const Ajv = require('ajv');
const ajv = new Ajv({ allErrors: true, $data: true});

const createSchema = require('../../models/movies.schema.json');
// validateSchema(createSchema, Ajv)

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [validateSchema(createSchema, ajv)],
    update: [],
    patch: [],
    remove: [disallow('external')]
  },

  after: {
    all: [],
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
