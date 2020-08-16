import { cloneDeep } from 'lodash'
import { Movie } from '../../declarations'

const withNonEnSubtitlesFixed: Movie = {
  title: 'Captain Marvel 4K',
  filename: '/Movies/UHD/Captain Marvel (2019)/Captain.Marvel (2019).mkv',
  originalLanguage: 'eng',
  mediaFiles: {
    tracks: [
      {
        title: '',
        language: 'eng',
        number: 0,
        newNumber: 0,
        trackType: 'video',
        codecType: 'MPEG-H/HEVC/h.265',
        isDefault: true,
        isEnabled: true,
        isForced: false,
        isMuxed: true,
      },
      {
        title: 'TrueHD Atmos 7.1',
        language: 'eng',
        number: 1,
        newNumber: 1,
        trackType: 'audio',
        codecType: 'TrueHD Atmos',
        isDefault: true,
        isEnabled: true,
        isForced: false,
        isMuxed: true,
        audioChannels: 8,
      },
      {
        title: 'Commentary by Directors/Screenwriters Anna Boden/Ryan Fleck',
        language: 'fra',
        number: 3,
        newNumber: 3,
        trackType: 'audio',
        codecType: 'AC-3',
        isDefault: false,
        isEnabled: true,
        isForced: false,
        isMuxed: false,
        audioChannels: 2,
      },
    ],
  },
}

const withNonEnSubtitlesUnfixed = cloneDeep(withNonEnSubtitlesFixed)

withNonEnSubtitlesUnfixed.tracks[2].isMuxed = true

export default {
  withNonEnSubtitlesUnfixed,
  withNonEnSubtitlesFixed,
}
