// Initializes the `job-workers` service on path `/job-workers`
import { ServiceAddons } from '@feathersjs/feathers'
import { Application, ServiceTypes } from '../../declarations'
import { JobWorkers } from './job-workers.class'
import hooks from './job-workers.hooks'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'api/job-workers': JobWorkers & ServiceAddons<any>
  }
}

export default function(app: Application): void {
  const options = {
    paginate: {
      default: 10,
      max: 50,
    },
    multi: true,
  }

  // Initialize our service with any options it requires
  app.use('/api/job-workers', new JobWorkers(options, app))

  // Get our initialized service so that we can register hooks
  const service = app.service('api/job-workers')

  service.hooks(hooks)
}
