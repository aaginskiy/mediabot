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

class Service {
  constructor (options) {
    this.options = options || {}
  }

  setup (app) {
    this.app = app
    this.Movies = app.service('movies')
    this.Jobs = app.service('jobs')
    this.MediaScraper = app.service('utils/media-scraper')

    this.watcher = null
  }

  /**
   * DiskScannerService#refreshMediainfo
   *
   * Refreshes media metadata, artwork and directory files from disk for one media file.
   *
   * @since 0.2.0
   * @memberof DiskScannerService
   * @param {String} filename Filename of the media to load.
   * @returns Promise Promise to resolve metadata from a file.
   */
  async refreshMediainfo (id, filename) {
    return this._loadMediainfoFromFile(filename)
      .then(async metadata => {
        let nfoFilename = path.join(path.dirname(metadata.filename), path.basename(metadata.filename, path.extname(metadata.filename)) + '.nfo')

        let nfo = await this._loadMetadataFromNfo(nfoFilename)
        metadata.localInfo = nfo
        metadata.movieInfo = {}
        metadata.movieInfo.title = _.get(nfo, 'title')
        metadata.movieInfo.year = _.get(nfo, 'year')
        metadata.movieInfo.tmdbid = _.get(nfo, 'uniqueid.tmdbid')

        if (metadata.movieInfo.tmdbid) {
          metadata.tmdbInfo = await this.MediaScraper.scrapeMoviebyTmdbId(metadata.movieInfo.tmdbid)
            .catch(e => ({}))
        } else if (metadata.movieInfo.title) {
          metadata.tmdbInfo = await this.MediaScraper.scrapeMovieByName(metadata.movieInfo.title, metadata.movieInfo.year)
            .catch(e => ({}))
        } else {
          metadata.tmdbInfo = {}
        }
        return metadata
      })
      .then((metadata) => { this.Movies.update(id, metadata, {skipWrite: true}) })
  }

  /**
   * DiskScannerService#refreshAllMediainfo
   *
   * Loads all movies media directory. Existing movies are refreshed,
   * new movies are added, and missing movies are removed.
   *
   * @since 0.2.0
   * @memberof DiskScannerService
   * @param {Object} directory Root directory where to refresh movies
   * @returns {Object} Promise Promise to queue jobs to update each movie
   */
  async refreshAllMediainfo (directory) {
    let mediaFiles = await this._findAllMediaFiles(directory)

    let existingMovies = await this.Movies.find({
      query: {
        filename: {
          $in: mediaFiles.updated
        },
        $select: ['_id', 'filename']
      }
    })

    let createData = mediaFiles.created.map(filename => {
      return {
        filename: filename
      }
    })

    let createdMovies = await this.Movies.create(createData, {})

    let createJobsData = (movies) => {
      return movies.map(movie => ({
        args: [movie._id, movie.filename],
        name: 'RefreshMediainfo'
      }))
    }

    let createJobs = (movie) => {
      this.Jobs.create({
        args: [movie._id, movie.filename],
        name: 'RefreshMediainfo'
      }, {})
    }

    return Promise.all([
      this.Jobs.create(createJobsData(createdMovies), {}),
      this.Movies.remove(null, { query: { filename: { $in: mediaFiles.removed } } }),
      this.Jobs.create(createJobsData(existingMovies), {})
    ])
  }

  async scanMediaLibrary (directory) {
    let mediaFiles = await this._findAllMediaFiles(directory)

    let createData = mediaFiles.created.map(filename => {
      return {filename: filename}
    })

    let movies = await this.Movies.create(createData, {})

    let createJobs = (movie) => {
      this.Jobs.create({
        args: [movie._id, movie.filename],
        name: 'RefreshMediainfo'
      }, {})
    }

    return Promise.all([
      Promise.map(movies, createJobs, { concurrency: 1 }),
      this.Movies.remove(null, { query: { filename: { $in: mediaFiles.removed } } })
    ])
  }

  startWatchingDirectories () {

  }

  stopWatchingDirectories () {

  }

  // Private functions

