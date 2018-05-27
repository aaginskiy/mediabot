module.exports = function (options = {}) {
  return function sendImage(req, res, next) {
    req.app.info(`Sending image type '${res.hook.params.query.type}' for movie #${res.hook.id}.`, { label: "ImageService"});

    let type;
    if (res.hook.params.query.type === 'poster') {
      type = '-poster.jpg';
    } else {
      type = '-fanart.jpg';
    }
    const filename = res.data.filename.slice(0, -4) + type;

    res.sendFile(filename);
  };
};
