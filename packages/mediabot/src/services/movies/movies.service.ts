// Initializes the `movies` service on path `/movies`
import { ServiceAddons } from '@feathersjs/feathers'
import { Application } from '../../declarations'
import { Movies } from './movies.class'
import createModel from '../../models/movies.model'
import hooks from './movies.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'api/movies': Movies & ServiceAddons<any>
  }
}

export default function(app: Application): void {
  const options = {
    Model: createModel(app),
    id: 'id',
    paginate: {
      default: 10,
      max: 50,
    },
    multi: ['create', 'update', 'remove'],
  }

  // Initialize our service with any options it requires
  app.use('/api/movies', new Movies(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('api/movies')

  service.hooks(hooks)
}
