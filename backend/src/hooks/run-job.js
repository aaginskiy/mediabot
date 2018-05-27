// Use this hook to manipulate incoming or outgoing data.
// For more information on hooks see: http://docs.feathersjs.com/api/hooks.html

// eslint-disable-next-line no-unused-vars
module.exports = function (options = {}) {
  return async context => {
    const JobService = context.app.service('jobs');
    const MovieService = context.app.service('movies');
    const Service = context.app.service(context.data.service);
    const job = await JobService.get(context.data._id);
    const item = await MovieService.get(context.data.movieId);

    if (context.data.status === context.app.get('JOB_STATUS.RUNNING')) {
      return new Error(`Job #${context.data._id} is already running.`);
    } else {
      await JobService.patch(context.data._id, {status: context.app.get('JOB_STATUS.RUNNING')}, {});
      const serviceEvent = Service[context.data.function](item._id, item);

      serviceEvent.on('progress', (progress) => JobService.patch(context.data._id, {progress: progress}, {}));
      serviceEvent.on('finished', (message) => {
        JobService.patch(context.data._id, {status: context.app.get('JOB_STATUS.SUCCESS')}, {});
        console.log(message);
      });
      serviceEvent.on('error', (error) => console.log(error));
    }
    
    return context;
  };
};
