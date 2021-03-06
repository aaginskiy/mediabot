import fg from 'fast-glob'
import { Log } from '@/utils'
const logger = new Log('DiskScanner')
import { difference, compact, get } from 'lodash'
import shellwords from 'shellwords-ts'
import childProcess from 'child_process'
import { EventEmitter } from 'events'
import util from 'util'
const exec = util.promisify(childProcess.exec)
import { each, filter, sortBy, findIndex } from 'lodash'
import path from 'path'
import fs from 'fs'
const readdir = util.promisify(fs.readdir)
const rename = util.promisify(fs.rename)
const readFile = util.promisify(fs.readFile)
import { RemoteMovieInfo, MediaFile, MediaList, Track } from '../declarations'
import xml2js from 'xml2js'
import { capitalCase } from 'change-case'
import * as t from 'io-ts'

const TrackCodec = t.intersection([
  t.type({
    codecType: t.string,
    isDefault: t.boolean,
    isForced: t.boolean,
    isMuxed: t.boolean,
    language: t.string,
    newNumber: t.number,
    number: t.number,
    title: t.string,
    trackType: t.string,
  }),
  t.partial({
    audioChannels: t.number,
    bps: t.number,
  }),
])

const MediaFileCodec = t.type({
  audioTag: t.string,
  dir: t.string,
  filename: t.string,
  files: t.array(t.string),
  art: t.partial({
    poster: t.string,
    fanart: t.string,
    landscape: t.string,
  }),
  nfo: t.string,
  title: t.string,
  tracks: t.array(TrackCodec),
  videoTag: t.string,
})

const SafeTrackActionParametersCodec = t.keyof({
  codecType: null,
  isDefault: null,
  isForced: null,
  isMuxed: null,
  language: null,
  title: null,
  '': null,
})

declare module '@/declarations' {
  export type Track = t.TypeOf<typeof TrackCodec>
  export type MediaFile = t.TypeOf<typeof MediaFileCodec>
  export type SafeTrackActionParameters = t.TypeOf<typeof SafeTrackActionParametersCodec>
}

export { TrackCodec, MediaFileCodec, SafeTrackActionParametersCodec }

/**
 * Parse filename for movie title and year
 *
 * @since 0.2.0
 */
function parseFilename(filename: string): { title?: string; year?: number } {
  let title: string | undefined, year: number | undefined

  const folderName = path
    .dirname(filename)
    .split(path.sep)
    .pop()

  if (folderName) {
    const reTitle = /^(?<title>.*)\((?<year>(19|20)\d{2})\)$/i
    const reArticle = /^(?<title>.*),\s+(?<article>(the|a|an))$/i
    const matchTitle = reTitle.exec(folderName)

    year = matchTitle?.groups?.year ? parseInt(matchTitle?.groups?.year) : undefined
    const intermediateTile = matchTitle?.groups?.title?.replace(/\./gi, ' ')?.trim()
    if (intermediateTile) {
      const matchArticle = reArticle.exec(intermediateTile)
      title = matchArticle ? matchArticle.groups?.article + ' ' + matchArticle.groups?.title : intermediateTile
      title = title ? capitalCase(title) : title
    }
  } else {
    title = undefined
    year = undefined
  }
  return {
    title,
    year,
  }
}

/**
 * Scans directory recursively for any media files
 *
 * @since 0.2.0
 */
async function findAllMediaFiles(directory: string, existingFilenames: string[]): Promise<MediaList> {
  const globString = `${directory}/**/*.mkv`

  logger.info(`Loading movies from ${directory}.`)
  const mediaOnDisk = await fg(globString)

  // Filter removed movies
  const removedFilenames = difference(existingFilenames, mediaOnDisk)

  logger.verbose('Found removed movies:')
  logger.verbose(removedFilenames.toString())

  // Filter existing movies
  const updatedFilenames = existingFilenames.filter((filename) => mediaOnDisk.includes(filename))

  logger.verbose('Found existing movies:')
  logger.verbose(updatedFilenames.toString())

  // Filter new movies
  const createdFilenames = difference(mediaOnDisk, updatedFilenames)

  logger.verbose('Found new movies:')
  logger.verbose(createdFilenames.toString())

  return {
    created: compact(createdFilenames),
    updated: compact(updatedFilenames),
    removed: compact(removedFilenames),
  }
}

