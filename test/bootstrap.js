/* global before after beforeEach afterEach */
const app = require('../src/app')
const fs = require('fs')
const path = require('path')

before(function (done) {
  this.server = app.listen(3434)
  this.server.once('listening', () => {
    // Clear database
    app.service('media-file').Movie.remove(null).then(() => {
      done()
    })
  })
})

after(function (done) {
  this.server.close(done)
})

afterEach(function () {
  if (this.currentTest.state !== 'failed') return
  console.log(fs.readFileSync(path.join(__dirname, '/logs/mocha.log')).toString())
})

beforeEach(function (done) {
  try { fs.writeFileSync(path.join(__dirname, '/logs/mocha.log'), '') } catch (e) {}
  done()
})
