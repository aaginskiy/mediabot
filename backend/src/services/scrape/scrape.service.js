// Initializes the `scrape` service on path `/scrape`
const createService = require('./scrape.class.js');
const hooks = require('./scrape.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    name: 'scrape',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/scrape', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('scrape');

  service.hooks(hooks);
};
