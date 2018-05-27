import Vue from 'vue';
import Router from 'vue-router';
import Movies from './views/Movies.vue';

Vue.use(Router);

export default new Router({
  routes: [
    {
      path: '/',
      name: 'home',
      component: Movies,
    },
    {
      path: '/movie',
      component: Movies,
    },
    {
      path: '/movie/:id',
      name: 'movies',
      component: Movies,
      props: true,
    },
  ],
});
