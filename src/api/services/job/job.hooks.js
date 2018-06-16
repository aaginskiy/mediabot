
const parseJobData = require('../../hooks/job/parse-job-data')
const { disallow, keep, stashBefore } = require('feathers-hooks-common')
const runJob = require('../../hooks/job/run-job')

const checkJobStatus = require('../../hooks/job/check-job-status')

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      keep('name'),
      parseJobData()
    ],
    update: [disallow()],
    patch: [
      disallow('external'),
      stashBefore(),
      keep('status'),
      checkJobStatus()
    ],
    remove: []
  },

  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [runJob()],
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