/**
 * Loads media metadata, artwork and directory files from disk.
 *
 * @since 0.2.0
 */
async function loadMediainfoFromFile(filename: string): Promise<MediaFile> {
  logger.info('Loading requested movie metadata from the disk.')
  logger.info(`Filename: ${filename}`)

  if (!filename) throw new TypeError('Filename must be defined and not empty.')

  try {
    const escapedFilename = shellwords.escape(filename)

    const res = await exec(`mkvmerge -J ${escapedFilename}`)
    const stdout = JSON.parse(res.stdout)
    const mediaInfo = {} as MediaFile

    mediaInfo.title = stdout.container?.properties?.title
    mediaInfo.filename = stdout.file_name
    mediaInfo.dir = path.dirname(mediaInfo.filename)
    mediaInfo.tracks = []
    mediaInfo.art = {}

    // Cycle through tracks and add updates
    each(stdout.tracks, (track) => {
      const processedTrack = {} as Track

      processedTrack.title = get(track, 'properties.track_name', '')
      processedTrack.language = track.properties?.language
      processedTrack.number = track.id
      processedTrack.newNumber = processedTrack.number
      processedTrack.trackType = track.type
      processedTrack.codecType = track.codec
      processedTrack.isDefault = track.properties?.default_track
      processedTrack.isForced = track.properties?.forced_track
      processedTrack.isMuxed = true

      // Additional parameters for audio tracks
      if (processedTrack.trackType === 'audio') {
        processedTrack.audioChannels = track.properties?.audio_channels
        processedTrack.bps = track.properties?.tag_bps
      }

      mediaInfo.tracks.push(processedTrack)
    })

    const filePath = path.parse(filename)

    mediaInfo.files = await readdir(filePath.dir)

    if (mediaInfo.files.includes(filePath.name + '-poster.jpg')) {
      mediaInfo.art.poster = filePath.name + '-poster.jpg'
    } else if (mediaInfo.files.includes('poster.jpg')) {
      mediaInfo.art.poster = 'poster.jpg'
    }

    if (mediaInfo.files.includes(filePath.name + '-fanart.jpg')) {
      mediaInfo.art.fanart = filePath.name + '-fanart.jpg'
    } else if (mediaInfo.files.includes('fanart.jpg')) {
      mediaInfo.art.fanart = 'fanart.jpg'
    }

    if (mediaInfo.files.includes(filePath.name + '.nfo')) {
      mediaInfo.nfo = filePath.name + '.nfo'
    }

    if (mediaInfo.files.includes(filePath.name + '-landscape.jpg'))
      mediaInfo.art.landscape = filePath.name + '-landscape.jpg'

    const defaultVideoTracks = filter(mediaInfo.tracks, {
      trackType: 'video',
      isDefault: true,
    })
    const defaultAudioTracks = filter(mediaInfo.tracks, {
      trackType: 'audio',
      isDefault: true,
    })

    if (defaultVideoTracks[0]) mediaInfo.videoTag = legibleTag(defaultVideoTracks[0].codecType)
    if (defaultAudioTracks[0])
      mediaInfo.audioTag = `${legibleTag(defaultAudioTracks[0].codecType)} ${defaultAudioTracks[0].audioChannels}ch`

    return mediaInfo
  } catch (error) {
    logger.error(`Unable to load media info for "${filename}".`)
    logger.error(error.message)
    throw error
  }
}

/**
 * Updates mkv file properties with data.  If id is present, filename is extracted from
 * that movie object.
 *
 * @memberof DiskScanner
 */
async function writeMediainfo(filename: string, mediainfo: MediaFile): Promise<MediaFile> {
  logger.info('Updating file media info without merging.')
  logger.info(`Filename: ${filename}`)

  const infoOptions = generateInfoOptions(mediainfo)

  return exec(`mkvpropedit -v ${shellwords.escape(filename)} ${infoOptions}`)
    .then(() => mediainfo)
    .catch((err) => {
      logger.error(err)
      return Promise.reject(err)
    })
}

