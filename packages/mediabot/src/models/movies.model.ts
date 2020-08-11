import NeDB from 'nedb'
import path from 'path'
import { Application } from '../declarations'

export default function(app: Application): NeDB<any> {
  const dbPath = app.get('dataLocation')
  const Model = new NeDB({
    filename: path.join(dbPath, 'movies.db'),
    autoload: true,
  })

  return Model
}
