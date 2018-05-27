const app = require('../src/app');

before(function (done) {
  this.server = app.listen(3434);
  this.server.once('listening', () => {
    // Clear database
    app.service('media-file').Movie.remove(null).then(() => {
      done();
    });
  });
});

after(function (done) {
  this.server.close(done);
});
