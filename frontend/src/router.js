import Vue from 'vue';
import Router from 'vue-router';
import Movies from './views/Movies.vue';
import Jobs from './views/Jobs.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/movies',
      component: Movies,
    },
    {
      path: '/movies/:id',
      name: 'movies',
      component: Movies,
      props: true,
    },
    {
      path: '/jobs',
      component: Jobs,
    },
    {
      path: '/jobs/:id',
      name: 'jobs',
      component: Jobs,
      props: true,
    },
  ],
});
