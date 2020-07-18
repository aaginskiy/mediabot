import streamtest from 'streamtest'

const fs = jest.requireActual('fs')

let backupCreateWriteStream = fs.createWriteStream
let backupWriteFile = fs.writeFile
let backupExistsSync = fs.existsSync

fs.existsSync = jest.fn().mockImplementation(filename => {
  switch (filename) {
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).nfo':
      return false
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-poster.jpg':
      return false
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-fanart.jpg':
      return false
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).nfo':
      return true
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-poster.jpg':
      return true
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-fanart.jpg':
      return true
    default:
      return backupExistsSync(filename)
  }
})

fs.writeFile = jest.fn().mockImplementation((filename, data, callback) => {
  switch (filename) {
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968).nfo':
      callback(null, 'success')
      break
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018).nfo':
      callback(null, 'success')
      break
    default:
      return backupWriteFile(filename, data, callback)
  }
})

fs.createWriteStream = jest.fn().mockImplementation(path => {
  switch (path) {
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-poster.jpg':
      return streamtest['v2'].toText(string => {})
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-fanart.jpg':
      return streamtest['v2'].toText(string => {})
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-poster.jpg':
      return streamtest['v2'].toText(string => {})
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-fanart.jpg':
      return streamtest['v2'].toText(string => {})
    default:
      return backupCreateWriteStream(path)
  }
})

module.exports = fs
