/* global describe it afterEach beforeEach beforeAll afterAll expect jest */
const feathers = require('@feathersjs/feathers')
const DiskScannerService = require('../disk-scanner.service')

const childProcess = require('child_process')
const fs = require('fs')
const path = require('path')
const glob = require('glob-promise')
const _ = require('lodash')
// const mockfs = require('mock-fs')

const { Readable } = require('stream')

const nfoJson = require('../__fixtures__/2001 A Space Odyssey (1968).js')

const fixture = {}

describe("'Disk Scanner' service", () => {
  let app, DiskScanner, MediaScraper, Movies, Jobs

  beforeAll(async () => {
    app = feathers()
    app.configure(DiskScannerService)
    app.setup()

    DiskScanner = app.service('/utils/disk-scanner')

    this.movie = require('../__fixtures__/zathura.movie.json') // eslint-disable-line global-require

    this.tripleZathura = require('../__fixtures__/triple-zathura.json') // eslint-disable-line global-require

    this.fixture = {
      stdout: JSON.stringify(require('../__fixtures__/zathura.json')), // eslint-disable-line global-require
    }

    fixture.zathuraOne = {
      stdout: JSON.stringify(this.tripleZathura[0]),
    }

    fixture.zathuraTwo = {
      stdout: JSON.stringify(this.tripleZathura[1]),
    }

    fixture.zathuraThree = {
      stdout: JSON.stringify(this.tripleZathura[2]),
    }

    this.zathuraOneDir = ['zathura1.mkv', 'zathura1-poster.jpg', 'zathura1-fanart.jpg']

    this.data = {
      title: 'Movie Title',
      filename: 'test_movie.mkv',
      tracks: [
        {
          name: 'Track Name',
          language: 'en',
          isDefault: true,
          isEnabled: true,
          isForced: true,
        },
      ],
    }

    this.nfoFilename = path.resolve(__dirname, '../__fixtures__/2001 A Space Odyssey (1968).nfo')

    this.dataCommand = DiskScanner.generateInfoCommand(this.data)

    jest.spyOn(childProcess, 'exec').mockImplementation((command, callback) => {
      if (command === 'mkvmerge -J good_filename.mkv') {
        callback(null, this.fixture)
      } else if (command === 'mkvmerge -J /fake/system/bad_file/bad_filename.mkv') {
        callback(new Error('Bad File'))
      } else if (command === 'mkvmerge -J bad_JSON.mkv') {
        callback(null, { stdout: 'not JSON' })
      } else if (command === 'mkvmerge -J /fake/system/zathura1/zathura1.mkv') {
        callback(null, fixture.zathuraOne)
      } else if (command === 'mkvmerge -J /fake/system/zathura2/zathura2.mkv') {
        callback(null, fixture.zathuraTwo)
      } else if (command === 'mkvmerge -J /fake/system/zathura3/zathura3.mkv') {
        callback(null, fixture.zathuraThree)
      } else if (command === `mkvpropedit -v bad_filename.mkv ${this.dataCommand}`) {
        callback(new Error('mkvpropedit error'))
      } else if (command === `mkvpropedit -v good_filename.mkv ${this.dataCommand}`) {
        callback(null, { stdout: 'test' })
      } else {
        callback(new Error('ChildProcess.exec Stubbed Error.'))
      }
    })

    jest.spyOn(fs, 'readdir').mockImplementation((directory, callback) => {
      callback(null, this.zathuraOneDir)
    })

    this.eventStub = new childProcess.ChildProcess()

    this.eventStub.stdout = new Readable()
    this.eventStub.stdout._read = jest.fn()

    jest.spyOn(childProcess, 'spawn').mockReturnValue(this.eventStub)
  })

  afterEach(() => {
    childProcess.exec.mockClear()
    childProcess.spawn.mockClear()
  })

  it('register the service', () => expect(DiskScanner).toBeTruthy())

  describe('#findAllMediaFiles', () => {
    beforeAll((done) => {
      jest
        .spyOn(glob, 'promise')
        .mockResolvedValue([
          '/fake/system/zathura1/zathura1.mkv',
          '/fake/system/zathura2/zathura2.mkv',
          '/fake/system/zathura3/zathura3.mkv',
        ])
      done()
    })

    afterAll((done) => {
      glob.promise.mockRestore()
      done()
    })

    it('finds new movies', async () => {
      const result = await app.service('/utils/disk-scanner').findAllMediaFiles('/fake/system', [])

      expect(result).toHaveProperty('created', expect.toBeArray())
      expect(result.created).toBeArrayOfSize(3)
      expect(result.created[0]).toBe('/fake/system/zathura1/zathura1.mkv')
      expect(result.created[1]).toBe('/fake/system/zathura2/zathura2.mkv')
      expect(result.created[2]).toBe('/fake/system/zathura3/zathura3.mkv')
    })

    it('finds existing movies', async () => {
      let result = await app
        .service('/utils/disk-scanner')
        .findAllMediaFiles('/fake/system', ['/fake/system/zathura3/zathura3.mkv'])

      expect(result).toHaveProperty('updated', expect.toBeArray())
      expect(result.updated).toBeArrayOfSize(1)
      expect(result.updated[0]).toBe('/fake/system/zathura3/zathura3.mkv')
    })

    it('finds removed movies', async () => {
      let result = await app
        .service('/utils/disk-scanner')
        .findAllMediaFiles('/fake/system', ['/fake/system/delete/delete.mkv'])

      expect(result).toHaveProperty('removed', expect.toBeArray())
      expect(result.removed).toBeArrayOfSize(1)
      expect(result.removed[0]).toBe('/fake/system/delete/delete.mkv')
    })
  })

  describe('#_loadMetadataFromFile', () => {
    it('throws a TypeError if filename is empty', () =>
      expect(DiskScanner.loadMediainfoFromFile('')).rejects.toThrow(TypeError))

    it('throws an error when file is not found', () =>
      expect(DiskScanner.loadMediainfoFromFile('/fake/system/bad_filename.mkv')).rejects.toThrow(
        Error
      ))

    it('throws an error of JSON cannot be read', () =>
      expect(DiskScanner.loadMediainfoFromFile('bad_JSON.mkv')).rejects.toThrow(expect.anything()))

    it('returns an object', () =>
      expect(DiskScanner.loadMediainfoFromFile('/fake/system/zathura1/zathura1.mkv')).toBeObject(
        'object'
      ))

    it("has 'dir' property", () =>
      expect(
        DiskScanner.loadMediainfoFromFile('/fake/system/zathura1/zathura1.mkv')
      ).resolves.toHaveProperty('dir', '/fake/system/zathura1'))

    it("has 'files' (Array) property", () =>
      expect(
        DiskScanner.loadMediainfoFromFile('/fake/system/zathura1/zathura1.mkv')
      ).resolves.toHaveProperty('files', expect.toBeArray()))

    it("has 'poster' property", () =>
      expect(
        DiskScanner.loadMediainfoFromFile('/fake/system/zathura1/zathura1.mkv')
      ).resolves.toHaveProperty('poster', 'zathura1-poster.jpg'))

    it("has 'fanart' property", () =>
      expect(
        DiskScanner.loadMediainfoFromFile('/fake/system/zathura1/zathura1.mkv')
      ).resolves.toHaveProperty('fanart', 'zathura1-fanart.jpg'))

    it("sets 'videoTag' to default video", () =>
      expect(
        DiskScanner.loadMediainfoFromFile('/fake/system/zathura1/zathura1.mkv')
      ).resolves.toHaveProperty('videoTag', 'MPEG-4p10/AVC/h.264'))

    it("sets 'audioTag' to default audio", () =>
      expect(
        DiskScanner.loadMediainfoFromFile('/fake/system/zathura1/zathura1.mkv')
      ).resolves.toHaveProperty('audioTag', 'DTS 6ch'))
  })

  describe('#loadMetadataFromNfo', () => {
    it('loads metadata from NFO', async () => {
      let result = await app.service('/utils/disk-scanner').loadMetadataFromNfo(this.nfoFilename)

      expect(result).toEqual(nfoJson)
    })
  })

  describe('#generateInfoCommand', () => {
    let data

    beforeAll((done) => {
      data = {
        title: 'Test Movie',
        filename: 'test_movie.mkv',
        tracks: [
          {
            number: 0,
          },
          {
            number: 1,
          },
        ],
      }

      done()
    })

    it('should set the media title', () => {
      expect(DiskScanner.generateInfoCommand(data)).toContain(
        '--edit info --set "title=Test Movie"'
      )
    })

    it('should delete track parameters when they are empty', () => {
      expect(DiskScanner.generateInfoCommand(data)).toContain(
        '--edit track:1 --delete name --delete language --set "flag-default=0" --set "flag-enabled=0" --set "flag-forced=0"'
      )
    })

    it('should not have track in command if no tracks present', () => {
      expect(
        DiskScanner.generateInfoCommand({
          title: 'Test Movie',
          filename: 'test_movie.mkv',
        })
      ).not.toContain('--edit track')
    })

    it('should set each track parameter when not empty', () => {
      const instanceData = data

      instanceData.tracks[0].name = 'Track Name'
      instanceData.tracks[0].language = 'en'
      instanceData.tracks[0].isDefault = true
      instanceData.tracks[0].isEnabled = true
      instanceData.tracks[0].isForced = true
      expect(DiskScanner.generateInfoCommand(instanceData)).toContain(
        '--edit track:1 --set "name=Track Name" --set "language=en" --set "flag-default=1" --set "flag-enabled=1" --set "flag-forced=1"'
      )
    })
  })

  describe('#generateMergeCommand', () => {
    let mergeFixture

    beforeEach(() => {
      mergeFixture = _.merge({}, this.movie)
    })

    it('should be an array', () => {
      expect(DiskScanner.generateMergeCommand(mergeFixture)).toBeArray()
    })

    it("should contain ' -D' if no video tracks to mux", () => {
      mergeFixture.tracks[0].isMuxed = false
      expect(DiskScanner.generateMergeCommand(mergeFixture)).toContain('-D')
    })

    it("should contain ' -A' if no audio tracks to mux", () => {
      mergeFixture.tracks[1].isMuxed = false
      expect(DiskScanner.generateMergeCommand(mergeFixture)).toContain('-A')
    })

    it("should contain ' -S' if no subtitle tracks to mux", () => {
      mergeFixture.tracks[2].isMuxed = false
      expect(DiskScanner.generateMergeCommand(mergeFixture)).toContain('-S')
    })

    it("should contain ' -d track.number' if one video track to mux", () => {
      let ret = DiskScanner.generateMergeCommand(mergeFixture)
      expect(ret).toContain('-d')
      expect(ret).toContain(`${mergeFixture.tracks[0].number}`)
    })

    it("should contain ' -a track.number' if one audio track to mux", () => {
      let ret = DiskScanner.generateMergeCommand(mergeFixture)
      expect(ret).toContain('-a')
      expect(ret).toContain(`${mergeFixture.tracks[1].number}`)
    })

    it("should contain ' -s track.number' if one subtitles track to mux", () => {
      let ret = DiskScanner.generateMergeCommand(mergeFixture)
      expect(ret).toContain('-s')
      expect(ret).toContain(`${mergeFixture.tracks[2].number}`)
    })

    it("should contain ' -M' to remove attachments", () => {
      expect(DiskScanner.generateMergeCommand(mergeFixture)).toContain('-M')
    })

    it('should reorder tracks by newNumber', () => {
      mergeFixture.tracks[1].newNumber = 3
      mergeFixture.tracks[2].newNumber = 2

      let ret = DiskScanner.generateMergeCommand(mergeFixture)
      expect(ret).toContain('--track-order')
      expect(ret).toContain('0:0,0:2,0:1')
    })

    it('should output to temporary file', () => {
      mergeFixture.filename = '/test/directory/filename.mkv'

      expect(DiskScanner.generateMergeCommand(mergeFixture)).toContain(
        '"/test/directory/filename.rmbtmp"'
      )
    })

    it('should set title', () => {
      mergeFixture.title = 'Test Title'
      let ret = DiskScanner.generateMergeCommand(mergeFixture)
      expect(ret).toContain('--title')
      expect(ret).toContain('"Test Title"')
    })
  })

  describe('#mux', () => {
    let mergeFixture

    beforeAll((done) => {
      mergeFixture = _.merge({}, this.movie)
      this.renameStub = jest.spyOn(fs, 'rename').mockResolvedValue('Rename worked!')
      done()
    })

    afterEach((done) => {
      childProcess.spawn.mockClear()
      done()
    })

    afterAll((done) => {
      fs.rename.mockRestore()
      done()
    })

    it('should call mkvmerge through process.spawn', () => {
      DiskScanner.mux(1, mergeFixture)
      expect(childProcess.spawn).toBeCalledWith('mkvmerge', expect.anything(), expect.anything())
    })

    describe("when 'data' message is emitted", () => {
      it.skip('should aggregate error messages', () => {
        const event = DiskScanner.mux(1, mergeFixture)
        this.eventStub.stdout.emit('data', Buffer.from('Error: Error #1'))
        this.eventStub.stdout.emit('data', Buffer.from('Error: Error #2'))
        this.eventStub.emit('exit', 2)
        return expect(event).rejectsToThrow("Received 'exit' message with code '2'")
      })

      it('should call progress function with integer percent on progress', (done) => {
        const progressSpy = jest.fn()
        let muxEvent = DiskScanner.mux(1, mergeFixture)

        muxEvent.on('progress', progressSpy)

        this.eventStub.stdout.emit('data', Buffer.from('Progress: 10%'))
        this.eventStub.stdout.emit('data', Buffer.from('Progress: 100%'))

        expect(progressSpy).toBeCalledTimes(2) // eslint-disable-line no-unused-expressions
        expect(progressSpy).nthCalledWith(1, 10)
        expect(progressSpy).nthCalledWith(2, 100)
        done()
      })
    })

    it.skip("should reject when 'error' message is emitted", () => {
      const event = DiskScanner.mux(1, mergeFixture)
      this.eventStub.emit('error', 'Error')
      return expect(event).rejects.toThrow("Received 'error' message with 'Error'")
    })

    it.skip("should resolve when 'exit' message is received with code 0", () => {
      const event = DiskScanner.mux(1, mergeFixture)
      this.eventStub.emit('exit', 0)
      return expect(event).to.eventually.be.fulfilled
    })

    it.skip("should resolve when 'exit' message is received with code 1", () => {
      const event = DiskScanner.mux(1, mergeFixture)
      this.eventStub.emit('exit', 1)
      return expect(event).to.eventually.be.fulfilled
    })

    it.skip("should resolve when 'exit' message is received with code 2", () => {
      const event = DiskScanner.mux(1, mergeFixture)
      this.eventStub.emit('exit', 2)
      return expect(event).to.eventually.be.rejectedWith(
        Error,
        "Received 'exit' message with code '2'"
      )
    })
  })

  describe.skip('#saveMediainfo', () => {
    let goodFileId = 0

    it('should call mkvpropedit with the right command', () =>
      DiskScanner.saveMediainfo(goodFileId, this.data).then(() =>
        expect(childProcess.exec).toBeCalledWith(
          'mkvpropedit -v good_filename.mkv --edit info --set "title=Movie Title" --edit track:NaN --set "name=Track Name" --set "language=en" --set "flag-default=1" --set "flag-enabled=1" --set "flag-forced=1"',
          expect.anything()
        )
      ))
  })
})
