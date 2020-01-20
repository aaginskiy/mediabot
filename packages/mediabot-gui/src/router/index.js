import Vue from 'vue'
import VueRouter from 'vue-router'
import Movies from '../views/Movies'

Vue.use(VueRouter)

const routes = [
  // { path: '', name: 'Home', component: Home },
  { path: '/movies', component: Movies },
  {
    path: '/movies/:id',
    name: 'movies',
    component: Movies,
    props: true
  }
]

const router = new VueRouter({
  mode: 'history',
  base: '/',
  routes
})

export default router
