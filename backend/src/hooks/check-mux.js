const { checkContext } = require('feathers-hooks-common')
const { orderBy } = require('lodash')

module.exports = function (options = {}) { // eslint-disable-line no-unused-vars
  return function checkMux (hook) {
    checkContext(hook, 'before', ['update', 'create'], 'checkMux')

    if (!hook.data.tracks) {
      hook.data.isMuxed = true
    } else {
      // Reset newNumber
      let counter = 1
      orderBy(hook.data.tracks, ['isMuxed', 'newNumber'], ['desc', 'asc']).forEach(track => {
        track.newNumber = counter
        counter += 1
      })

      // Check if muxed
      let count = hook.data.tracks.length
      let order = true

      hook.data.tracks.forEach(track => {
        if (track.isMuxed) count -= 1
        if (track.number !== track.newNumber) order = false
      })

      hook.data.isMuxed = (count === 0 && order)
    }
    return hook
  }
}
