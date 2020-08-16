import { Application as ExpressFeathers } from '@feathersjs/express'

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {}
// The application instance type that will be used everywhere else
export type Application = ExpressFeathers<ServiceTypes>

interface MovieInfo {
  title?: string
  year?: number
  imdbId?: string
  tmdbId?: string
  originalTitle?: string
  originalLanguage?: string
}

interface Movie extends MovieInfo {
  id?: string
  mediaFiles: Mediainfo
}

interface Mediainfo {
  videoTag?: string
  audioTag?: string
  landscape?: string
  files: string[]
  fanart?: string
  poster?: string
  title: string
  filename: string
  tracks: Track[]
  nfo?: string
}

interface Track {
  title: string
  language: string
  number: number
  newNumber: number
  trackType: string
  codecType: string
  audioChannels?: number
  bps?: number
  isDefault: boolean
  isEnabled: boolean
  isForced: boolean
  isMuxed: boolean
}

interface RemoteMovieInfo {
  id: string | null
  tmdbId: number | null
  title: string
  originalTitle: string
  originalLanguage: string
  tagline: string | null
  plot: string | null
  outline: string | null
  runtime: number | null
  year: number
  releaseDate: string
  rating: number
  genres: Array<string>
  studios: Array<string>
  fanart: string | null
  poster: string | null
}

interface Rule {
  type: 'track'
  conditions: Array<RuleEntry>
  actions: Array<RuleEntry>
}

type entryValue = string | number | boolean
type validPath = ''

type locationTypeEmpty = ''
type locationTypeTrack = 'track'

type safeValuePath = 'title' | 'year' | 'imdbId' | 'tmdbId' | 'originalTitle' | 'originalLanguage'

interface RuleEntry {
  type: string
  parameter: safeTrackParameters
  value: entryValue | { path: safeValuePath }
}

interface RuleEntryFlat {
  type: string
  parameter: safeTrackParameters
  value: entryValue
}

type safeTrackParameters = keyof Track | ''
