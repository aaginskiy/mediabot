import fg from 'fast-glob'
import logger from '../logger'
import { difference, compact } from 'lodash'
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
import { RemoteMovieInfo } from '../declarations'
import xml2js from 'xml2js'

declare interface MediaList {
  created: string[]
  updated: string[]
  removed: string[]
}

declare interface Mediainfo {
  videoTag: string
  audioTag: string
  landscape?: string
  files: string[]
  fanart?: string
  poster?: string
  dir: string
  title: string
  filename: string
  tracks: Track[]
  nfo: string
}

declare interface Track {
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

/**ass DiskScanner
 * Scans directory recursively for any media files
 *
 * @since 0.2.0
 */
async function findAllMediaFiles(directory: string, existingFilenames: string[]): Promise<MediaList> {
  const globString = `${directory}/**/*.mkv`

  logger.info(`Loading movies from ${directory}.`, { label: 'DiskScanner' })
  const mediaOnDisk = await fg(globString)

  // Filter removed movies
  const removedFilenames = difference(existingFilenames, mediaOnDisk)

  logger.verbose('Found removed movies:', { label: 'DiskScannerService' })
  logger.verbose(removedFilenames.toString(), { label: 'DiskScannerService' })

  // Filter existing movies
  const updatedFilenames = existingFilenames.filter((filename) => mediaOnDisk.includes(filename))

  logger.verbose('Found existing movies:', { label: 'DiskScannerService' })
  logger.verbose(updatedFilenames.toString(), { label: 'DiskScannerService' })

  // Filter new movies
  const createdFilenames = difference(mediaOnDisk, updatedFilenames)

  logger.verbose('Found new movies:', { label: 'DiskScannerService' })
  logger.verbose(createdFilenames.toString(), { label: 'DiskScannerService' })

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
async function loadMediainfoFromFile(filename: string): Promise<Mediainfo> {
  logger.info('Loading requested movie metadata from the disk.', { label: 'DiskScanner' })
  logger.info(`Filename: ${filename}`, { label: 'DiskScanner' })

  if (!filename) throw new TypeError('Filename must be defined and not empty.')

  try {
    const escapedFilename = shellwords.escape(filename)

    const res = await exec(`mkvmerge -J ${escapedFilename}`)
    const stdout = JSON.parse(res.stdout)
    const mediaInfo = {} as Mediainfo

    mediaInfo.title = stdout.container?.properties?.title
    mediaInfo.filename = stdout.file_name
    mediaInfo.tracks = []

    // Cycle through tracks and add updates
    each(stdout.tracks, (track) => {
      const processedTrack = {} as Track

      processedTrack.title = track.properties?.track_name
      processedTrack.language = track.properties?.language
      processedTrack.number = track.id
      processedTrack.newNumber = processedTrack.number
      processedTrack.trackType = track.type
      processedTrack.codecType = track.codec
      processedTrack.isDefault = track.properties?.default_track
      processedTrack.isEnabled = track.properties?.enabled_track
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

    mediaInfo.dir = filePath.dir

    mediaInfo.files = await readdir(filePath.dir)

    if (mediaInfo.files.includes(filePath.name + '-poster.jpg')) {
      mediaInfo.poster = filePath.name + '-poster.jpg'
    } else if (mediaInfo.files.includes('poster.jpg')) {
      mediaInfo.fanart = 'poster.jpg'
    }

    if (mediaInfo.files.includes(filePath.name + '-fanart.jpg')) {
      mediaInfo.fanart = filePath.name + '-fanart.jpg'
    } else if (mediaInfo.files.includes('fanart.jpg')) {
      mediaInfo.fanart = 'fanart.jpg'
    }

    if (mediaInfo.files.includes(filePath.name + '.nfo')) {
      mediaInfo.nfo = filePath.name + '.nfo'
    }

    if (mediaInfo.files.includes(filePath.name + '-landscape.jpg'))
      mediaInfo.landscape = filePath.name + '-landscape.jpg'

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
    logger.error(`Unable to load media info for "${filename}".`, {
      label: 'DiskScannerService',
    })
    logger.error(error.message, {
      label: 'DiskScannerService',
    })
    throw error
  }
}

/**
 * Updates mkv file properties with data.  If id is present, filename is extracted from
 * that movie object.
 *
 * @memberof DiskScanner
 */
async function writeMediainfo(filename: string, mediainfo: Mediainfo): Promise<Mediainfo> {
  logger.info('Updating file media info without merging.', { label: 'DiskScanner' })
  logger.info(`Filename: ${filename}`, { label: 'DiskScanner' })

  const infoOptions = generateInfoOptions(mediainfo)

  return exec(`mkvpropedit -v ${shellwords.escape(filename)} ${infoOptions}`)
    .then(() => mediainfo)
    .catch((err) => {
      logger.error(err, { label: 'MediaFileService' })
      return Promise.reject(err)
    })
}

/**
 * Mux media file
 *
 * @memberof DiskScanner
 */
function muxMediaFile(filename: string, mediainfo: Mediainfo): EventEmitter {
  logger.info('Called MediaFile#mux with:', { label: 'DiskScanner' })

  const muxEvent = new EventEmitter()
  const command = generateMergeCommand(mediainfo)
  const bin = command.shift()
  if (!bin) {
    logger.warn('Missing command to merge', { label: 'DiskScanner' })
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
    logger.warn('Unable to connect to stdout of mkvmerge', { label: 'DiskScanner' })
  }

  updateEvent.on('exit', async (code: number) => {
    if (code === 1 || code === 0) {
      logger.verbose(`Backing up ${mediainfo.filename} to ${mediainfo.filename + 'bak'}.`, {
        label: 'DiskScanner',
      })

      try {
        await rename(mediainfo.filename, mediainfo.filename + 'bak')
        await rename(mediainfo.filename.slice(0, -3) + 'rmbtmp', mediainfo.filename)
        muxEvent.emit('done', `Received 'exit' message with code '${code}' from mkvmerge on '${mediainfo.filename}'`)
      } catch (error) {
        muxEvent.emit('error', mediainfo.filename)
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

function generateInfoOptions(mediainfo: Mediainfo): string {
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
      ['flag-enabled', track.isEnabled ? 1 : 0],
      ['flag-forced', track.isForced ? 1 : 0],
    ].forEach((field) => {
      command += ` --set "${field[0]}=${field[1]}"`
    })
  })

  return command
}

function generateMergeCommand(mediainfo: Mediainfo): Array<string> {
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

  commandObj.command.push(`"${mediainfo.filename}"`)
  commandObj.command.push('--title')
  commandObj.command.push(`"${mediainfo.title}"`)

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

    const imdbidIndex = findIndex(uniqueid, function(o) {
      return o.startsWith('tt')
    })

    const tmdbidIndex = findIndex(uniqueid, function(o) {
      return o.match(/^\d/)
    })

    nfo.id = uniqueid[imdbidIndex]
    nfo.tmdbId = parseInt(uniqueid[tmdbidIndex])

    return nfo
  } catch (error) {
    logger.error(`Unable to read nfo @ ${filename}`, {
      label: 'DiskScanner',
    })
    throw error
  }
}

export default {
  findAllMediaFiles,
  loadMediainfoFromFile,
  writeMediainfo,
  muxMediaFile,
  loadMetadataFromNfo,
}
