import Vue from 'vue'
import Buefy from 'buefy'
import VueLoading from 'vuex-loading'
import 'buefy/lib/buefy.css'
import App from './App.vue'
import router from './router'
import store from './store'

Vue.use(VueLoading) // add VueLoading as Vue plugin

Vue.config.productionTip = false
Vue.use(Buefy)

new Vue({
  router,
  store,
  data: {
    movieFilter: ''
  },
  vueLoading: new VueLoading({ useVuex: true, moduleName: 'loading-states' }),
  render: h => h(App)
}).$mount('#app')
