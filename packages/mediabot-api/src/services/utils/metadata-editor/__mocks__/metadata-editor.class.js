/* eslint-disable no-unused-vars */

class MetadataEditorMock {
  constructor(options) {
    this.options = options || {}
  }

  setup(app) {}

  executeRules(movie, rules) {}

  executeTrackRule(track, rule) {}

  checkRules(movie, rules) {
    return rules ? true : false
  }

  checkTrackRule(track, rule) {}

  matchEql(actualVal, checkVal) {}

  matchNotEql(actualVal, checkVal) {}

  matchNotUndefined(actualVal, checkVal) {}

  executeSet(track, parameter, value) {}

  checkSet(track, parameter, value) {}

  executeRemove(track, parameter, value) {}

  checkRemove(track, parameter, value) {}

  autoFixMetadata(filename, rules) {}
}

module.exports = function moduleExport(options) {
  return new MetadataEditorMock(options)
}

module.exports.Service = MetadataEditorMock
