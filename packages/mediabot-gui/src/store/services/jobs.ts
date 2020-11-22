import feathersClient, {
  makeServicePlugin,
  BaseModel,
} from '../../feathers-client'
import { format } from 'date-fns'
import { JobRecord } from '../../../../mediabot/src/declarations'
import {
  AnyData,
  ModelInstanceOptions,
} from 'feathers-vuex/dist/service-module/types'
import { ServiceState } from 'feathers-vuex'

export class Job extends BaseModel {
  constructor(data?: AnyData, options?: ModelInstanceOptions) {
    super(data, options)
  }
  // Required for $FeathersVuex plugin to work after production transpile.
  static modelName = 'Job'
  // Define default properties here
  static instanceDefaults() {
    return {}
  }
  static setupInstance(data: JobRecord) {
    if (data.createdAt) {
      data.createdAt = new Date(data.createdAt)
    }
    return data
  }
  get formattedDate() {
    return format(this.createdAt ? this.createdAt : '', 'MMM do, hh:mm:ss')
  }
}

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface Job extends JobRecord {}

const servicePath = 'api/jobs'

declare module 'feathers-vuex' {
  interface FeathersVuexStoreState {
    [servicePath]: ServiceState<Job>
  }
}

declare module 'src/store' {
  interface MyApiModels {
    Job: typeof Job
  }
}

const servicePlugin = makeServicePlugin({
  Model: Job,
  service: feathersClient.service(servicePath),
  servicePath,
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
    remove: [],
  },
  after: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
  error: {
    all: [],
    find: [],
    get: [],
    create: [],
    update: [],
    patch: [],
    remove: [],
  },
})

export default servicePlugin
