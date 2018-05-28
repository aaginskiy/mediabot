const NedbService = require('feathers-nedb')

class Service extends NedbService {
  constructor (options) {
    console.log('mwahahaha')
    super(options)
  }
}

module.exports = function moduleExport (options) {
  return new Service(options)
}

module.exports.Service = Service
