/* eslint-disable no-unused-vars */
const fixtureAvengersInfinityWarMediainfo = require('../../../../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mediainfo')
const fixtureAvengersInfinityWarNfo = require('../../../../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).info')

const { set } = require('lodash')

class DiskScannerMock {
  constructor(options) {
    this.options = options || {}
    this.fixtureAvengersInfinityWarMediainfo = fixtureAvengersInfinityWarMediainfo
    this.fixtureAvengersInfinityWarNfo = fixtureAvengersInfinityWarNfo
  }

  setup(app) {
    this.app = app
  }

  async findAllMediaFiles(directory, existingFilenames) {
    throw new Error('DiskScannerMock Error')
  }

  loadMediainfoFromFile(filename) {
    switch (filename) {
      case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv':
        return this.fixtureAvengersInfinityWarMediainfo
        break
      default:
        throw new Error('DiskScannerMock Error')
        break
    }
  }

  async loadMetadataFromNfo(filename) {
    switch (filename) {
      case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).nfo':
        return this.fixtureAvengersInfinityWarNfo
        break
      default:
        throw new Error('DiskScannerMock Error')
        break
    }
  }

  generateInfoCommand(data) {
    return data
  }

  generateMergeCommand(data) {
    return data
  }

  mux(id, data) {
    return id
  }

  __changeNfoMock(key, value) {
    set(this.fixtureAvengersInfinityWarNfo, key, value)
  }

  __resetNfoMock() {
    this.fixtureAvengersInfinityWarNfo = fixtureAvengersInfinityWarNfo
  }

  __changeMediainfoMock(key, value) {
    set(this.fixtureAvengersInfinityWarMediainfo, key, value)
  }

  __resetMediainfoMock() {
    this.fixtureAvengersInfinityWarMediainfo = fixtureAvengersInfinityWarMediainfo
  }
}

module.exports = function moduleExport(options) {
  return new DiskScannerMock(options)
}

module.exports.Service = DiskScannerMock
