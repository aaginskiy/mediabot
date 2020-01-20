module.exports = function (options = {}) {
  return function sendImage (req, res, next) {
    req.app.info(`Sending image type '${res.hook.params.query.type}' for movie #${res.hook.id}.`, {label: 'ImageService'})

    const filename = res.data[res.hook.params.query.type]
    res.sendFile(`${res.data.dir}/${filename}`)
  }
}