/**
 * Mux media file
 *
 * @memberof DiskScanner
 */
function muxMediaFile(filename: string, mediainfo: MediaFile): EventEmitter {
  logger.info('Called MediaFile#mux with:')

  const muxEvent = new EventEmitter()
  const command = generateMergeCommand(mediainfo)
  const bin = command.shift()
  logger.info(command.toString())
  if (!bin) {
    logger.warn('Missing command to merge')
    muxEvent.emit('error', 'Missing command to merge')
    return muxEvent
  }

  const updateEvent: childProcess.ChildProcess = childProcess.spawn(bin, command, { shell: true })

  if (updateEvent.stdout) {
    updateEvent.stdout.on('data', (res) => {
      const result = /(.*): (.*)/.exec(res.toString())
      if (result && result[1] === 'Progress') {
        muxEvent.emit('progress', parseInt(result[2].slice(0, -1)))
      }
    })
  } else {
    logger.warn('Unable to connect to stdout of mkvmerge')
  }

  updateEvent.on('exit', async (code: number) => {
    if (code === 1 || code === 0) {
      logger.verbose(`Backing up ${mediainfo.filename} to ${mediainfo.filename + 'bak'}.`)

      try {
        await rename(mediainfo.filename, mediainfo.filename + 'bak')
        await rename(mediainfo.filename.slice(0, -3) + 'rmbtmp', mediainfo.filename)
        muxEvent.emit('done', `Received 'exit' message with code '${code}' from mkvmerge on '${mediainfo.filename}'`)
      } catch (error) {
        muxEvent.emit('error', error)
      }
    } else {
      const e = new Error(`Received 'exit' message with code '${code}' from mkvmerge on '${mediainfo.filename}'`)
      muxEvent.emit('error', e)
    }
  })

  updateEvent.on('error', (error) => muxEvent.emit('error', error))

  return muxEvent
}

function legibleTag(tag: string): string {
  let legibleTag

  switch (tag) {
    default:
      legibleTag = tag
  }

  return legibleTag
}

function generateInfoOptions(mediainfo: MediaFile): string {
  let command = `--edit info --set "title=${mediainfo.title}"`

  if (!mediainfo.tracks) return command

  mediainfo.tracks.forEach((track) => {
    command += ` --edit track:${track.number + 1}`
    ;[
      ['name', track.title],
      ['language', track.language],
    ].forEach((field) => {
      if (field[1]) {
        command += ` --set "${field[0]}=${field[1]}"`
      } else {
        command += ` --delete ${field[0]}`
      }
    })
    ;[
      ['flag-default', track.isDefault ? 1 : 0],
      ['flag-forced', track.isForced ? 1 : 0],
    ].forEach((field) => {
      command += ` --set "${field[0]}=${field[1]}"`
    })
  })

  return command
}

