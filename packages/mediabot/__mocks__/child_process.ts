const child_process = jest.requireActual('child_process')

// Load fixtures
import nfoAvengersEndGame from '../src/utils/__fixtures__/movies/Avengers End Game (2019)/Avengers End Game (2019).mkvmerge'

const backupExec = child_process.exec
const backupSpawn = child_process.spawn
let emitter

child_process.exec = jest.fn().mockImplementation((command, options, callback) => {
  if (!callback && options) callback = options

  if (command.startsWith('mkvmerge')) {
    switch (command) {
      case 'mkvmerge -J /movies/Avengers\\ Infinity\\ War\\ \\(2018\\)/Avengers\\ Infinity\\ War\\ \\(2018\\).mkv':
        callback(null, { stdout: JSON.stringify(nfoAvengersEndGame), stderr: '' }, null)
        break
      case 'mkvmerge -J /movies/Bad\\ JSON\\ \\(2018\\)/Bad\\ JSON\\ \\(2018\\).mkv':
        callback(null, { stdout: 'u' + JSON.stringify(nfoAvengersEndGame), stderr: '' }, null)
        break
      case 'mkvmerge -J /movies/Removed Movie (2018)/Removed Movie (2018).mkv':
        callback(new Error(`Command failed: ${command}`), null, `Command failed: ${command}`)
        break
      default:
        return backupExec(command, options, callback)
    }
  } else if (command.startsWith('mkvpropedit')) {
    callback(null, { stdout: 'Done', stderr: '' }, null)
  }
  return new child_process()
})

child_process.spawn = jest.fn().mockImplementation((command, args, options) => {
  if (command === 'mkvmerge') {
    emitter = new child_process.ChildProcess()
    emitter.stdout = new child_process.ChildProcess()
    return emitter
  } else {
    backupSpawn(command, args, options)
  }
})

child_process.__emit = function(type: string, message: string | Error) {
  emitter.emit(type, message)
}

child_process.__stdout_emit = function(type, message) {
  emitter.stdout.emit(type, message)
}

module.exports = child_process
