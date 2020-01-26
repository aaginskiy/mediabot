let tracks = {}
let rules = {}

tracks.frenchAudioTrack = {
  name: 'Track Name',
  type: 'audio',
  language: 'fra',
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
    value: 'fra'
  }],
  actions: [{
    type: 'Remove'
  }]
}

module.exports = { tracks, rules }
