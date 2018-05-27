// Initializes the `JobScheduler` service on path `/job-scheduler`
const createService = require('./job-scheduler.class.js');
const hooks = require('./job-scheduler.hooks');

module.exports = function (app) {
  
  const paginate = app.get('paginate');

  const options = {
    name: 'job-scheduler',
    paginate
  };

  // Initialize our service with any options it requires
  app.use('/job-scheduler', createService(options));

  // Get our initialized service so that we can register hooks and filters
  const service = app.service('job-scheduler');

  service.hooks(hooks);
};
