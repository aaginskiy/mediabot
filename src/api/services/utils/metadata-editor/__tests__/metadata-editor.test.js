/* global describe it afterEach beforeEach beforeAll afterAll expect jest */
const feathers = require('@feathersjs/feathers')
const logger = require('feathers-logger')
const MetadataEditorService = require('../metadata-editor.service')

const audioLanguageData = {
  title: 'Movie Title',
  filename: 'test_movie.mkv',
  language: 'eng',
  tracks: [{
    name: 'Track Name',
    type: 'audio',
    language: 'eng',
    isDefault: true,
    isEnabled: true,
    isForced: true,
    isMuxed: false
  }, {
    name: 'Track Name',
    type: 'audio',
    language: 'fra',
    isDefault: true,
    isEnabled: true,
    isForced: true,
    isMuxed: false
  }]
}

const videoLanguageData = {
  title: 'Movie Title',
  filename: 'test_movie.mkv',
  language: 'eng',
  tracks: [ {
    name: 'Track Name',
    type: 'video',
    language: 'und',
    isDefault: true,
    isEnabled: true,
    isForced: true
  }, {
    name: 'Track Name',
    type: 'subtitles',
    language: 'und',
    isDefault: true,
    isEnabled: true,
    isForced: true
  }, {
    name: 'Track Name',
    type: 'subtitles',
    language: 'fra',
    isDefault: true,
    isEnabled: true,
    isForced: true
  }, {
    name: 'Track Name',
    type: 'subtitles',
    language: 'eng',
    isDefault: true,
    isEnabled: true,
    isForced: true,
    isMuxed: false
  }, {
    name: 'Track Name',
    type: 'audio',
    language: 'eng',
    isDefault: true,
    isEnabled: true,
    isForced: true,
    isMuxed: false
  }, {
    name: 'Track Name',
    type: 'audio',
    language: 'fra',
    isDefault: true,
    isEnabled: true,
    isForced: true,
    isMuxed: false
  }]
}

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

  describe('#setVideoLanguage', () => {
    it('changes video language to match movie language', async () =>
      expect(MetadataEditor.setVideoLanguage(videoLanguageData).tracks[0]).toHaveProperty('language', 'eng'))
  })

  describe('#removeNonEngSubtitles', () => {
    it('marks non-Eng subtitles for removal', async () =>
      expect(MetadataEditor.removeNonEngSubtitles(videoLanguageData).tracks[2]).toHaveProperty('isMuxed', false))

    it('marks Eng subtitles to keep', async () =>
      expect(MetadataEditor.removeNonEngSubtitles(videoLanguageData).tracks[3]).toHaveProperty('isMuxed', true))
  })

  describe('#removeUnmatchedAudio', () => {
    it('ignores if movie language is not defined', async () =>
      expect(MetadataEditor.removeNonEngSubtitles(videoLanguageData).tracks[2]).toHaveProperty('isMuxed', false))

    it('marks Eng subtitles to keep', async () =>
      expect(MetadataEditor.removeNonEngSubtitles(videoLanguageData).tracks[3]).toHaveProperty('isMuxed', true))
  })

  describe('#undefaultSubtitles', () => {
    it('marks non-Eng subtitles for removal', async () =>
      expect(MetadataEditor.undefaultSubtitles(videoLanguageData).tracks[2]).toHaveProperty('isDefault', false))

    it('marks Eng subtitles to keep', async () =>
      expect(MetadataEditor.undefaultSubtitles(videoLanguageData).tracks[3]).toHaveProperty('isDefault', false))
  })
})
