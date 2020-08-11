import { Service, NedbServiceOptions } from 'feathers-nedb'
import { Application } from '../../declarations'

declare interface Movie {
  id: string
  title: string
  year: number
  filename: string
  mediaInfo: string
}

export class Movies extends Service<Movie> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options)
  }
}
