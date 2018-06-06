/* global describe it */
const chai = require('chai')

chai.use(require('chai-things'))
chai.use(require('chai-like'))
chai.use(require('chai-string'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))
// chai.use(require('dirty-chai'));

const { expect } = chai

const app = require('../../../src/api/app')
const JobService = app.service('job')

describe('\'Job\' service', () => {
  it('registered the service', () =>
    expect(app.service('job')).to.be.ok)

  describe('#run', () => {
    it('should throw an error if job status is not \'queued\'', () => {
      let jobData = {
        status: 'running'
      }

      return expect(JobService.run(0, jobData))
        .to.eventually.be.rejectedWith(TypeError, 'Job status is expected to be \'queued\'')
    })

    it('should throw an error if woerker status is not \'idle\'', () => {
      let jobData = {
        status: 'queued'
      }
      JobService.workers[0].status = 'running'
      console.log(JobService.workers)

      return expect(JobService.run(0, jobData))
        .to.eventually.be.rejectedWith(TypeError, 'Worker status is expected to be \'idle\'')
    })
  })
})
