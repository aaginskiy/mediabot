import MetadataEditor from '../metadata-editor'
import TrackFactory from '../__fixtures__/rules/track-factory'
import RuleFactory from '../__fixtures__/rules/rule-factory'
import movieAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).movie'
import { cloneDeep } from 'lodash'
import { Rule } from '../../declarations'
import { mocked } from 'ts-jest/utils'

const removeNonEngAudioRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'Eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'NotEql',
      parameter: 'language',
      value: 'eng',
    },
  ],
  actions: [
    {
      type: 'Remove',
      parameter: '',
      value: '',
    },
  ],
}

const removeNonOriginalLanguageAudioRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'Eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'NotEql',
      parameter: 'language',
      value: { path: 'originalLanguage' },
    },
  ],
  actions: [
    {
      type: 'Remove',
      parameter: '',
      value: '',
    },
  ],
}

const setNonOriginalLanguageAudioEngRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'Eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'NotEql',
      parameter: 'language',
      value: { path: 'originalLanguage' },
    },
  ],
  actions: [
    {
      type: 'Set',
      parameter: 'language',
      value: { path: 'originalLanguage' },
    },
  ],
}

describe("'Metadata Editor' service", () => {
  describe('checkTrackRule', () => {
    describe('when conditions match', () => {
      it('returns true if rule is matched', () => {
        const track = TrackFactory.createTrack({ isMuxed: false })
        const rule = RuleFactory.createRule({})

        expect(MetadataEditor.checkTrackRule(track, rule)).toBe(true)
      })

      it('returns false if rule is not matched', () => {
        const track = TrackFactory.createTrack({ isMuxed: true })
        const rule = RuleFactory.createRule({})

        expect(MetadataEditor.checkTrackRule(track, rule)).toBe(false)
      })
    })

    it('returns true if conditions do not match', () => {
      const track = TrackFactory.createTrack({ isMuxed: true, trackType: 'video' })
      const rule = RuleFactory.createRule({})

      expect(MetadataEditor.checkTrackRule(track, rule)).toBe(true)
    })
  })

  describe('checkRules', () => {
    it('returns false if any rule is not followed', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      const rule = RuleFactory.createRule(removeNonEngAudioRule)

      expect(MetadataEditor.checkRules(movie, [rule])).toBe(false)
    })

    it('returns true if all rules are followed', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles.tracks[2].language = 'eng'
      const rule = RuleFactory.createRule(removeNonEngAudioRule)
      expect(MetadataEditor.checkRules(movie, [rule])).toBe(true)
    })

    describe('when condition value is reference', () => {
      it('returns false if any rule is not followed', () => {
        const movie = cloneDeep(movieAvengersInfinityWar)
        const rule = RuleFactory.createRule(removeNonOriginalLanguageAudioRule)

        expect(MetadataEditor.checkRules(movie, [rule])).toBe(false)
      })

      it('returns true if all rules are followed', () => {
        const movie = cloneDeep(movieAvengersInfinityWar)
        movie.mediaFiles.tracks[2].language = 'eng'
        const rule = RuleFactory.createRule(removeNonOriginalLanguageAudioRule)

        expect(MetadataEditor.checkRules(movie, [rule])).toBe(true)
      })
    })

    it('returns true if no rules provided', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles.tracks[2].language = 'eng'
      expect(MetadataEditor.checkRules(movie, [])).toBe(true)
    })

    it('returns true if rules are undefined', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles.tracks[2].language = 'eng'
      expect(MetadataEditor.checkRules(movie, undefined)).toBe(true)
    })
  })

  describe('executeTrackRule', () => {
    describe('when conditions match', () => {
      it('returns track unmodified if rule is matched', () => {
        const track = TrackFactory.createTrack({ isMuxed: false })
        const rule = RuleFactory.createRule({})

        expect(MetadataEditor.executeTrackRule(track, rule)).toBe(track)
      })

      it('returns false if rule is not matched', () => {
        const track = TrackFactory.createTrack({ isMuxed: true })
        const rule = RuleFactory.createRule({})

        expect(MetadataEditor.executeTrackRule(track, rule)).toHaveProperty('isMuxed', false)
      })
    })
    it('returns track unmodified if conditions do not match', () => {
      const track = TrackFactory.createTrack({ isMuxed: true, trackType: 'video' })
      const rule = RuleFactory.createRule({})

      expect(MetadataEditor.executeTrackRule(track, rule)).toBe(track)
    })
  })

  describe('executeRules', () => {
    it('correctly sets track for removal', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      const rule = RuleFactory.createRule(removeNonEngAudioRule)

      expect(MetadataEditor.executeRules(movie, [rule]).mediaFiles.tracks[2]).toHaveProperty('isMuxed', false)
    })

    it('returns unmodified movie if rule already set', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles.tracks[2].isMuxed = false
      const rule = RuleFactory.createRule(removeNonEngAudioRule)

      expect(MetadataEditor.executeRules(movie, [rule]).mediaFiles.tracks[2]).toHaveProperty('isMuxed', false)
    })

    describe('when action value is reference', () => {
      it('changes value to value by reference', () => {
        const movie = cloneDeep(movieAvengersInfinityWar)
        const rule = RuleFactory.createRule(setNonOriginalLanguageAudioEngRule)

        expect(MetadataEditor.executeRules(movie, [rule]).mediaFiles.tracks[2]).toHaveProperty('language', 'eng')
      })
    })

    it('returns unmodified movie if no rules provided', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles.tracks[2].isMuxed = false

      expect(MetadataEditor.executeRules(movie, []).mediaFiles.tracks[2]).toHaveProperty('isMuxed', false)
    })

    it('returns unmodified movie if rules are undefined', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles.tracks[2].isMuxed = false

      expect(MetadataEditor.executeRules(movie, undefined).mediaFiles.tracks[2]).toHaveProperty('isMuxed', false)
    })
  })

  describe('__checkCondition', () => {
    it('should not call matchers if rule value is object', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      const rule = RuleFactory.createRule(removeNonOriginalLanguageAudioRule)
      jest.spyOn(MetadataEditor, 'checkNotEql')
      MetadataEditor.checkEntry(movie.mediaFiles.tracks[2], rule.conditions)

      expect(mocked(MetadataEditor.checkNotEql)).not.toBeCalled()
      mocked(MetadataEditor.checkNotEql).mockReset()
    })
  })
})
