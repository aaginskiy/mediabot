/* eslint-disable @typescript-eslint/no-non-null-assertion */
import { applyRules, parseValue } from '../metadata-editor'
import movieAvengersInfinityWar from '../__fixtures__/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).movie'
import { cloneDeep, omit } from 'lodash'
import { MovieInfo, Rule } from '@/declarations'
import { isBoth, isRight } from 'fp-ts/lib/These'
import { checkEql, checkNotEql } from '../metadata-editor/eql'

function assert<T>(guard: (o: any) => o is T, o: any): asserts o is T {
  if (!guard(o)) throw new Error() // or add param for custom error
}

const removeNonEngAudioRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'notEql',
      parameter: 'language',
      value: 'eng',
    },
  ],
  actions: [
    {
      type: 'remove',
      parameter: '',
      value: '',
    },
  ],
}

const removeNoConditionsRule: Rule = {
  type: 'track',
  conditions: [],
  actions: [
    {
      type: 'remove',
      parameter: '',
      value: '',
    },
  ],
}

const setTitleForNonEngAudioRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'notEql',
      parameter: 'language',
      value: 'eng',
    },
  ],
  actions: [
    {
      type: 'set',
      parameter: 'title',
      value: '{{title}}',
    },
  ],
}

const setFileTitleToOriginalTitleRule: Rule = {
  type: 'file',
  conditions: [
    {
      type: 'eql',
      parameter: 'title',
      value: '',
    },
  ],
  actions: [
    {
      type: 'set',
      parameter: 'title',
      value: '{{title}}',
    },
  ],
}

const setFileTitleToAvengers: Rule = {
  type: 'file',
  conditions: [
    {
      type: 'eql',
      parameter: 'title',
      value: '',
    },
  ],
  actions: [
    {
      type: 'set',
      parameter: 'title',
      value: 'Avengers',
    },
  ],
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const removeNonOriginalLanguageAudioRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'notEql',
      parameter: 'language',
      value: '{{originalLanguage}}',
    },
  ],
  actions: [
    {
      type: 'remove',
      parameter: '',
      value: '',
    },
  ],
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const setNonOriginalLanguageAudioEngRule: Rule = {
  type: 'track',
  conditions: [
    {
      type: 'eql',
      parameter: 'trackType',
      value: 'audio',
    },
    {
      type: 'notEql',
      parameter: 'language',
      value: '{{originalLanguage}}',
    },
  ],
  actions: [
    {
      type: 'set',
      parameter: 'language',
      value: '{{originalLanguage}}',
    },
  ],
}

