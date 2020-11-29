import { Application as ExpressFeathers } from '@feathersjs/express'
import * as t from 'io-ts'

// A mapping of service names to types. Will be extended in service files.
export interface ServiceTypes {}
// The application instance type that will be used everywhere else
export type Application = ExpressFeathers<ServiceTypes>

type MovieJobName = 'refreshMovie'

interface JobRecord {
  id: string
  name: MovieJobName
  args: Array<any>
  status: 'queued' | 'running' | 'completed' | 'failed'
  progress: number
  movieId?: string
  error?: string
  statusMessage?: string
  createdAt?: Date
}

interface MediaList {
  created: string[]
  updated: string[]
  removed: string[]
}

interface MovieInfo {
  imdbId?: string
  tmdbId?: number
  title?: string
  originalTitle?: string
  originalLanguage?: string
  tagline?: string
  plot?: string
  outline?: string
  runtime?: number
  year?: number
  releaseDate?: string
  rating?: number
  genres?: Array<string>
  studios?: Array<string>
  fanart?: string
  poster?: string
}

interface Movie extends MovieInfo {
  id?: string
  filename: string
  dir?: string
  poster?: string
  fanart?: string
  fixed?: boolean
  fixErrors?: ValidationError[]
  mediaFiles?: MediaFile
  previewMediaFiles?: MediaFile
  createdAt?: Date
  updatedAt?: Date
  isRunning?: { [key in MovieJobName]?: string }
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

type entryValue = string | number | boolean | undefined
type validPath = ''

type locationTypeEmpty = ''
type locationTypeTrack = 'track'

type safeValuePath = 'title' | 'year' | 'imdbId' | 'tmdbId' | 'originalTitle' | 'originalLanguage'
