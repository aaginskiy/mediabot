/* eslint-disable no-unused-vars */
const util = require('util')
const childProcess = require('child_process')
const glob = require('glob-promise')
const shellwords = require('shellwords')
const _ = require('lodash')
const path = require('path')
const EventEmitter = require('events')
const Promise = require('bluebird')
const fs = require('fs')
const readFile = util.promisify(fs.readFile)
const xml2js = require('xml2js')
const logger = require('../../../logger')

/**
 *
 * Disk scanning services for finding and modifying media files
 *
 * @since 0.2.0
 */
class DiskScanner {
  constructor(options) {
    this.options = options || {}
  }

  setup(app) {
    this.app = app
  }

  /**
   * @typedef MediaFilenames
   * @property {Array<String>} created List of new media in the scanned directory
   * @property {Array<String>} updated List of existing media in the scanned directory
   * @property {Array<String>} removed List of deleted media in the scanned directory
   */

  /**
  * @typedef MediaInfo
  * @property {string} title Databased entry ID
  * @property {string} filename Movie title
  * @property {Array<Track>} tracks Movie release year
  */

  /**
  * @typedef Track
  * @property {string} name Track name
  * @property {string} language Track language in 3 letter code
  * @property {integer} number Track order number in the file
  * @property {integer} newNumber New track order for remux
  * @property {string} type Track type (audio, video, subtitles)
  * @property {string} codecType Type of codec used to encode the track
  * @property {string} audioChannels Number of audio channels
  * @property {string} bps BPS of the audio track
  * @property {boolean} isDefault Default track
  * @property {boolean} isEnabled Enabled track
  * @property {boolean} isForced Forced track
  * @property {boolean} isMuxed Notes if the track is in sync with media file muxing
  */

  /**
   *
   * Scans directory recursively for any MKV media files
   *
   * @since 0.2.0
   * @param {string} directory root directory to scan
   * @param {Array<string>} existingFilenames array of filenames previously scanned for this directory
   * @return {Promise<MediaFilenames>} Promise to resolve to object of arrays containing media filenames
   */
  async findAllMediaFiles(directory, existingFilenames) {
    const globString = `${directory}/**/*.mkv`

    logger.info(`Loading movies from ${directory}.`, { label: 'DiskScanner' })
    return glob.promise(globString).then((mediaOnDisk) => {
      const removedFilenames = _.difference(existingFilenames, mediaOnDisk)

      logger.debug('Found removed movies:', { label: 'DiskScanner' })
      logger.debug(removedFilenames, { label: 'DiskScanner' })

      const updatedFilenames = existingFilenames.filter((filename) =>
        mediaOnDisk.includes(filename)
      )

      logger.debug('Found existing movies:', { label: 'DiskScanner' })
      logger.debug(updatedFilenames, { label: 'DiskScanner' })

      const createdFilenames = _.difference(mediaOnDisk, updatedFilenames)

      logger.debug('Found new movies:', { label: 'DiskScanner' })
      logger.debug(createdFilenames, { label: 'DiskScanner' })

      return {
        created: _.compact(createdFilenames),
        updated: _.compact(updatedFilenames),
        removed: _.compact(removedFilenames),
      }
    })
  }

