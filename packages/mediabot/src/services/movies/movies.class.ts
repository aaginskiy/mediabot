import { Service, NedbServiceOptions } from 'feathers-nedb'
import { Application, Movie } from '../../declarations'

export class Movies extends Service<Movie> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options)
  }
}
