const NeDB = require('nedb');
const path = require('path');

module.exports = function (app) {
  const dbPath = path.join(app.get('configLocation'), 'data');
  const Model = new NeDB({
    filename: path.join(dbPath, 'movies.db'),
    autoload: true
  });

  return Model;
};
