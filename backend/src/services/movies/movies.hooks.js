const { disallow, populate } = require('feathers-hooks-common');

const movieTracksSchema = {
  include: {
    service: 'tracks',
    nameAs: 'tracks',
    parentField: '_id',
    childField: 'movieId'
  }
};

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [disallow('external')],
    update: [],
    patch: [],
    remove: [disallow('external')]
  },

  after: {
    all: [populate({ schema: movieTracksSchema })],
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
