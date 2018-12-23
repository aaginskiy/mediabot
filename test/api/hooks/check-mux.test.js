/* global describe it context beforeEach before */
const checkMux = require('../../../src/api/hooks/check-mux');

// Initialize our hook with no options

var mock = { data: {} }
const hook = checkMux()

describe('\'check-mux\' hook', () => {
  describe('when \'type\' is \'after\'', () => {
    beforeAll(() => {
      mock.type = 'after'
    })

    test('should throw an error', (done) => {
      expect(hook.bind(null, mock)).toThrowError()
      done()
    })
  })

  describe('when \'type\' is \'before\'', () => {
    beforeAll(() => {
      mock.type = 'before'
    })

    let badVerbTypes = ['find', 'get', 'remove', 'patch']

    badVerbTypes.forEach(method => {
      test(`should throw an error when 'method' is '${method}'`, (done) => {
        mock.method = method
        expect(hook.bind(null, mock)).toThrowError()
        done()
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

        test('should not throw an error', (done) => {
          expect(hook.bind(null, mock)).not.toThrowError()
          done()
        })

        test(
          'should set \'isMuxed\' = true if all tracks are muxed and are in order',
          (done) => {
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
            done()
          }
        )

        test('should set \'isMuxed\' = false if any tracks are not muxed', (done) => {
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
          done()
        })

        test(
          'should set \'isMuxed\' = false if any tracks are not in order',
          (done) => {
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
            done()
          }
        )

        test('should renumber newNumber if some tracks are not muxed', (done) => {
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
          done()
        })

        test('should set \'isMuxed\' = true if no tracks are present', (done) => {
          delete mock.data.tracks
          expect(hook(mock).data).toHaveProperty('isMuxed', true)
          done()
        })
      })
    })
  })
})