  /**
   * DiskScannerService#_findAllMediaFiles
   *
   * Scans directory recursively for any media files
   *
   * @since 0.2.0
   * @memberof DiskScannerService
   * @private
   * @param {String} directory root directory to scan
   * @returns Promise Promise to resolve to object of arrays containing media filenames { created: [...], updated: [...], removed [...] }
   */
  async _findAllMediaFiles (directory) {
    const globString = `${directory}/**/*.mkv`

    this.app.info(`Loading movies from ${directory}.`, { label: 'DiskScannerService' })
    const mediaOnDisk = await glob.promise(globString)

    // Load all movies
    const movies = await this.Movies.find()
    const movieFilenames = movies.map(movie => movie.filename)

    // Filter removed movies
    const removedFilenames = _.difference(movieFilenames, mediaOnDisk)

    this.app.debug('Found removed movies:', { label: 'DiskScannerService' })
    this.app.debug(removedFilenames, { label: 'DiskScannerService' })

    // Filter existing movies
    const updatedMovies = movies.filter(movie => mediaOnDisk.includes(movie.filename))
    const updatedFilenames = updatedMovies.map(movie => movie.filename)

    // Filter new movies
    const createdFilenames = _.difference(mediaOnDisk, updatedFilenames)

    this.app.debug('Found new movies:', { label: 'DiskScannerService' })
    this.app.debug(createdFilenames, { label: 'DiskScannerService' })

    this.app.debug('Found existing movies:', { label: 'DiskScannerService' })
    this.app.debug(updatedFilenames, { label: 'DiskScannerService' })

    return {
      'created': _.compact(createdFilenames),
      'updated': _.compact(updatedFilenames),
      'removed': _.compact(removedFilenames)
    }
  }

  _createMediaFromMediainfo (filename) {
    return this._loadMediainfoFromFile(filename).then((metadata) => this.Movies.create(metadata, {}))
  }

