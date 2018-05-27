// A hook that logs service method before, after and error

module.exports = function () {
  return function (hook) {
    var app = hook.app;

    let message = `${hook.type}: ${hook.path} - Method: ${hook.method}`;

    if (hook.type === 'error') {
      message += `: ${hook.error.message}`;
    }

    app.info(message);
    app.debug('hook.data', hook.data);
    app.debug('hook.params', hook.params);

    if (hook.result) {
      app.debug('hook.result', hook.result);
    }

    if (hook.error) {
      app.error(hook.error);
    }
  };
};
