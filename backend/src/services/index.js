const movies = require('./movies/movies.service.js');
const mediaFile = require('./media-file/media-file.service.js');

const jobs = require('./jobs/jobs.service.js');

module.exports = function () {
  const app = this; // eslint-disable-line no-unused-vars
  app.configure(movies);
  app.configure(mediaFile);

  app.configure(jobs);
};
