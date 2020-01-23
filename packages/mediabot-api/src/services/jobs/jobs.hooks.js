
const parseJobData = require('../../hooks/jobs/parse-job-data')
const { disallow, keep, stashBefore } = require('feathers-hooks-common')
const runJob = require('../../hooks/jobs/run-job')

const checkJobStatus = require('../../hooks/jobs/check-job-status')

module.exports = {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      keep('name', 'args'),
      parseJobData()
    ],
    update: [disallow()],
    patch: [
      disallow('external'),
      stashBefore(),
      keep('status', 'progress', 'error'),
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