  /**
   * DiskScannerService#_loadMediainfoFromFile
   *
   * Loads media metadata, artwork and directory files from disk.
   *
   * @since 0.2.0
   * @memberof DiskScannerService
   * @param {String} filename Filename of the media to load.
   * @returns Promise Promise to resolve metadata from a file.
   */
  _loadMediainfoFromFile (filename) {
    this.app.info('Loading requested movie metadata from the disk.', { label: 'DiskScannerService' })
    this.app.debug(filename, { label: 'DiskScannerService' })

    if (!filename) return Promise.reject(new TypeError('Filename must be defined and not empty.'))

    function legibleTag (tag) {
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
      .then(async movie => {
        const readdir = util.promisify(fs.readdir)

        let filePath = path.parse(filename)

        movie.dir = filePath.dir

        movie.files = await readdir(filePath.dir)

        if (movie.files.includes(filePath.name + '-poster.jpg')) movie.poster = filePath.name + '-poster.jpg'

        if (movie.files.includes(filePath.name + '-fanart.jpg')) {
          movie.fanart = filePath.name + '-fanart.jpg'
        } else if (movie.files.includes('fanart.jpg')) {
          movie.fanart = 'fanart.jpg'
        }

        if (movie.files.includes(filePath.name + '-landscape.jpg')) movie.landscape = filePath.name + '-landscape.jpg'

        let defaultVideoTracks = _.filter(movie.tracks, {
          type: 'video',
          isDefault: true
        })
        let defaultAudioTracks = _.filter(movie.tracks, {
          type: 'audio',
          isDefault: true
        })

        if (defaultVideoTracks[0]) movie.videoTag = legibleTag(defaultVideoTracks[0].codecType)
        if (defaultAudioTracks[0]) movie.audioTag = `${legibleTag(defaultAudioTracks[0].codecType)} ${defaultAudioTracks[0].audioChannels}ch`

        return movie
      })
      .catch(err => {
        this.app.warn(`Unable to find movie "${filename}".`, {
          label: 'DiskScannerService'
        })
        this.app.warn(err.message, {
          label: 'DiskScannerService'
        })
        throw err
      })
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
  async _loadMetadataFromNfo (filename) {
    return readFile(filename)
      .then(nfo => new xml2js.Parser({
        explicitArray: false,
        ignoreAttrs: true})
        .parseStringPromise(nfo)
      )
      .then(nfo => {
        nfo = nfo.movie

        let uniqueid = nfo.uniqueid
        nfo.uniqueid = {}

        let imdbidIndex = _.findIndex(uniqueid, function (o) {
          return o.startsWith('tt')
        })

        let tmdbidIndex = _.findIndex(uniqueid, function (o) {
          return o.match(/^\d/)
        })

        nfo.uniqueid.imdbid = uniqueid[imdbidIndex]
        nfo.uniqueid.tmdbid = uniqueid[tmdbidIndex]

        return nfo
      })
      .catch(e => {
        this.app.warn(`Unable to read nfo @ ${filename}`, {
          label: 'DiskFileService'
        })
        this.app.debug(e.message, {
          label: 'DiskFileService'
        })
        this.app.debug(e.stack, {
          label: 'DiskFileService'
        })
        return null
      })
  }

  /**
   * DiskScannerService#_saveMediainfo
   *
   * Updates mkv file properties with data.  If id is present, filename is extracted from
   * that movie object.
   *
   * @param {any} id
   * @returns Promise
   * @memberof DiskScannerService
   */
  async _saveMediainfo (id, mediainfo) {
    console.log(id)
    this.app.info(`Patching movie #${id} metadata to file.`, {label: 'MediaFileService'})

    const exec = util.promisify(childProcess.exec)

    const movieData = await this.Movies.get(id)
    return exec(`mkvpropedit -v ${shellwords.escape(movieData.filename)} ${this._generateInfoCommand(mediainfo)}`)
      .catch(err => {
        this.app.error(err, {label: 'MediaFileService'})
        return Promise.reject(err)
      })
  }

  _generateInfoCommand (data) {
    let command = `--edit info --set "title=${data.title}"`

    if (!data.tracks) return command

    data.tracks.forEach((track) => {
      command += ` --edit track:${track.number + 1}`;

      [['name', track.name],
        ['language', track.language]].forEach((field) => {
        if (field[1]) {
          command += ` --set "${field[0]}=${field[1]}"`
        } else {
          command += ` --delete ${field[0]}`
        }
      });

      [['flag-default', track.isDefault ? 1 : 0],
        ['flag-enabled', track.isEnabled ? 1 : 0],
        ['flag-forced', track.isForced ? 1 : 0]].forEach((field) => {
        command += ` --set "${field[0]}=${field[1]}"`
      })
    })

    return command
  }

  _generateMergeCommand (data) {
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
      command: ['mkvmerge', '--output', `"${dir}/${base}.rmbtmp"`]
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

    this.app.debug('Executing \'mkvmerge\' command')
    this.app.debug(`    ${commandObj.command}`)

    return commandObj.command
  }

  _mux (id, data) {
    this.app.silly('Called MediaFile#mux with:', {label: 'MediaFileService'})
    this.app.silly({ id: id, data: data }, {label: 'MediaFileService'})

    const rename = util.promisify(fs.rename)

    const muxEvent = new EventEmitter()
    const command = this._generateMergeCommand(data)
    const updateEvent = childProcess.spawn(command.shift(), command, {shell: true})
    updateEvent.stdout.on('data', (res) => {
      const re = /(.*): (.*)/
      const result = re.exec(res.toString())
      if (result && result[1] === 'Progress') {
        muxEvent.emit('progress', parseInt(result[2].slice(0, -1)))
      }
    })

    updateEvent.on('exit', (code) => {
      if (code === 1 || code === 0) {
        this.app.debug(`Backing up ${data.filename} to ${data.filename + 'bak'}.`, {label: 'MediaFileService#mux'})
        rename(data.filename, data.filename + 'bak')
          .catch((err) => {
            this.app.error(`Unable to rename ${data.filename} to ${data.filename + 'bak'}.`, {label: 'MediaFileService#mux'})
            muxEvent.emit('finished', new Error('Unable to rename MKV file to back up.'))
            return Promise.reject(err)
          })
          .then((val) => {
            this.app.debug(`Renaming ${data.filename.slice(0, -3) + 'rmbtmp'} to ${data.filename}.`, {label: 'MediaFileService#mux'})
            return rename(data.filename.slice(0, -3) + 'rmbtmp', data.filename)
          })
          .catch((err) => {
            this.app.error(`Unable to rename ${data.filename.slice(0, -3) + 'rmbtmp'} to ${data.filename}.`, {label: 'MediaFileService#mux'})
            muxEvent.emit('finished', new Error('Unable to rename MKV file from new mux.'))
            return Promise.reject(err)
          })
          .then((val) => {
            this.get(id, {})
            muxEvent.emit('finished', `Received 'exit' message with code '${code}' from mkvmerge on '${data.filename}'`)
          })
      } else {
        muxEvent.emit('finished', new Error(`Received 'exit' message with code '${code}' from mkvmerge on '${data.filename}'`))
      }
    })

    updateEvent.on('error', err => Promise.reject(new Error(`Received 'error' message with '${err}' from mkvmerge on '${data.filename}'`)))

    return muxEvent
  }
}

module.exports = function moduleExport (options) {
  return new Service(options)
}

module.exports.Service = Service
