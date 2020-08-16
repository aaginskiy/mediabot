import { Track } from '../../../declarations'
import { assign, cloneDeep } from 'lodash'

const baseTrack: Track = {
  codecType: 'DTS',
  isDefault: true,
  isEnabled: true,
  isForced: true,
  isMuxed: true,
  language: 'fra',
  newNumber: 1,
  number: 1,
  title: 'Track Name',
  trackType: 'audio',
}

export default class TrackFactory {
  static createTrack(track: Partial<Track>): Track {
    return assign(cloneDeep(baseTrack), track)
  }
}