  /**
   * DiskScanner#loadMediainfoFromFile
   *
   * Loads media metadata, artwork and directory files from disk.
   *
   * @since 0.2.0
   * @memberof DiskScanner
   * @param {String} filename Filename of the media to load.
   * @returns Promise Promise to resolve metadata from a file.
   */
  loadMediainfoFromFile(filename) {
    logger.info('Loading requested movie metadata from the disk.', {
      label: 'DiskScanner',
    })
    logger.debug(filename, { label: 'DiskScanner' })

    if (!filename) return Promise.reject(new TypeError('Filename must be defined and not empty.'))

    function legibleTag(tag) {
      let legibleTag

      switch (tag) {
        default:
          legibleTag = tag
      }

      return legibleTag
    }

    const _self = this
    const escapedFilename = shellwords.escape(filename)
    const exec = util.promisify(childProcess.exec)
    return exec(`mkvmerge -J ${escapedFilename}`)
      .then((res) => {
        let mediaInfo = {}
        const stdout = JSON.parse(res.stdout)

        // Set general movie information
        mediaInfo.title = _.get(stdout, 'container.properties.title')
        mediaInfo.filename = stdout.file_name
        mediaInfo.tracks = []

        // Cycle through tracks and add updates
        _.each(stdout.tracks, (track) => {
          let processedTrack = {}

          processedTrack.name = _.get(track, 'properties.track_name')
          processedTrack.language = _.get(track, 'properties.language')
          processedTrack.number = _.get(track, 'id')
          processedTrack.newNumber = processedTrack.number
          processedTrack.type = track.type
          processedTrack.codecType = track.codec
          processedTrack.isDefault = _.get(track, 'properties.default_track')
          processedTrack.isEnabled = _.get(track, 'properties.enabled_track')
          processedTrack.isForced = _.get(track, 'properties.forced_track')
          processedTrack.isMuxed = true

          // Additional parameters for audio tracks
          if (processedTrack.type === 'audio') {
            processedTrack.audioChannels = _.get(track, 'properties.audio_channels')
            processedTrack.bps = _.get(track, 'properties.tag_bps')
          }
          processedTrack = _.omitBy(processedTrack, _.isNil)
          mediaInfo.tracks.push(processedTrack)
        })

        mediaInfo = _.omitBy(mediaInfo, _.isNil)
        return mediaInfo
      })
      .then(async (movie) => {
        const readdir = util.promisify(fs.readdir)

        let filePath = path.parse(filename)

        movie.dir = filePath.dir

        movie.files = await readdir(filePath.dir)

        if (movie.files.includes(filePath.name + '-poster.jpg'))
          movie.poster = filePath.name + '-poster.jpg'

        if (movie.files.includes(filePath.name + '-fanart.jpg')) {
          movie.fanart = filePath.name + '-fanart.jpg'
        } else if (movie.files.includes('fanart.jpg')) {
          movie.fanart = 'fanart.jpg'
        }

        if (movie.files.includes(filePath.name + '-landscape.jpg'))
          movie.landscape = filePath.name + '-landscape.jpg'

        let defaultVideoTracks = _.filter(movie.tracks, {
          type: 'video',
          isDefault: true,
        })
        let defaultAudioTracks = _.filter(movie.tracks, {
          type: 'audio',
          isDefault: true,
        })

        if (defaultVideoTracks[0]) movie.videoTag = legibleTag(defaultVideoTracks[0].codecType)
        if (defaultAudioTracks[0])
          movie.audioTag = `${legibleTag(defaultAudioTracks[0].codecType)} ${
            defaultAudioTracks[0].audioChannels
            }ch`

        return movie
      })
      .catch((err) => {
        logger.warn(`Unable to find movie "${filename}".`, {
          label: 'DiskScanner',
        })
        logger.warn(err.message, {
          label: 'DiskScanner',
        })
        throw err
      })
  }

  /**
   * DiskScanner#loadMetadataFromNfo
   *
   * Loads media metadata from local nfo file
   *
   * @since 0.2.0
   * @memberof DiskScanner
   * @param {String} filename Filename of the nfo file to load.
   * @returns Promise Promise to resolve metadata from nfo.
   */
  async loadMetadataFromNfo(filename) {
    return readFile(filename)
      .then((nfo) =>
        new xml2js.Parser({
          explicitArray: false,
          ignoreAttrs: true,
        }).parseStringPromise(nfo)
      )
      .then((nfo) => {
        nfo = nfo.movie

        let uniqueid = nfo.uniqueid
        nfo.uniqueid = {}

        let imdbidIndex = _.findIndex(uniqueid, function (o) {
          return o.startsWith('tt')
        })

        let tmdbidIndex = _.findIndex(uniqueid, function (o) {
          return o.match(/^\d/)
        })

        if (imdbidIndex > -1) nfo.uniqueid.imdbid = uniqueid[imdbidIndex]
        if (tmdbidIndex > -1) nfo.uniqueid.tmdbid = uniqueid[tmdbidIndex]

        return nfo
      })
      .catch((e) => {
        logger.error(e)
        logger.warn(`Unable to read nfo @ ${filename}`, {
          label: 'DiskFileService',
        })
        logger.debug(e.message, {
          label: 'DiskFileService',
        })
        logger.debug(e.stack, {
          label: 'DiskFileService',
        })
        return null
      })
  }

