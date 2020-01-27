const { cloneDeep } = require('lodash')

let withNonEnSubtitlesFixed = {
  'title': 'Captain Marvel 4K',
  'filename': '/Movies/UHD/Captain Marvel (2019)/Captain.Marvel (2019).mkv',
  movieInfo: {
    originalLanguage: 'en'
  },
  'tracks': [{
    'language': 'en',
    'number': 0,
    'newNumber': 0,
    'type': 'video',
    'codecType': 'MPEG-H/HEVC/h.265',
    'isDefault': true,
    'isEnabled': true,
    'isForced': false,
    'isMuxed': true
  },
  {
    'name': 'TrueHD Atmos 7.1',
    'language': 'en',
    'number': 1,
    'newNumber': 1,
    'type': 'audio',
    'codecType': 'TrueHD Atmos',
    'isDefault': true,
    'isEnabled': true,
    'isForced': false,
    'isMuxed': true,
    'audioChannels': 8
  },
  {
    'name': 'Commentary by Directors/Screenwriters Anna Boden/Ryan Fleck',
    'language': 'fr',
    'number': 3,
    'newNumber': 3,
    'type': 'audio',
    'codecType': 'AC-3',
    'isDefault': false,
    'isEnabled': true,
    'isForced': false,
    'isMuxed': false,
    'audioChannels': 2
  }
  ]
}

let withNonEnSubtitlesUnfixed = cloneDeep(withNonEnSubtitlesFixed)

withNonEnSubtitlesUnfixed.tracks[2].isMuxed = true

module.exports = {
  withNonEnSubtitlesUnfixed,
  withNonEnSubtitlesFixed
}
