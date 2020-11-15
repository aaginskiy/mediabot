import { Request, Response, NextFunction } from 'express'
import Log from '../logger'
const logger = new Log('ImageService')

export default () => {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  return (req: Request, res: Response, next: NextFunction) => {
    const type = res.hook?.params.query?.type ? res.hook.params.query.type : 'poster'
    logger.info(`Sending image type '${type}' for movie #${res.hook?.id}.`)

    const filename = res.data[type]
    const dir = res.data.dir

    req.app.get('imageCacheLocation')

    res.sendFile(`${req.app.get('imageCacheLocation')}/${res.hook?.id}-poster-200.jpg`)
  }
}
