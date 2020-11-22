import SingleMovie from '@/views/SingleMovie.vue'
import Vue from 'vue'
import VueRouter, { RouteConfig } from 'vue-router'
import Movies from '@/views/Movies.vue'

Vue.use(VueRouter)

const routes: Array<RouteConfig> = [
  { path: '/movies', component: Movies },
  {
    path: '/movies/:id',
    name: 'movies',
    component: SingleMovie,
    props: true,
  },
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
})

export default router
