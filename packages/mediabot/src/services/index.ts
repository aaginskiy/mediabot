import { Application } from '../declarations'
import movies from './movies/movies.service'
import jobWorkers from './job-workers/job-workers.service'
import jobs from './jobs/jobs.service'
// Don't remove this comment. It's needed to format import lines nicely.

// eslint-disable-next-line @typescript-eslint/no-empty-function, @typescript-eslint/no-unused-vars
export default function(app: Application): void {
  app.configure(movies)
  app.configure(jobWorkers)
  app.configure(jobs)
}
