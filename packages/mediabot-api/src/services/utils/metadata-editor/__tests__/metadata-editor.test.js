/* global describe it afterEach beforeEach beforeAll afterAll expect jest */
const feathers = require('@feathersjs/feathers')
const logger = require('feathers-logger')
const MetadataEditorService = require('../metadata-editor.service')
const {tracks, rules} = require('../__fixtures__/media-tracks.fixture')
const movies = require('../__fixtures__/movies.fixture')

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
        let track = tracks.frenchAudioTrack
        track.isMuxed = false
        expect(MetadataEditor.checkTrackRule(track, rules.removeFrenchAudio)).toBe(true)
      })

      it('returns true if rule is matched', () => {
        let track = tracks.frenchAudioTrack
        track.isMuxed = true
        expect(MetadataEditor.checkTrackRule(track, rules.removeFrenchAudio)).toBe(false)
      })
    })

    it('returns true if conditions do not match', () => {
      let track = tracks.frenchAudioTrack
      track.isMuxed = true
      track.type = 'video'
      expect(MetadataEditor.checkTrackRule(track, rules.removeFrenchAudio)).toBe(true)
    })
  })

  describe('#checkRules', () => {
    it('returns false if any rule is not followed', () =>
      expect(MetadataEditor.checkRules(movies.withNonEngSubtitlesUnfixed, [rules.removeNonEngAudio])).toBe(false))

    it('returns true if all rules are followed', () =>
      expect(MetadataEditor.checkRules(movies.withNonEngSubtitlesFixed, [rules.removeNonEngAudio])).toBe(true))
  })
})