describe("'Metadata Editor' service", () => {
  describe('parseValue', () => {
    it('replaces template with value', () =>
      expect(
        parseValue(cloneDeep(movieAvengersInfinityWar))({
          type: 'notEql',
          parameter: 'language',
          value: '{{originalLanguage}}',
        }).value
      ).toBe('eng'))

    it('does not update parameter if index is not provided', () =>
      expect(
        parseValue(cloneDeep(movieAvengersInfinityWar))({
          type: 'notEql',
          parameter: 'language',
          value: '{{originalLanguage}}',
        }).parameter
      ).toBe('language'))

    it('updates parameter with current track index if index is provided', () =>
      expect(
        parseValue(
          cloneDeep(movieAvengersInfinityWar),
          1
        )({
          type: 'notEql',
          parameter: 'language',
          value: '{{originalLanguage}}',
        }).parameter
      ).toBe('tracks[1].language'))
  })

  describe('applyRules', () => {
    it('returns unmodified movie if no rules provided', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      const movieInfo: MovieInfo = omit(movie, ['tracks'])
      const mediaFile = movie.mediaFiles!

      const result = applyRules(mediaFile, [], movieInfo)
      assert(isRight, result)
      expect(result.right).toStrictEqual(mediaFile)
    })

    it('correctly updates track details', () => {
      const result = applyRules(movieAvengersInfinityWar.mediaFiles!, [removeNonEngAudioRule], movieAvengersInfinityWar)
      assert(isBoth, result)
      expect(result.right.tracks[2]).toHaveProperty('isMuxed', false)
    })

    it('correctly updates track details when template value', () => {
      const result = applyRules(
        movieAvengersInfinityWar.mediaFiles!,
        [setTitleForNonEngAudioRule],
        movieAvengersInfinityWar
      )
      assert(isBoth, result)
      expect(result.right).toHaveProperty('title', 'Avengers Infinity War (2018)')
    })

    it('correctly updates file details', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles!.title = ''

      const result = applyRules(movie.mediaFiles!, [setFileTitleToAvengers], movie)

      assert(isBoth, result)
      expect(result.right).toHaveProperty('title', 'Avengers')
    })

    it('correctly updates file details when template value', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles!.title = ''

      const result = applyRules(movie.mediaFiles!, [setFileTitleToOriginalTitleRule], movie)

      assert(isBoth, result)
      expect(result.right).toHaveProperty('title', 'Avengers Infinity War (2018)')
    })

    it('correctly applies multiple rules', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles!.title = ''

      const result = applyRules(movie.mediaFiles!, [setFileTitleToOriginalTitleRule, removeNonEngAudioRule], movie)

      assert(isBoth, result)
      expect(result.right).toHaveProperty('title', 'Avengers Infinity War (2018)')
      expect(result.right.tracks[2]).toHaveProperty('isMuxed', false)
    })

    it('returns unmodified movie if rule already set', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles!.tracks[2].isMuxed = false
      const result = applyRules(movie.mediaFiles!, [removeNonEngAudioRule], movie)
      assert(isRight, result)
      expect(result.right).toStrictEqual(movie.mediaFiles!)
    })

    it('returns unmodified movie if no conditions', () => {
      const movie = cloneDeep(movieAvengersInfinityWar)
      movie.mediaFiles!.tracks[2].isMuxed = false
      const result = applyRules(movie.mediaFiles!, [removeNoConditionsRule], movie)
      assert(isRight, result)
      expect(result.right).toStrictEqual(movie.mediaFiles!)
    })
  })

  describe('checkers', () => {
    describe('checkEql', () => {
      it('should return unmodified mediaFile if condition matches', () =>
        expect(
          checkEql({ type: 'eql', parameter: 'title', value: 'Avengers Infinity War (2018)' })(
            movieAvengersInfinityWar.mediaFiles!
          )
        ).toStrictEqualRight(movieAvengersInfinityWar.mediaFiles!))

      it('should return ValidationError if conditions do not match', () =>
        expect(
          checkEql({ type: 'eql', parameter: 'title', value: 'Not Avengers' })(movieAvengersInfinityWar.mediaFiles!)
        ).toEqualLeft(expect.arrayContaining([{ path: 'title', message: expect.anything() }])))
    })

    describe('checkNotEql', () => {
      it('should return unmodified mediaFile if condition matches', () =>
        expect(
          checkNotEql({ type: 'notEql', parameter: 'title', value: 'Not Avengers' })(
            movieAvengersInfinityWar.mediaFiles!
          )
        ).toStrictEqualRight(movieAvengersInfinityWar.mediaFiles!))

      it('should return ValidationError if conditions do not match', () =>
        expect(
          checkNotEql({ type: 'notEql', parameter: 'title', value: 'Avengers Infinity War (2018)' })(
            movieAvengersInfinityWar.mediaFiles!
          )
        ).toEqualLeft(expect.arrayContaining([{ path: 'title', message: expect.anything() }])))
    })
  })

  describe('validators', () => {
    describe('validateSet', () => {
      it.todo('should return unmodified mediaFile if action is already applied')

      it.todo('should return ValidationError and modified mediaFile if action is not already applied')
    })

    describe('validateRemove', () => {
      it.todo('should return unmodified mediaFile if action is already applied')

      it.todo('should return ValidationError and modified mediaFile if action is not already applied')
    })
  })
})
