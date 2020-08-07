const NeDB = require('nedb')
const path = require('path')

module.exports = function (app) {
  const Model = new NeDB({
    filename: path.join(app.get('dataLocation'), 'movies.db'),
    autoload: true
  })

  return Model
}
