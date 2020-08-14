import { Service, NedbServiceOptions } from 'feathers-nedb'
import { Application, JobData } from '../../declarations'

// Add this service to the service type index
declare module '../../declarations' {
  interface JobData {
    id: string
    name: string
    args: Array<any>
    status: 'queued' | 'running' | 'completed' | 'failed'
    progress: number
    error: string
    statusMessage: string
  }
}

export class Jobs extends Service<JobData> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options)
  }
}
