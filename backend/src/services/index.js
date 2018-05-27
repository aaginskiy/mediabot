const movies = require('./movies/movies.service.js');
const mediaFile = require('./media-file/media-file.service.js');

const jobs = require('./jobs/jobs.service.js');

const image = require('./image/image.service.js');

const jobScheduler = require('./job-scheduler/job-scheduler.service.js');

module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(movies);
  app.configure(mediaFile);
  app.configure(jobs);
  app.configure(image);
  app.configure(jobScheduler);
};
