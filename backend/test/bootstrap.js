const app = require('../src/app');

before(function (done) {
  this.server = app.listen(3434);
  this.server.once('listening', () => done());
});

after(function (done) {
  this.server.close(done);
});
