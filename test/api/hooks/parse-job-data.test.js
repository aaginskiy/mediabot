/* global describe it beforeEach */
const chai = require('chai')

chai.use(require('chai-things'))
chai.use(require('chai-like'))
chai.use(require('chai-string'))
chai.use(require('sinon-chai'))
chai.use(require('chai-as-promised'))

const { expect } = chai
const { NotImplemented } = require('@feathersjs/errors')

const parseJobData = require('../../../src/api/hooks/job/parse-job-data')
const hook = parseJobData()

describe('\'parse-job-data\' hook', () => {
  beforeEach((done) => {
    this.mock = {
      type: 'before',
      method: 'create',
      data: {}
    }

    done()
  })

  it('should throw a NotImplemented error if command name is not valid', () => {
    this.mock.data = {
      name: 'InvalidCommand'
    }

    expect(() => hook(this.mock))
      .to.throw(NotImplemented)
  })

  it('should set job status', () => {
    this.mock.data = {
      name: 'RescanMovies'
    }

    expect(hook(this.mock).data)
      .to.have.property('status', 'queued')
  })

  describe('when command is \'RescanMovies\'', () => {
    beforeEach((done) => {
      this.mock.data = {
        name: 'RescanMovies'
      }

      done()
    })

    it('should set priority to high', () =>
      expect(hook(this.mock).data)
        .to.have.property('priority', 'high'))

    it('should set service to \'movies\'', () =>
      expect(hook(this.mock).data)
        .to.have.property('service', 'movies'))

    it('should set function to \'rescan\'', () =>
      expect(hook(this.mock).data)
        .to.have.property('function', 'rescan'))
  })

  describe('when command is \'MuxMovie\'', () => {
    beforeEach((done) => {
      this.mock.data = {
        name: 'MuxMovie'
      }

      done()
    })

    it('should set priority to high', () =>
      expect(hook(this.mock).data)
        .to.have.property('priority', 'normal'))

    it('should set service to \'movies\'', () =>
      expect(hook(this.mock).data)
        .to.have.property('service', 'movies'))

    it('should set function to \'mux\'', () =>
      expect(hook(this.mock).data)
        .to.have.property('function', 'mux'))
  })
})
