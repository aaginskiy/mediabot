/* global describe it afterEach beforeEach beforeAll afterAll expect jest */
const feathers = require('@feathersjs/feathers')
const logger = require('feathers-logger')
const MetadataEditorService = require('../metadata-editor.service')
const {tracks, rules} = require('../__fixtures__/media-tracks.fixture')
const movies = require('../__fixtures__/movies.fixture')
const { cloneDeep } = require('lodash')

describe('\'Metadata Editor\' service', () => {
  let app, MetadataEditor

  beforeAll((done) => {
    app = feathers()
    app.configure(logger())
    app.silly = console.log
    app.configure(MetadataEditorService)
    app.setup()

    MetadataEditor = app.service('/utils/metadata-editor')

    done()
  })

  it('register the service', () => expect(MetadataEditor).toBeTruthy())

  describe('#checkTrackRule', () => {
    describe('when conditions match', () => {
      it('returns true if rule is matched', () => {
        let track = cloneDeep(tracks.frenchAudioTrack)
        track.isMuxed = false
        expect(MetadataEditor.checkTrackRule(track, rules.removeFrenchAudio)).toBe(true)
      })

      it('returns false if rule is not matched', () => {
        let track = cloneDeep(tracks.frenchAudioTrack)
        track.isMuxed = true
        expect(MetadataEditor.checkTrackRule(track, rules.removeFrenchAudio)).toBe(false)
      })
    })

    it('returns true if conditions do not match', () => {
      let track = cloneDeep(tracks.frenchAudioTrack)
      track.isMuxed = true
      track.type = 'video'
      expect(MetadataEditor.checkTrackRule(track, rules.removeFrenchAudio)).toBe(true)
    })
  })

  describe('#executeTrackRule', () => {
    describe('when conditions match', () => {
      it('returns track unmodified if rule is matched', () => {
        let track = cloneDeep(tracks.frenchAudioTrack)
        track.isMuxed = false
        expect(MetadataEditor.executeTrackRule(track, rules.removeFrenchAudio)).toBe(track)
      })

      it('returns false if rule is not matched', () => {
        let track = cloneDeep(tracks.frenchAudioTrack)
        track.isMuxed = true
        expect(MetadataEditor.executeTrackRule(track, rules.removeFrenchAudio)).toHaveProperty('isMuxed', false)
      })
    })
    it('returns track unmodified if conditions do not match', () => {
      let track = cloneDeep(tracks.frenchAudioTrack)
      track.isMuxed = true
      track.type = 'video'
      expect(MetadataEditor.executeTrackRule(track, rules.removeFrenchAudio)).toBe(track)
    })
  })

  describe('#checkRules', () => {
    it('returns false if any rule is not followed', () =>
      expect(MetadataEditor.checkRules(movies.withNonEnSubtitlesUnfixed, [rules.removeNonEnAudio])).toBe(false))

    it('returns true if all rules are followed', () =>
      expect(MetadataEditor.checkRules(movies.withNonEnSubtitlesFixed, [rules.removeNonEnAudio])).toBe(true))

    describe('when condition value is reference', () => {
      it('returns false if any rule is not followed', () =>
        expect(MetadataEditor.checkRules(movies.withNonEnSubtitlesUnfixed, [rules.removeNonOriginalLanguageAudio])).toBe(false))

      it('returns true if all rules are followed', () =>
        expect(MetadataEditor.checkRules(movies.withNonEnSubtitlesFixed, [rules.removeNonOriginalLanguageAudio])).toBe(true))
    })
  })

  describe('#executeRules', () => {
    it('correctly sets track for removal', () =>
      expect(MetadataEditor.executeRules(movies.withNonEnSubtitlesUnfixed, [rules.removeNonEnAudio]).tracks[2]).toHaveProperty('isMuxed', false))

    it('returns unmodified movie if rule already set', () =>
      expect(MetadataEditor.executeRules(movies.withNonEnSubtitlesFixed, [rules.removeNonEnAudio]).tracks[2]).toHaveProperty('isMuxed', false))

    describe('when action value is reference', () => {
      it('changes value to value by reerence', () =>
        expect(MetadataEditor.executeRules(movies.withNonEnSubtitlesFixed, [rules.changeNonOriginalLanguageAudio]).tracks[2]).toHaveProperty('language', 'en'))
    })
  })
})
