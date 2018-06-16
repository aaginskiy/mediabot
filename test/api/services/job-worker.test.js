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
// const JobWorkerService = app.service('job-worker')

describe('\'Job Worker\' service', () => {
  it('registered the service', () =>
    expect(app.service('job-worker')).to.be.ok)
})
