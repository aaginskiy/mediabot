/* global describe it beforeEach expect */
const { NotImplemented } = require('@feathersjs/errors')

const parseJobData = require('../parse-job-data')
const hook = parseJobData()

describe("'parse-job-data' hook", () => {
  beforeEach((done) => {
    this.mock = {
      type: 'before',
      method: 'create',
      data: {},
    }

    done()
  })

  it('should throw a NotImplemented error if command name is not valid', () => {
    this.mock.data = {
      name: 'InvalidCommand',
    }

    expect(() => hook(this.mock)).toThrow(NotImplemented)
  })

  it('should set job status', () => {
    this.mock.data = {
      name: 'ScanMediaLibrary',
    }

    expect(hook(this.mock).data).toHaveProperty('status', 'queued')
  })

  describe("when command is 'ScanMediaLibrary'", () => {
    beforeEach((done) => {
      this.mock.data = {
        name: 'ScanMediaLibrary',
      }

      done()
    })

    it('should set priority to high', () =>
      expect(hook(this.mock).data).toHaveProperty('priority', 'high'))

    it("should set service to 'movies'", () =>
      expect(hook(this.mock).data).toHaveProperty('service', 'disk-scanner'))

    it("should set function to 'rescan'", () =>
      expect(hook(this.mock).data).toHaveProperty('function', 'scanMediaLibrary'))
  })

  describe.skip("when command is 'MuxMovie'", () => {
    beforeEach((done) => {
      this.mock.data = {
        name: 'MuxMovie',
      }

      done()
    })

    it('should set priority to normal', () =>
      expect(hook(this.mock).data).toHaveProperty('priority', 'normal'))

    it("should set service to 'movies'", () =>
      expect(hook(this.mock).data).toHaveProperty('service', 'movies'))

    it("should set function to 'mux'", () =>
      expect(hook(this.mock).data).toHaveProperty('function', 'mux'))
  })

  describe("when command is 'RefreshAllMediainfo'", () => {
    beforeEach((done) => {
      this.mock.data = {
        name: 'AutoScrapeMovie',
      }

      done()
    })

    it('should set priority to high', () =>
      expect(hook(this.mock).data).toHaveProperty('priority', 'high'))

    it("should set service to 'media-scraper'", () =>
      expect(hook(this.mock).data).toHaveProperty('service', 'media-scraper'))

    it("should set function to 'autoScrapeMovie'", () =>
      expect(hook(this.mock).data).toHaveProperty('function', 'autoScrapeMovie'))
  })
})
