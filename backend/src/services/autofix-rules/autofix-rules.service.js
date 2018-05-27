// Initializes the `autofix-rules` service on path `/autofix-rules`
const createService = require('feathers-nedb');
const createModel = require('../../models/autofix-rules.model');
const hooks = require('./autofix-rules.hooks');

module.exports = function (app) {
  const Model = createModel(app);
  const paginate = app.get('paginate');

  const options = {
    name: 'autofix-rules',
    Model,
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/autofix-rules', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('autofix-rules');

  service.hooks(hooks);
};
