// Initializes the `jobs` service on path `/jobs`
import { ServiceAddons } from '@feathersjs/feathers'
import { Application } from '../../declarations'
import { Jobs } from './jobs.class'
import createModel from '../../models/jobs.model'
import hooks from './jobs.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    jobs: Jobs & ServiceAddons<any>
  }
}

export default function(app: Application): void {
  const options = {
    Model: createModel(app),
    id: 'id',
    paginate: app.get('paginate'),
    multi: ['create', 'update', 'remove'],
  }

  // Initialize our service with any options it requires
  app.use('/jobs', new Jobs(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('jobs')

  service.hooks(hooks)
}
