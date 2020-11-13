import { Application as ExpressFeathers } from '@feathersjs/express'

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {}
// The application instance type that will be used everywhere else
export type Application = ExpressFeathers<ServiceTypes>

interface MediaList {
  created: string[]
  updated: string[]
  removed: string[]
}

interface MovieInfo {
  imdbId: string
  tmdbId: number
  title: string
  originalTitle: string
  originalLanguage: string
  tagline: string
  plot: string
  outline: string
  runtime: number
  year: number
  releaseDate: string
  rating: number
  genres: Array<string>
  studios: Array<string>
  fanart: string
  poster: string
}

interface Movie extends MovieInfo {
  id: string
  filename: string
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
  dir: string
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
  imdbId?: string
  tmdbId?: number
  title: string
  originalTitle: string
  originalLanguage: string
  tagline?: string
  plot?: string
  outline?: string
  runtime?: number
  year: number
  releaseDate: string
  rating: number
  genres: Array<string>
  studios: Array<string>
  fanart?: string
  poster?: string
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
