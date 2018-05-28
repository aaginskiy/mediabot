
const parseJobData = require('../../hooks/parse-job-data')
const { disallow } = require('feathers-hooks-common')
// const runJob = require('../../hooks/run-job')

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [parseJobData()],
    update: [disallow()],
    patch: [disallow('external'), parseJobData()],
    remove: []
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
}
