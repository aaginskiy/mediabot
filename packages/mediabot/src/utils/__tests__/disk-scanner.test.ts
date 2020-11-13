// jest.mock('fast-glob')
jest.mock('child_process')
jest.mock('fs')
import { mocked } from 'ts-jest/utils'
import childProcess from 'child_process'
import 'jest-extended'
import {
  findAllMediaFiles,
  loadMediainfoFromFile,
  writeMediainfo,
  muxMediaFile,
  loadMetadataFromNfo,
  parseFilename,
} from '../disk-scanner'
import { cloneDeep, merge } from 'lodash'

import mediainfoAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mediainfo'
import mkvpropeditAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkvpropedit'
import tmdbAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).tmdbinfo'

describe('media-scraper utility', () => {
  describe('parseFilename', () => {
    it('parses year from regular directory name with space', () => {
      const result = parseFilename('/movies/Avengers Endgame (2019)/Avengers Endgame (2019).mkv')
      expect(result.year).toBe(2019)
    })

    it('parses year from regular directory name with period', () => {
      const result = parseFilename('/movies/Avengers.Endgame.(2019)/Avengers.Endgame.(2019).mkv')
      expect(result.year).toBe(2019)
    })

    it('parses year from regular directory name with space', () => {
      const result = parseFilename('/movies/Avengers Endgame (2019)/Avengers Endgame (2019).mkv')
      expect(result.title).toBe('Avengers Endgame')
    })

    it('parses year from regular directory name with period', () => {
      const result = parseFilename('/movies/Avengers.Endgame.(2019)/Avengers.Endgame.(2019).mkv')
      expect(result.title).toBe('Avengers Endgame')
    })
  })

  describe('findAllMediaFiles', () => {
    it('finds new media files', async () => {
      const result = await findAllMediaFiles('/movies', [
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        '/movies/Removed Movie (2018)/Removed Movie (2018).mkv',
      ])

      expect(result).toHaveProperty('created', expect.toBeArray())
      expect(result.created).toBeArrayOfSize(1)
      expect(result.created[0]).toBe('/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).mkv')
    })

    it('finds existing movies', async () => {
      const result = await findAllMediaFiles('/movies', [
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        '/movies/Removed Movie (2018)/Removed Movie (2018).mkv',
      ])

      expect(result).toHaveProperty('updated', expect.toBeArray())
      expect(result.updated).toBeArrayOfSize(1)
      expect(result.updated[0]).toBe('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
    })

    it('finds removed movies', async () => {
      const result = await findAllMediaFiles('/movies', [
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        '/movies/Removed Movie (2018)/Removed Movie (2018).mkv',
      ])

      expect(result).toHaveProperty('removed', expect.toBeArray())
      expect(result.removed).toBeArrayOfSize(1)
      expect(result.removed[0]).toBe('/movies/Removed Movie (2018)/Removed Movie (2018).mkv')
    })
  })

  describe('loadMetadataFromFile', () => {
    it('throws a TypeError if filename is empty', () => expect(loadMediainfoFromFile('')).rejects.toThrow(TypeError))

    it('throws an error when file is not found', () =>
      expect(loadMediainfoFromFile('/movies/Removed Movie (2018)/Removed Movie (2018).mkv')).rejects.toThrow(
        'Command failed'
      ))

    it('throws an error of JSON cannot be read', () =>
      expect(loadMediainfoFromFile('/movies/Bad JSON (2018)/Bad JSON (2018).mkv')).rejects.toThrow(
        'Unexpected token u in JSON at position 0'
      ))

    it('returns an object', () =>
      expect(
        loadMediainfoFromFile('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
      ).toBeObject())

    it("has 'dir' property", () =>
      expect(
        loadMediainfoFromFile('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
      ).resolves.toHaveProperty('dir', '/movies/Avengers Infinity War (2018)'))

    it("has 'files' (Array) property", async () => {
      const mediainfo = await loadMediainfoFromFile(
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv'
      )
      expect(mediainfo.files).toBeArray()
      expect(mediainfo.files).toContain('Avengers Infinity War (2018).nfo')
    })

    it("has 'poster' property", () =>
      expect(
        loadMediainfoFromFile('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
      ).resolves.toHaveProperty('poster', 'Avengers Infinity War (2018)-poster.jpg'))

    it("has 'fanart' property", () =>
      expect(
        loadMediainfoFromFile('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
      ).resolves.toHaveProperty('fanart', 'Avengers Infinity War (2018)-fanart.jpg'))

    it("has 'nfo' property", () =>
      expect(
        loadMediainfoFromFile('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
      ).resolves.toHaveProperty('nfo', 'Avengers Infinity War (2018).nfo'))

    it("sets 'videoTag' to default video", () =>
      expect(
        loadMediainfoFromFile('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
      ).resolves.toHaveProperty('videoTag', 'MPEG-H/HEVC/H.265'))

    it("sets 'audioTag' to default audio", () =>
      expect(
        loadMediainfoFromFile('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv')
      ).resolves.toHaveProperty('audioTag', 'TrueHD Atmos 8ch'))
  })

  describe('writeMediainfo', () => {
    beforeEach((done) => {
      mocked(childProcess.exec).mockClear()
      done()
    })

    it('should set the media title', () => {
      writeMediainfo(
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        mediainfoAvengersInfinityWar
      )

      expect(mocked(childProcess.exec).mock.calls[0][0]).toContain(
        '--edit info --set "title=Avengers Infinity War (2018)"'
      )
    })

    it('should delete track parameters when they are empty', () => {
      writeMediainfo(
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        mediainfoAvengersInfinityWar
      )
      expect(mocked(childProcess.exec).mock.calls[0][0]).toContain(
        '--edit track:1 --delete name --delete language --set "flag-default=0" --set "flag-enabled=0" --set "flag-forced=0"'
      )
    })

    it('should not have track in command if no tracks present', () => {
      const data = cloneDeep(mediainfoAvengersInfinityWar)
      data.tracks = []

      writeMediainfo('/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv', data)
      expect(mocked(childProcess.exec).mock.calls[0][0]).not.toContain('--edit track')
    })

    it('should set each track parameter when not empty', () => {
      writeMediainfo(
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        mediainfoAvengersInfinityWar
      )

      expect(mocked(childProcess.exec).mock.calls[0][0]).toContain(
        '--edit track:2 --set "name=Main Track" --set "language=eng" --set "flag-default=1" --set "flag-enabled=1" --set "flag-forced=0"'
      )
    })

    it('should call mkvpropedit with the right command', () =>
      writeMediainfo(
        '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).mkv',
        mediainfoAvengersInfinityWar
      ).then(() => expect(childProcess.exec).toBeCalledWith(mkvpropeditAvengersInfinityWar, expect.anything())))
  })

  describe('muxMediaFile', () => {
    let mergeFixture

    beforeEach(() => {
      mergeFixture = merge({}, mediainfoAvengersInfinityWar)
      mocked(childProcess.spawn).mockClear()
    })

    it('should call mkvmerge with options', () => {
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)
      expect(mocked(childProcess.spawn).mock.calls[0][1]).toBeArray()
    })

    it("should call mkvmerge with option ' -D' if no video tracks to mux", () => {
      mergeFixture.tracks[0].isMuxed = false
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('-D')
    })

    it("should call mkvmerge with option ' -A' if no audio tracks to mux", () => {
      mergeFixture.tracks[1].isMuxed = false
      mergeFixture.tracks[2].isMuxed = false
      mergeFixture.tracks[3].isMuxed = false
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('-A')
    })

    it("should call mkvmerge with option ' -S' if no subtitle tracks to mux", () => {
      mergeFixture.tracks[4].isMuxed = false
      mergeFixture.tracks[5].isMuxed = false
      mergeFixture.tracks[6].isMuxed = false
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('-S')
    })

    it("should call mkvmerge with option ' -d track.number' if one video track to mux", () => {
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)
      const index = mocked(childProcess.spawn).mock.calls[0][1].indexOf('-d')

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('-d')
      expect(mocked(childProcess.spawn).mock.calls[0][1][index + 1]).toBe('0')
    })

    it("should call mkvmerge with option ' -a track.number' if one audio track to mux", () => {
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)
      const index = mocked(childProcess.spawn).mock.calls[0][1].indexOf('-a')

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('-a')
      expect(mocked(childProcess.spawn).mock.calls[0][1][index + 1]).toBe('1,2,3')
    })

    it("should call mkvmerge with option ' -s track.number' if one subtitles track to mux", () => {
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)
      const index = mocked(childProcess.spawn).mock.calls[0][1].indexOf('-s')

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('-s')
      expect(mocked(childProcess.spawn).mock.calls[0][1][index + 1]).toBe('4,5,6')
    })

    it("should call mkvmerge with option ' -M' to remove attachments", () => {
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('-M')
    })

    it('should reorder tracks by newNumber', () => {
      mergeFixture.tracks[1].newNumber = 3
      mergeFixture.tracks[2].newNumber = 2
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('--track-order')
      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('0:0,0:2,0:1,0:3,0:4,0:5,0:6')
    })

    it('should output to temporary file', () => {
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain(
        '"/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).rmbtmp"'
      )
    })

    it('should set title', () => {
      muxMediaFile('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv', mergeFixture)
      const index = mocked(childProcess.spawn).mock.calls[0][1].indexOf('--title')

      expect(mocked(childProcess.spawn).mock.calls[0][1]).toContain('--title')
      expect(mocked(childProcess.spawn).mock.calls[0][1][index + 1]).toBe('"Avengers Infinity War (2018)"')
    })

    it('should call progress function with integer percent on progress', (done) => {
      const spy = jest.fn()
      const muxEvent = muxMediaFile(
        '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv',
        mergeFixture
      )

      muxEvent.on('progress', spy)

      mocked(childProcess as any).__stdout_emit('data', Buffer.from('Progress: 10%'))
      mocked(childProcess as any).__stdout_emit('data', Buffer.from('Progress: 100%'))

      expect(spy).toBeCalledTimes(2)
      expect(spy).nthCalledWith(1, 10)
      expect(spy).nthCalledWith(2, 100)
      done()
    })

    it("should emit 'error' when 'error' message is received", (done) => {
      const spy = jest.fn()
      const muxEvent = muxMediaFile(
        '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv',
        mergeFixture
      )

      muxEvent.on('error', spy)

      mocked(childProcess as any).__emit('error', new Error('test error'))

      expect(spy).toBeCalledTimes(1)
      expect(spy).nthCalledWith(1, expect.any(Error))
      done()
    })

    it("should emit 'done' when 'exit' message is received with code 0", (done) => {
      const spy = jest.fn()
      const muxEvent = muxMediaFile(
        '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv',
        mergeFixture
      )

      muxEvent.on('done', spy)

      mocked(childProcess as any).__emit('exit', 0)

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1)
        expect(spy).nthCalledWith(
          1,
          "Received 'exit' message with code '0' from mkvmerge on '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv'"
        )
        done()
      }, 0)
    })

    it("should emit 'done' when 'exit' message is received with code 1", (done) => {
      const spy = jest.fn()
      const muxEvent = muxMediaFile(
        '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv',
        mergeFixture
      )

      muxEvent.on('done', spy)

      mocked(childProcess as any).__emit('exit', 1)

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1)
        expect(spy).nthCalledWith(
          1,
          "Received 'exit' message with code '1' from mkvmerge on '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv'"
        )
        done()
      }, 0)
    })

    it("should resolve when 'exit' message is received with code 2", (done) => {
      const spy = jest.fn()
      const muxEvent = muxMediaFile(
        '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv',
        mergeFixture
      )

      muxEvent.on('error', spy)

      mocked(childProcess as any).__emit('exit', 2)

      setTimeout(() => {
        expect(spy).toBeCalledTimes(1)
        expect(spy).nthCalledWith(1, expect.any(Error))
        done()
      }, 0)
    })
  })

  describe('loadMetadataFromNfo', () => {
    it('loads metadata from NFO', async () => {
      const result = await loadMetadataFromNfo('/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).nfo')

      expect(result).toEqual(tmdbAvengersInfinityWar)
    })
  })
})
