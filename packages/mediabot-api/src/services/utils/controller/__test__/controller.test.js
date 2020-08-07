/* global describe it afterEach beforeEach beforeAll afterAll expect jest */
jest.mock('../../disk-scanner/disk-scanner.class')
jest.mock('../../media-scraper/media-scraper.class')
jest.mock('../../metadata-editor/metadata-editor.class')

const feathers = require('@feathersjs/feathers')
const memory = require('feathers-memory')
const fs = require('fs')

const ControllerService = require('../controller.service')
const DiskScannerService = require('../../disk-scanner/disk-scanner.service')
const MediaScraperService = require('../../media-scraper/media-scraper.service')
const MetadataEditorService = require('../../metadata-editor/metadata-editor.service')

const app = feathers()
app.use('/movies', memory({ id: '_id' }))
app.use('/jobs', memory({ id: '_id' }))
app.configure(ControllerService)
app.configure(DiskScannerService)
app.configure(MediaScraperService)
app.configure(MetadataEditorService)
app.setup()

const Controller = app.service('utils/controller')
const Movies = app.service('movies')
const Jobs = app.service('jobs')
const DiskScanner = app.service('utils/disk-scanner')

describe("'Controller' service", () => {
  it('register the service', () => expect(Controller).toBeTruthy())

  describe('#refreshAllMovies', () => {
    beforeEach(async () => {
      Movies.create([
        { filename: '/fake/system/zathura3/zathura3.mkv' },
        { filename: '/fake/system/zathura4/zathura4.mkv' },
      ])
    })

    afterEach((done) => {
      DiskScanner.findAllMediaFiles.mockRestore()
      Movies.remove(null)
      done()
    })

    it('adds new media', async () => {
      jest.spyOn(DiskScanner, 'findAllMediaFiles').mockResolvedValue({
        created: ['/fake/system/zathura1/zathura1.mkv', '/fake/system/zathura2/zathura2.mkv'],
        updated: [],
        removed: [],
      })

      jest.spyOn(Jobs, 'create')

      await Controller.refreshAllMovies('/fake/system/')
      expect(Jobs.create).toHaveBeenNthCalledWith(
        1,
        expect.arrayContaining([
          {
            args: expect.any(Array),
            name: expect.stringMatching('RefreshMovie'),
          },
        ]),
        {}
      )

      Jobs.create.mockRestore()
    })

    it('removes missing media', async () => {
      jest.spyOn(DiskScanner, 'findAllMediaFiles').mockResolvedValue({
        created: [],
        updated: [],
        removed: ['/fake/system/delete/delete.mkv'],
      })

      jest.spyOn(Movies, 'remove')

      await Controller.refreshAllMovies('/fake/system/')

      expect(Movies.remove).toBeCalled()
      expect(Movies.remove).toBeCalledWith(
        null,
        expect.objectContaining({
          query: {
            filename: {
              $in: ['/fake/system/delete/delete.mkv'],
            },
          },
        })
      )

      Movies.remove.mockRestore()
    })

    it('refreshes existing media', async () => {
      jest.spyOn(DiskScanner, 'findAllMediaFiles').mockResolvedValue({
        created: [],
        updated: ['/fake/system/zathura3/zathura3.mkv', '/fake/system/zathura4/zathura4.mkv'],
        removed: [],
      })

      jest.spyOn(Jobs, 'create')

      await Controller.refreshAllMovies('/fake/system/')

      expect(Jobs.create).toBeCalledTimes(2)
      expect(Jobs.create).toHaveBeenNthCalledWith(
        2,
        expect.arrayContaining([
          {
            args: expect.any(Array),
            name: expect.stringMatching('RefreshMovie'),
          },
        ]),
        {}
      )

      Jobs.create.mockRestore()
    })
  })

  describe('#refreshMovie', () => {
    let movieId

    beforeEach((done) => {
      return Movies.create([
        {
          filename: '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        },
      ]).then((movie) => {
        movieId = movie[0]._id
        done()
      })
    })

    afterEach(async () => {
      return Movies.remove(null)
    })

    it('updates media by tmdbId', async () => {
      jest.spyOn(Movies, 'update')
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)

      await Controller.refreshMovie(movieId)

      expect(Movies.update).toBeCalledWith(
        movieId,
        expect.objectContaining({
          title: 'Avengers: Infinity War',
        })
      )

      fs.existsSync.mockRestore()
      Movies.update.mockRestore()
    })

    it('updates media by name if tmdbId is missing', async () => {
      jest.spyOn(Movies, 'update')
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)

      DiskScanner.__changeNfoMock('uniqueid.tmdbid', null)

      await Controller.refreshMovie(movieId)

      expect(Movies.update).toBeCalledWith(
        movieId,
        expect.objectContaining({
          tmdbId: null,
          title: 'Avengers: Infinity War',
        })
      )

      DiskScanner.__resetNfoMock()
      fs.existsSync.mockRestore()
      Movies.update.mockRestore()
    })

    it('updates media by name if tmdbId and name missing', async () => {
      jest.spyOn(Movies, 'update')
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)

      DiskScanner.__changeNfoMock('uniqueid.tmdbid', null)
      DiskScanner.__changeNfoMock('title', null)

      await Controller.refreshMovie(movieId)

      expect(Movies.update).toBeCalledWith(
        movieId,
        expect.objectContaining({
          tmdbId: null,
          title: 'Avengers Infinity War',
        })
      )

      DiskScanner.__resetNfoMock()
      fs.existsSync.mockRestore()
      Movies.update.mockRestore()
    })

    it('updates media by name if tmdbId and year missing', async () => {
      jest.spyOn(Movies, 'update')
      jest.spyOn(fs, 'existsSync').mockImplementation(() => true)

      DiskScanner.__changeNfoMock('uniqueid.tmdbid', null)
      DiskScanner.__changeNfoMock('year', null)

      await Controller.refreshMovie(movieId)

      expect(Movies.update).toBeCalledWith(
        movieId,
        expect.objectContaining({
          tmdbId: null,
          title: 'Avengers Infinity War',
        })
      )

      DiskScanner.__resetNfoMock()
      fs.existsSync.mockRestore()
      Movies.update.mockRestore()
    })

    it('updates media by name and year if nfo missing', async () => {
      jest.spyOn(Movies, 'update')
      jest.spyOn(fs, 'existsSync').mockImplementation(() => false)

      await Controller.refreshMovie(movieId)

      expect(Movies.update).toBeCalledWith(
        movieId,
        expect.objectContaining({
          title: 'Avengers Infinity War',
        })
      )

      fs.existsSync.mockRestore()
      Movies.update.mockRestore()
    })

    it('propogates error', async () => {
      jest.spyOn(fs, 'existsSync').mockImplementation(() => {
        throw new Error('existsSync Error')
      })

      await Controller.refreshMovie(movieId).catch((e) => {
        expect(e.message).toEqual('existsSync Error')
      })

      fs.existsSync.mockRestore()
    })
  })
})
