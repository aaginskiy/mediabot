// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html
import { Hook, HookContext } from '@feathersjs/feathers'
import { Application, JobRecord } from '../declarations'

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export default (options = {}): Hook => {
  return async (context: HookContext<JobRecord>): Promise<HookContext<JobRecord>> => {
    if (!context.result?.movieId) return context

    const movieId = context.result?.movieId
    const status = context.result?.status

    const app: Application = context.app as Application

    const movie = await app.service('api/movies').get(movieId, { query: { $select: ['isRunning'] } })

    if (!movie.isRunning) movie.isRunning = {}

    if (status === 'queued' || status === 'running') {
      movie.isRunning[context.result.name] = context.result.id
    } else if (status === 'failed' || status === 'completed') {
      movie.isRunning[context.result.name] = undefined
    }

    await app.service('api/movies').patch(movieId, movie)

    return context
  }
}
