const { every } = require('lodash')
const { checkContext } = require('feathers-hooks-common')

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    checkContext(context, 'after', ['update'], 'updateMediaFile')
    if (context.params.skipWrite !== true) {
      const MediaFileService = context.app.service('media-file')

      return MediaFileService.patch(context.data._id, context.data, context.params)
        .then(function () {
          if (every(context.data.tracks, ['isMuxed', true])) {
            return context
          } else {
            return MediaFileService.update(context.data._id, context.data, context.params)
              .then(() => context)
          }
        })
        .catch((e) => Promise.reject(e))
    } else {
      return context
    }
  }
}