function generateMergeCommand(mediainfo: MediaFile): Array<string> {
  const base = path.basename(mediainfo.filename, '.mkv')
  const dir = path.dirname(mediainfo.filename)

  const commandObj = {
    audioMerge: false,
    videoMerge: false,
    subtitlesMerge: false,
    audioNumber: '',
    videoNumber: '',
    subtitlesNumber: '',
    trackOrder: '',
    command: ['mkvmerge', '--output', `"${dir}/${base}.rmbtmp"`],
  }

  sortBy(mediainfo.tracks, 'newNumber').forEach((track) => {
    if (track.isMuxed) {
      switch (track.trackType) {
        case 'audio':
          commandObj['audioMerge'] = true
          commandObj['audioNumber'] += `${track.number},`
          break
        case 'video':
          commandObj['videoMerge'] = true
          commandObj['videoNumber'] += `${track.number},`
          break
        case 'subtitles':
          commandObj['subtitlesMerge'] = true
          commandObj['subtitlesNumber'] += `${track.number},`
          break
      }
      commandObj.trackOrder += `0:${track.number},`
    }
  })

  if (commandObj.videoMerge) {
    commandObj.command.push('-d')
    commandObj.command.push(`${commandObj.videoNumber.slice(0, -1)}`)
  } else {
    commandObj.command.push('-D')
  }

  if (commandObj.audioMerge) {
    commandObj.command.push('-a')
    commandObj.command.push(`${commandObj.audioNumber.slice(0, -1)}`)
  } else {
    commandObj.command.push('-A')
  }

  if (commandObj.subtitlesMerge) {
    commandObj.command.push('-s')
    commandObj.command.push(`${commandObj.subtitlesNumber.slice(0, -1)}`)
  } else {
    commandObj.command.push('-S')
  }

  // Remove attachments
  // TODO: make configurable
  commandObj.command.push('-M')

  sortBy(mediainfo.tracks, 'number').forEach((track) => {
    commandObj.command.push('--language')
    commandObj.command.push(`${track.number}:${track.language}`)

    if (typeof track.title !== 'undefined') {
      commandObj.command.push('--track-name')
      commandObj.command.push(`'${track.number}:${track.title}'`)
    }

    commandObj.command.push('--default-track')
    commandObj.command.push(`${track.number}:${track.isDefault ? 'yes' : 'no'}`)

    // commandObj.command.push('--enabled-track')
    // commandObj.command.push(`${track.number}:${track.isEnabled ? 'yes' : 'no'}`)

    commandObj.command.push('--forced-track')
    commandObj.command.push(`${track.number}:${track.isForced ? 'yes' : 'no'}`)
  })

  commandObj.command.push(`"${mediainfo.filename}"`)

  if (typeof mediainfo.title !== 'undefined') {
    commandObj.command.push('--title')
    commandObj.command.push(`"${mediainfo.title}"`)
  }

  commandObj.command.push('--track-order')

  commandObj.command.push(commandObj.trackOrder.slice(0, -1))

  return commandObj.command
}

/**
 * DiskScannerService#_loadMetadataFromNfo
 *
 * Loads media metadata from local nfo file
 *
 * @since 0.2.0
 * @memberof DiskScannerService
 * @param {String} filename Filename of the nfo file to load.
 * @returns Promise Promise to resolve metadata from nfo.
 */
async function loadMetadataFromNfo(filename: string): Promise<RemoteMovieInfo> {
  try {
    const xml = await readFile(filename)
    const xml2nfo = await new xml2js.Parser({
      explicitArray: false,
      ignoreAttrs: true,
    }).parseStringPromise(xml)

    const uniqueid = xml2nfo.movie.uniqueid

    const nfo: RemoteMovieInfo = {} as RemoteMovieInfo

    nfo.title = xml2nfo.movie.title
    nfo.originalTitle = xml2nfo.movie.originalTitle
    nfo.originalLanguage = xml2nfo.movie.originalLanguage
    nfo.tagline = xml2nfo.movie.tagline
    nfo.plot = xml2nfo.movie.plot
    nfo.outline = xml2nfo.movie.outline
    nfo.runtime = parseInt(xml2nfo.movie.runtime)
    nfo.year = parseInt(xml2nfo.movie.year)
    nfo.rating = parseFloat(xml2nfo.movie.rating)
    nfo.releaseDate = xml2nfo.movie.releaseDate
    if (Array.isArray(xml2nfo.movie.genres)) {
      nfo.genres = xml2nfo.movie.genres
    } else {
      nfo.genres = [xml2nfo.movie.genres]
    }

    if (Array.isArray(xml2nfo.movie.studios)) {
      nfo.studios = xml2nfo.movie.studios
    } else {
      nfo.studios = [xml2nfo.movie.studios]
    }

    nfo.fanart = xml2nfo.movie.fanart
    nfo.poster = xml2nfo.movie.poster

    const imdbidIndex = findIndex(uniqueid, function(o: string) {
      return o.startsWith('tt')
    })

    const tmdbidIndex = findIndex(uniqueid, function(o: string) {
      return !!o.match(/^\d/)
    })

    nfo.imdbId = uniqueid[imdbidIndex]
    nfo.tmdbId = parseInt(uniqueid[tmdbidIndex])

    return nfo
  } catch (error) {
    logger.error(`Unable to read nfo @ ${filename}`)
    throw error
  }
}

export { findAllMediaFiles, loadMediainfoFromFile, writeMediainfo, muxMediaFile, loadMetadataFromNfo, parseFilename }
