/* global describe it expect beforeEach beforeAll */
const checkMux = require('../../../src/api/hooks/check-mux')

// Initialize our hook with no options

var mock = { data: {} }
const hook = checkMux()

describe('\'check-mux\' hook', () => {
  describe('when \'type\' is \'after\'', () => {
    beforeAll(() => {
      mock.type = 'after'
    })

    it('should throw an error', () => {
      expect(hook.bind(null, mock)).toThrowError()
    })
  })

  describe('when \'type\' is \'before\'', () => {
    beforeAll(() => {
      mock.type = 'before'
    })

    let badVerbTypes = ['find', 'get', 'remove', 'patch']

    badVerbTypes.forEach(method => {
      it(`should throw an error when 'method' is '${method}'`, () => {
        mock.method = method
        expect(hook.bind(null, mock)).toThrowError()
      })
    })

    let goodVerbTypes = ['create', 'update']

    goodVerbTypes.forEach(method => {
      describe(`and when 'method' is '${method}'`, () => {
        beforeAll(() => {
          mock.method = method
        })

        beforeEach(() => {
          mock.data = {}
        })

        it('should not throw an error', () => {
          expect(hook.bind(null, mock)).not.toThrowError()
        })

        it(
          'should set \'isMuxed\' = true if all tracks are muxed and are in order',
          () => {
            mock.data.tracks = [{
              isMuxed: true,
              newNumber: 1,
              number: 1
            }, {
              isMuxed: true,
              newNumber: 2,
              number: 2
            }, {
              isMuxed: true,
              newNumber: 3,
              number: 3
            }]

            expect(hook(mock).data).toHaveProperty('isMuxed', true)
          }
        )

        it('should set \'isMuxed\' = false if any tracks are not muxed', () => {
          mock.data.tracks = [{
            isMuxed: true,
            newNumber: 1,
            number: 1
          }, {
            isMuxed: false,
            newNumber: 2,
            number: 2
          }, {
            isMuxed: true,
            newNumber: 3,
            number: 3
          }]

          expect(hook(mock).data).toHaveProperty('isMuxed', false)
        })

        it(
          'should set \'isMuxed\' = false if any tracks are not in order',
          () => {
            mock.data.tracks = [{
              isMuxed: true,
              newNumber: 1,
              number: 1
            }, {
              isMuxed: true,
              newNumber: 3,
              number: 2
            }, {
              isMuxed: true,
              newNumber: 2,
              number: 3
            }]

            expect(hook(mock).data).toHaveProperty('isMuxed', false)
          }
        )

        it('should renumber newNumber if some tracks are not muxed', () => {
          mock.data.tracks = [{
            isMuxed: true,
            newNumber: 1,
            number: 1
          }, {
            isMuxed: false,
            newNumber: 2,
            number: 2
          }, {
            isMuxed: true,
            newNumber: 3,
            number: 3
          }]

          expect(hook(mock).data.tracks[0]).toHaveProperty('newNumber', 1)
          expect(hook(mock).data.tracks[1]).toHaveProperty('newNumber', 3)
          expect(hook(mock).data.tracks[2]).toHaveProperty('newNumber', 2)
        })

        it('should set \'isMuxed\' = true if no tracks are present', () => {
          delete mock.data.tracks
          expect(hook(mock).data).toHaveProperty('isMuxed', true)
        })
      })
    })
  })
})
