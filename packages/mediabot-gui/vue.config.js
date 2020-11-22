module.exports = {
  transpileDependencies: ['vuetify', 'feathers-vuex'],
  devServer: {
    proxy: {
      '^/api': {
        target: 'http://localhost:3030',
        ws: true,
        changeOrigin: true,
      },
      '^/image': {
        target: 'http://localhost:3030',
      },
    },
  },
}
