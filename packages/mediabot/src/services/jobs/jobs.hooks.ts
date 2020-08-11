import { required, disallow, keep, alterItems } from 'feathers-hooks-common'
import { NotImplemented } from '@feathersjs/errors'
import app from '../../app'

export default {
  before: {
    all: [],
    find: [],
    get: [],
    create: [
      required('name'),
      keep('name', 'args'),
      alterItems((rec) => {
        rec.status = 'queued'
        rec.progress = 0

        switch (rec.name) {
          case 'scanMediaLibrary':
            rec.priority = 'high'
            rec.function = 'scanMediaLibrary'
            rec.args = [app.get('movieDirectory')]
            break
          case 'refreshAllMovies':
            rec.priority = 'high'
            rec.function = 'refreshAllMovies'
            rec.args = [app.get('movieDirectory')]
            break
          case 'refreshMovie':
            rec.priority = 'high'
            rec.function = 'refreshMovie'
            break
          case 'autoFixMovie':
            rec.priority = 'normal'
            rec.function = 'autoFixMovie'
            break
          case 'autoScrapeMovie':
            rec.priority = 'high'
            rec.service = 'media-scraper'
            rec.function = 'autoScrapeMovie'
            break
          case 'scanScrapeSingleMovieByTmdbId':
            rec.priority = 'low'
            rec.function = 'scanScrapeSingleMovieByTmdbId'
            break
          default:
            throw new NotImplemented(`Command '${rec.name}' is not implemented.`)
        }

        return rec
      }),
    ],
    update: [disallow()],
    patch: [disallow('external'), keep('status', 'progress', 'error'), required('status', 'progress', 'error')],
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
}
