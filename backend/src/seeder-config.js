module.exports = {
  services: [
    {
      path: 'movies',
      count: 30,
      template: {
        title: '{{name.firstName}} {{name.lastName}}'
      },
      callback(movie, seed) {
        // Create 10 tenants for each apartment
        return seed({
          count: 3,
          path: 'tracks',
          template: {
            trackName: '{{name.firstName}} {{name.lastName}}',
            type: '{{internet.email}}',
            movieId: movie._id
          }
        });
      }
    }
  ]
};