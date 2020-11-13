import feathersClient, {
  makeServicePlugin,
  BaseModel
} from '../../feathers-client'
import { format } from 'date-fns'

class Movie extends BaseModel {
  constructor(data, options) {
    super(data, options)
  }
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'Movie'
  // Define default properties here
  static instanceDefaults() {
    return {
      text: ''
    }
  }
  static setupInstance(data) {
    if (data.createdAt) {
      data.createdAt = new Date(data.createdAt)
    }
    return data
  }
  get formattedDate() {
    return format(this.createdAt, 'MMM do, hh:mm:ss')
  }
}
const servicePath = 'api/movies'
const servicePlugin = makeServicePlugin({
  Model: Movie,
  service: feathersClient.service(servicePath),
  servicePath
})

// Setup the client-side Feathers hooks.
feathersClient.service(servicePath).hooks({
  before: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: []
  }
})

export default servicePlugin
