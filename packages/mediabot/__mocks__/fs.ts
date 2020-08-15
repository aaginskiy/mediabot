import streamtest from 'streamtest'

const fs = jest.requireActual('fs')

const backupCreateWriteStream = fs.createWriteStream
const backupWriteFile = fs.writeFile
const backupExistsSync = fs.existsSync
const backupReaddir = fs.readdir
const backupRename = fs.rename
const backupReadFile = fs.readFile

import nfoAvengersInfinityWar from '../src/utils/__fixtures__/Avengers Infinity War (2018).nfo'

fs.readFile = jest.fn().mockImplementation((path, options, callback) => {
  if (!callback && options) callback = options
  if (path === '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).nfo') {
    callback(null, nfoAvengersInfinityWar)
  } else {
    backupReadFile(path, options, callback)
  }
})

fs.rename = jest.fn().mockImplementation((oldPath, newPath, callback) => {
  if (
    oldPath === '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv' &&
    newPath === '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkvbak'
  ) {
    callback()
  } else if (
    oldPath === '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).rmbtmp' &&
    newPath === '/movies/Avengers Infinity War (2019)/Avengers Infinity War (2018).mkv'
  ) {
    callback()
  } else {
    backupRename(oldPath, newPath, callback)
  }
})

fs.readdir = jest.fn().mockImplementation((path, options, callback) => {
  if (!callback && options) callback = options
  switch (path) {
    case '/movies/Avengers Infinity War (2018)':
      callback(null, [
        'Avengers Infinity War (2018).nfo',
        'Avengers Infinity War (2018)-poster.jpg',
        'Avengers Infinity War (2018)-fanart.jpg',
        'Avengers Infinity War (2018).mkv',
      ])
      break
    default:
      backupReaddir(path, options, callback)
      break
  }
})

fs.existsSync = jest.fn().mockImplementation((filename) => {
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

fs.createWriteStream = jest.fn().mockImplementation((path) => {
  switch (path) {
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-poster.jpg':
      return streamtest['v2'].toText(() => {
        /** no op */
      })
    case '/movies/2001 A Space Odyssey (1968)/2001 A Space Odyssey (1968)-fanart.jpg':
      return streamtest['v2'].toText(() => {
        /** no op */
      })
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-poster.jpg':
      return streamtest['v2'].toText(() => {
        /** no op */
      })
    case '/movies/Avengers Infinity War (2018)/Avengers Infinity War (2018)-fanart.jpg':
      return streamtest['v2'].toText(() => {
        /** no op */
      })
    default:
      return backupCreateWriteStream(path)
  }
})

module.exports = fs