  generateInfoCommand(data) {
    let command = `--edit info --set "title=${data.title}"`

    if (!data.tracks) return command

    data.tracks.forEach((track) => {
      command += ` --edit track:${track.number + 1}`
        ;[
          ['name', track.name],
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

  generateMergeCommand(data) {
    const base = path.basename(data.filename, '.mkv')
    const dir = path.dirname(data.filename)

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

    _.sortBy(data.tracks, 'newNumber').forEach((track) => {
      if (track.isMuxed) {
        commandObj[`${track.type}Merge`] = true

        commandObj[`${track.type}Number`] += `${track.number},`

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

    commandObj.command.push(`"${data.filename}"`)
    commandObj.command.push('--title')
    commandObj.command.push(`"${data.title}"`)

    commandObj.command.push('--track-order')

    commandObj.command.push(commandObj.trackOrder.slice(0, -1))

    logger.debug("Executing 'mkvmerge' command")
    logger.debug(`    ${commandObj.command}`)

    return commandObj.command
  }

  mux(id, data) {
    logger.silly('Called MediaFile#mux with:', { label: 'MediaFileService' })
    logger.silly({ id: id, data: data }, { label: 'MediaFileService' })

    const rename = util.promisify(fs.rename)
    const unlink = util.promisify(fs.unlink)

    const muxEvent = new EventEmitter()
    const command = this.generateMergeCommand(data)
    const updateEvent = childProcess.spawn(command.shift(), command, { shell: true })
    updateEvent.stdout.on('data', (res) => {
      const re = /(.*): (.*)/
      const result = re.exec(res.toString())
      if (result && result[1] === 'Progress') {
        muxEvent.emit('progress', parseInt(result[2].slice(0, -1)))
      }
    })

    updateEvent.on('exit', (code) => {
      if (code === 1 || code === 0) {
        logger.debug(`Backing up ${data.filename} to ${data.filename + 'bak'}.`, {
          label: 'MediaFileService#mux',
        })
        rename(data.filename, data.filename + 'bak')
          .catch((err) => {
            logger.error(`Unable to rename ${data.filename} to ${data.filename + 'bak'}.`, {
              label: 'MediaFileService#mux',
            })
            muxEvent.emit('error', new Error('Unable to rename MKV file to back up.'))
            return Promise.reject(err)
          })
          .then((val) => {
            logger.debug(`Renaming ${data.filename.slice(0, -3) + 'rmbtmp'} to ${data.filename}.`, {
              label: 'MediaFileService#mux',
            })
            return rename(data.filename.slice(0, -3) + 'rmbtmp', data.filename)
          })
          .catch((err) => {
            logger.error(
              `Unable to rename ${data.filename.slice(0, -3) + 'rmbtmp'} to ${data.filename}.`,
              { label: 'MediaFileService#mux' }
            )
            muxEvent.emit('error', new Error('Unable to rename MKV file from new mux.'))
            return Promise.reject(err)
          })
          .then((val) => {
            return unlink(data.filename + 'bak')
          })
          .catch((err) => {
            logger.error(`Unable to remove backup ${data.filename + 'bak'}.`, {
              label: 'MediaFileService#mux',
            })
          })
          .then((val) => {
            // this.get(id, {})
            muxEvent.emit(
              'finished',
              `Received 'exit' message with code '${code}' from mkvmerge on '${data.filename}'`
            )
          })
      } else {
        muxEvent.emit(
          'error',
          new Error(
            `Received 'exit' message with code '${code}' from mkvmerge on '${data.filename}'`
          )
        )
      }
    })

    updateEvent.on('error', (err) =>
      Promise.reject(
        new Error(`Received 'error' message with '${err}' from mkvmerge on '${data.filename}'`)
      )
    )

    return muxEvent
  }
}

module.exports = function moduleExport(options) {
  return new DiskScanner(options)
}

module.exports.Service = DiskScanner
