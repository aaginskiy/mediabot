import { Service, NedbServiceOptions } from 'feathers-nedb'
import { Application, MovieData, Mediainfo, RemoteMovieInfo } from '../../declarations'

declare module '../../declarations' {
  interface MovieData {
    id?: string
    title: string
    year: number
    filename: string
    remoteInfo: RemoteMovieInfo
    mediaInfo: Mediainfo
  }
}

export class Movies extends Service<MovieData> {
  //eslint-disable-next-line @typescript-eslint/no-unused-vars
  constructor(options: Partial<NedbServiceOptions>, app: Application) {
    super(options)
  }
}
