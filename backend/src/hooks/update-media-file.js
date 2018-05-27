const { checkContext } = require('feathers-hooks-common');

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    checkContext(context, 'before', ['update'], 'updateMediaFile');
    const MediaFileService = context.app.service('media-file');
    return MediaFileService.patch(context.data.id, context.data, context.params)
      .then(() => context)
      .catch((e) => e);
  };
};
