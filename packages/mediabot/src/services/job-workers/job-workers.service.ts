// Initializes the `job-workers` service on path `/job-workers`
import { ServiceAddons } from '@feathersjs/feathers'
import { Application, ServiceTypes } from '../../declarations'
import { JobWorkers } from './job-workers.class'
import hooks from './job-workers.hooks'
import feathers from '@feathersjs/feathers'

// Add this service to the service type index
declare module '../../declarations' {
  interface ServiceTypes {
    'job-workers': JobWorkers & ServiceAddons<any>
  }
}

export default function(app: Application | feathers.Application): void {
  const options = {
    paginate: false,
    multi: true,
  }

  // Initialize our service with any options it requires
  app.use('/job-workers', new JobWorkers(options, app))

  // Get our initialized service so that we can register hooks
  const service: ServiceTypes['job-workers'] = app.service('job-workers')

  service.hooks(hooks)
}
