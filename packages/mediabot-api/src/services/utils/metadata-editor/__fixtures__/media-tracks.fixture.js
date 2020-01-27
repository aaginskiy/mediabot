let tracks = {}
let rules = {}

tracks.frenchAudioTrack = {
  name: 'Track Name',
  type: 'audio',
  language: 'fr',
  isDefault: true,
  isEnabled: true,
  isForced: true,
  isMuxed: true
}

rules.removeFrenchAudio = {
  type: 'track',
  conditions: [{
    matcher: 'Eql',
    parameter: 'type',
    value: 'audio'
  }, {
    matcher: 'Eql',
    parameter: 'language',
    value: 'fr'
  }],
  actions: [{
    type: 'Remove'
  }]
}

rules.removeNonEnAudio = {
  type: 'track',
  conditions: [{
    matcher: 'Eql',
    parameter: 'type',
    value: 'audio'
  }, {
    matcher: 'NotEql',
    parameter: 'language',
    value: 'en'
  }],
  actions: [{
    type: 'Remove'
  }]
}

rules.removeNonOriginalLanguageAudio = {
  type: 'track',
  conditions: [{
    matcher: 'Eql',
    parameter: 'type',
    value: 'audio'
  }, {
    matcher: 'NotEql',
    parameter: 'language',
    value: {
      location: 'movieInfo',
      path: 'originalLanguage'
    }
  }],
  actions: [{
    type: 'Remove'
  }]
}

rules.changeNonOriginalLanguageAudio = {
  type: 'track',
  conditions: [{
    matcher: 'Eql',
    parameter: 'type',
    value: 'audio'
  }],
  actions: [{
    type: 'Set',
    parameter: 'language',
    value: {
      location: 'movieInfo',
      path: 'originalLanguage'
    }
  }]
}

module.exports = { tracks, rules }
