/* global describe it beforeEach afterEach beforeAll afterAll expect jest */
const app = require('../../../src/api/app')
app.setup()

const MediaFile = app.service('media-file')
const MediaFileService = require('../../../src/api/services/media-file/media-file.class')

const childProcess = require('child_process')
const fs = require('fs')
const glob = require('glob-promise')
const _ = require('lodash')
// const mockfs = require('mock-fs')

const { Readable } = require('stream')

const fixture = {}

describe('\'Media File\' service', () => {
  beforeAll((done) => {
    this.movie = require('../fixtures/zathura.movie.json') // eslint-disable-line global-require

    this.tripleZathura = require('../fixtures/triple-zathura.json') // eslint-disable-line global-require

    this.fixture = {
      stdout: JSON.stringify(require('../fixtures/zathura.json')) // eslint-disable-line global-require
    }

    fixture.zathuraOne = {
      stdout: JSON.stringify(this.tripleZathura[0])
    }

    fixture.zathuraTwo = {
      stdout: JSON.stringify(this.tripleZathura[1])
    }

    fixture.zathuraThree = {
      stdout: JSON.stringify(this.tripleZathura[2])
    }

    this.zathuraOneDir = [
      'zathura1.mkv',
      'zathura1-poster.jpg',
      'zathura1-fanart.jpg'
    ]

    this.data = {
      title: 'Movie Title',
      filename: 'test_movie.mkv',
      tracks: [
        {
          name: 'Track Name',
          language: 'en',
          isDefault: true,
          isEnabled: true,
          isForced: true
        }
      ]
    }

    this.dataCommand = MediaFile.generateInfoCommand(this.data)

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

    done()
  })

  afterEach((done) => {
    childProcess.exec.mockClear()
    // childProcess.spawn.restore()
    // this.sandbox.restore()
    done()
  })

  it('register the service', () => expect(MediaFile).toBeTruthy())

  it('should set options to {} if no options provided', () => {
    const service = new MediaFileService(null)
    expect(service.options).toMatchObject({})
  })

  describe('#loadFromFile', () => {
    it('should return empty object when filename is not supplied', () =>
      expect(MediaFile.loadFromFile(''))
        .resolves.toMatchObject({}))

    it('should return empty object when file is not found', () =>
      expect(MediaFile.loadFromFile('/fake/system/bad_filename.mkv'))
        .resolves.toMatchObject({}))

    describe('when file exist', () => {
      it('should return non-empty object', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .toBeObject('object'))

      it('should return non-empty object', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .resolves.not.toBeEmpty())

      it('should set \'dir\' property', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .resolves.toHaveProperty(
            'dir',
            '/fake/system/zathura1'))

      it('should set \'files\' property to an Array', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .resolves.toHaveProperty('files', expect.toBeArray()))

      it('should set \'poster\' if it exists', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .resolves.toHaveProperty(
            'poster',
            'zathura1-poster.jpg'))

      it('should set \'fanart\' if it exists', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .resolves.toHaveProperty(
            'fanart',
            'zathura1-fanart.jpg'))

      it('should set \'videoTag\' to default video', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .resolves.toHaveProperty(
            'videoTag',
            'MPEG-4p10/AVC/h.264'))

      it('should set \'audioTag\' to default audio', () =>
        expect(MediaFile.loadFromFile('/fake/system/zathura1/zathura1.mkv'))
          .resolves.toHaveProperty(
            'audioTag',
            'DTS 6ch'))
    })
  })

  describe('#parseMkvmergeInfo', () => {
    it('should catch any error from the external execution', () =>
      expect(MediaFile.parseMkvmergeInfo('bad_filename.mkv'))
        .rejects.toThrow('Stubbed Error.'))

    it('should call callback with correctly formatted object', () =>
      expect(MediaFile.parseMkvmergeInfo('good_filename.mkv'))
        .resolves.toMatchObject(this.movie))

    it('should return an error of JSON cannot be read', () =>
      expect(MediaFile.parseMkvmergeInfo('bad_JSON.mkv'))
        .rejects.toThrow(expect.anything()))
  })

  describe('#create', () => {
    beforeAll((done) => {
      jest.spyOn(glob, 'promise').mockResolvedValue([
        '/fake/system/zathura1/zathura1.mkv',
        '/fake/system/zathura2/zathura2.mkv'
      ])
      done()
    })

    afterAll((done) => {
      glob.promise.mockRestore()
      done()
    })

    afterEach(() => MediaFile.Movie.remove(null))

    beforeEach(() =>
      MediaFile.Movie.create([
        {
          title: 'Ready to Delete',
          filename: '/fake/system/delete/delete.mkv'
        },
        {
          title: 'Existing Movie #1',
          filename: '/fake/system/zathura3/zathura3.mkv'
        }
      ]))

    it('should reload all files from directory if no filenames provided', async () => {
      let ret = await MediaFile.create({}, {
        query: {
          filenames: []
        }
      })

      expect(ret).toHaveProperty('created', expect.toBeArray())
      expect(ret.created).toBeArrayOfSize(2)
      expect(ret.created[0]).toHaveProperty('title', 'Zathura: A Space Adventure (2005)')
      expect(ret.created[1]).toHaveProperty('title', 'Zathura: A Space Adventure 2 (2005)')
    })

    it('should create new movie if it does not exist', async () => {
      let ret = await MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/zathura1/zathura1.mkv']
        }
      })

      expect(ret).toHaveProperty('created', expect.toBeArray())
      expect(ret.created).toBeArrayOfSize(1)
      expect(ret.created[0]).toHaveProperty('title', 'Zathura: A Space Adventure (2005)')
    })

    it('should not create new movie if it exists', async () => {
      let ret = await MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/zathura3/zathura3.mkv']
        }
      })

      expect(ret).toHaveProperty('created', expect.toBeArray())
      expect(ret.created).toBeEmpty()
    })

    it('should update movie if it already exists', async () => {
      let ret = await MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/zathura3/zathura3.mkv']
        }
      })

      expect(ret).toHaveProperty('updated', expect.toBeArray())
      expect(ret.updated).toBeArrayOfSize(1)
      expect(ret.updated[0]).toHaveProperty('title', 'Zathura: A Space Adventure 3 (2005)')
    })

    it('should not update movie if file doesn\'t exist', async () => {
      let ret = await MediaFile.create({}, {
        query: {
          filenames: ['/fake/system/delete/delete.mkv']
        }
      })

      expect(ret).toHaveProperty('updated', expect.toBeArray())
      expect(ret.updated).toBeEmpty()
    })

    it('should delete movie if the file no longer exists when all movies are reloaded', async () => {
      let ret = await MediaFile.create({}, {
        query: {
          filenames: []
        }
      })

      expect(ret).toHaveProperty('deleted', expect.toBeArray())
      expect(ret.deleted).toBeArrayOfSize(2)
    })
  })

  describe('#get', () => {
    afterEach(() => MediaFile.Movie.remove(null))
    let goodFileId, badFileId
    beforeEach(() =>
      Promise.all([
        MediaFile.Movie
          .create({
            title: 'Modified Existing Movie #1',
            filename: '/fake/system/zathura1/zathura1.mkv'
          })
          .then((res) => {
            goodFileId = res._id
          }),
        MediaFile.Movie
          .create({
            title: 'Existing Movie #2',
            filename: '/fake/system/bad_file/bad_filename.mkv'
          })
          .then((res) => {
            badFileId = res._id
          })
      ]))

    it('should return media info for the movie specified by ID', () =>
      expect(MediaFile.get(goodFileId)).resolves.toHaveProperty(
        'title',
        'Zathura: A Space Adventure (2005)'
      ))

    it('should return an error if movie does not exist', () =>
      expect(MediaFile.get(badFileId)).rejects.toThrow('Bad File'))
  })

  describe('#patch', () => {
    afterEach(() => MediaFile.Movie.remove(null))
    let goodFileId, badFileId
    beforeEach(() =>
      Promise.all([
        MediaFile.Movie
          .create({
            title: 'Modified Existing Movie #1',
            filename: 'good_filename.mkv'
          })
          .then((res) => {
            goodFileId = res._id
          }),
        MediaFile.Movie
          .create({
            title: 'Existing Movie #2',
            filename: 'bad_filename.mkv'
          })
          .then((res) => {
            badFileId = res._id
          })
      ]))

    it('should call mkvpropedit with the right command', () =>
      MediaFile.patch(goodFileId, this.data).then(() =>
        expect(childProcess.exec).toBeCalledWith('mkvpropedit -v good_filename.mkv --edit info --set "title=Movie Title" --edit track:NaN --set "name=Track Name" --set "language=en" --set "flag-default=1" --set "flag-enabled=1" --set "flag-forced=1"', expect.anything())))
  })

  describe.skip('#update', () => {
    it('should update the file media info with new metadata')

    it('should add mux job to queue when mux is required')

    it('should not add mux job to queue when mux is not required')
  })

  describe('#generateInfoCommand', () => {
    let data

    beforeAll((done) => {
      data = {
        title: 'Test Movie',
        filename: 'test_movie.mkv',
        tracks: [
          {
            number: 0
          },
          {
            number: 1
          }
        ]
      }

      done()
    })

    it('should set the media title', () => {
      expect(MediaFile.generateInfoCommand(data)).toContain('--edit info --set "title=Test Movie"')
    })

    it('should delete track parameters when they are empty', () => {
      expect(MediaFile.generateInfoCommand(data)).toContain('--edit track:1 --delete name --delete language --set "flag-default=0" --set "flag-enabled=0" --set "flag-forced=0"')
    })

    it('should not have track in command if no tracks present', () => {
      expect(MediaFile.generateInfoCommand({
        title: 'Test Movie',
        filename: 'test_movie.mkv'
      })).not.toContain('--edit track')
    })

    it('should set each track parameter when not empty', () => {
      const instanceData = data

      instanceData.tracks[0].name = 'Track Name'
      instanceData.tracks[0].language = 'en'
      instanceData.tracks[0].isDefault = true
      instanceData.tracks[0].isEnabled = true
      instanceData.tracks[0].isForced = true
      expect(MediaFile.generateInfoCommand(instanceData)).toContain('--edit track:1 --set "name=Track Name" --set "language=en" --set "flag-default=1" --set "flag-enabled=1" --set "flag-forced=1"')
    })
  })

  describe('#generateMergeCommand', () => {
    let mergeFixture

    beforeEach(() => {
      mergeFixture = _.merge({}, this.movie)
    })

    it('should be an array', () => {
      expect(MediaFile.generateMergeCommand(mergeFixture)).toBeArray()
    })

    it('should contain \' -D\' if no video tracks to mux', () => {
      mergeFixture.tracks[0].isMuxed = false
      expect(MediaFile.generateMergeCommand(mergeFixture)).toContain('-D')
    })

    it('should contain \' -A\' if no audio tracks to mux', () => {
      mergeFixture.tracks[1].isMuxed = false
      expect(MediaFile.generateMergeCommand(mergeFixture)).toContain('-A')
    })

    it('should contain \' -S\' if no subtitle tracks to mux', () => {
      mergeFixture.tracks[2].isMuxed = false
      expect(MediaFile.generateMergeCommand(mergeFixture)).toContain('-S')
    })

    it('should contain \' -d track.number\' if one video track to mux', () => {
      let ret = MediaFile.generateMergeCommand(mergeFixture)
      expect(ret).toContain('-d')
      expect(ret).toContain(`${mergeFixture.tracks[0].number}`)
    })

    it('should contain \' -a track.number\' if one audio track to mux', () => {
      let ret = MediaFile.generateMergeCommand(mergeFixture)
      expect(ret).toContain('-a')
      expect(ret).toContain(`${mergeFixture.tracks[1].number}`)
    })

    it('should contain \' -s track.number\' if one subtitles track to mux', () => {
      let ret = MediaFile.generateMergeCommand(mergeFixture)
      expect(ret).toContain('-s')
      expect(ret).toContain(`${mergeFixture.tracks[2].number}`)
    })

    it('should contain \' -M\' to remove attachments', () => {
      expect(MediaFile.generateMergeCommand(mergeFixture)).toContain('-M')
    })

    it('should reorder tracks by newNumber', () => {
      mergeFixture.tracks[1].newNumber = 3
      mergeFixture.tracks[2].newNumber = 2

      let ret = MediaFile.generateMergeCommand(mergeFixture)
      expect(ret).toContain('--track-order')
      expect(ret).toContain('0:0,0:2,0:1')
    })

    it('should output to temporary file', () => {
      mergeFixture.filename = '/test/directory/filename.mkv'

      expect(MediaFile.generateMergeCommand(mergeFixture)).toContain('"/test/directory/filename.rmbtmp"')
    })

    it('should set title', () => {
      mergeFixture.title = 'Test Title'
      let ret = MediaFile.generateMergeCommand(mergeFixture)
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

    afterAll(done => {
      fs.rename.mockRestore()
      done()
    })

    it('should call mkvmerge through process.spawn', () => {
      MediaFile.mux(1, mergeFixture)
      expect(childProcess.spawn).toBeCalledWith('mkvmerge', expect.anything(), expect.anything())
    })

    describe('when \'data\' message is emitted', () => {
      it.skip('should aggregate error messages', () => {
        const event = MediaFile.mux(1, mergeFixture)
        this.eventStub.stdout.emit('data', Buffer.from('Error: Error #1'))
        this.eventStub.stdout.emit('data', Buffer.from('Error: Error #2'))
        this.eventStub.emit('exit', 2)
        return expect(event).rejectsToThrow('Received \'exit\' message with code \'2\'')
      })

      it('should call progress function with integer percent on progress', (done) => {
        const progressSpy = jest.fn()
        let muxEvent = MediaFile.mux(1, mergeFixture)

        muxEvent.on('progress', progressSpy)

        this.eventStub.stdout.emit('data', Buffer.from('Progress: 10%'))
        this.eventStub.stdout.emit('data', Buffer.from('Progress: 100%'))

        expect(progressSpy).toBeCalledTimes(2) // eslint-disable-line no-unused-expressions
        expect(progressSpy).nthCalledWith(1, 10)
        expect(progressSpy).nthCalledWith(2, 100)
        done()
      })
    })

    it.skip('should reject when \'error\' message is emitted', () => {
      const event = MediaFile.mux(1, mergeFixture)
      this.eventStub.emit('error', 'Error')
      return expect(event).rejects.toThrow('Received \'error\' message with \'Error\'')
    })

    it.skip('should resolve when \'exit\' message is received with code 0', () => {
      const event = MediaFile.mux(1, mergeFixture)
      this.eventStub.emit('exit', 0)
      return expect(event).to.eventually.be.fulfilled
    })

    it.skip('should resolve when \'exit\' message is received with code 1', () => {
      const event = MediaFile.mux(1, mergeFixture)
      this.eventStub.emit('exit', 1)
      return expect(event).to.eventually.be.fulfilled
    })

    it.skip('should resolve when \'exit\' message is received with code 2', () => {
      const event = MediaFile.mux(1, mergeFixture)
      this.eventStub.emit('exit', 2)
      return expect(event).to.eventually.be.rejectedWith(
        Error,
        'Received \'exit\' message with code \'2\''
      )
    })
  })
})
