// Initializes the `image` service on path `/image`
const createService = require('./image.class.js');
const hooks = require('./image.hooks');
const sendImage = require('../../middleware/send-image.js');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    name: 'image',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/image', createService(options), sendImage({}));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('image');

  service.hooks(hooks);
};
