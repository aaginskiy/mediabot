module.exports = function (options = {}) {
  return function sendImage(req, res, next) {
    console.log('sendImage middleware is running');
    console.log(res.hook.params.query.type);

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
