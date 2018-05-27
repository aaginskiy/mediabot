/* global describe it context beforeEach before */
const chai = require('chai')
const expect = chai.expect

const checkMux = require('../../src/hooks/check-mux')

// Initialize our hook with no options

var mock = { data: {} }
const hook = checkMux()

describe('\'check-mux\' hook', () => {
  context('when \'type\' is \'after\'', () => {
    before(() => {
      mock.type = 'after'
    })

    it('should throw an error', (done) => {
      expect(hook.bind(null, mock)).to.throw()
      done()
    })
  })

  context('when \'type\' is \'before\'', () => {
    before(() => {
      mock.type = 'before'
    })

    let badVerbTypes = ['find', 'get', 'remove', 'patch']

    badVerbTypes.forEach(method => {
      it(`should throw an error when 'method' is '${method}'`, (done) => {
        mock.method = method
        expect(hook.bind(null, mock)).to.throw()
        done()
      })
    })

    let goodVerbTypes = ['create', 'update']

    goodVerbTypes.forEach(method => {
      context(`and when 'method' is '${method}'`, () => {
        before(() => {
          mock.method = method
        })

        beforeEach(() => {
          mock.data = {}
        })

        it('should not throw an error', (done) => {
          expect(hook.bind(null, mock)).to.not.throw()
          done()
        })

        it('should set \'isMuxed\' = true if all tracks are muxed and are in order', (done) => {
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

          expect(hook(mock).data).to.have.property('isMuxed', true)
          done()
        })

        it('should set \'isMuxed\' = false if any tracks are not muxed', (done) => {
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

          expect(hook(mock).data).to.have.property('isMuxed', false)
          done()
        })

        it('should set \'isMuxed\' = false if any tracks are not in order', (done) => {
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

          expect(hook(mock).data).to.have.property('isMuxed', false)
          done()
        })

        it('should renumber newNumber if some tracks are not muxed', (done) => {
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

          expect(hook(mock).data.tracks[0]).to.have.property('newNumber', 1)
          expect(hook(mock).data.tracks[1]).to.have.property('newNumber', 3)
          expect(hook(mock).data.tracks[2]).to.have.property('newNumber', 2)
          done()
        })

        it('should set \'isMuxed\' = true if no tracks are present', (done) => {
          delete mock.data.tracks
          expect(hook(mock).data).to.have.property('isMuxed', true)
          done()
        })
      })
    })
  })
})
