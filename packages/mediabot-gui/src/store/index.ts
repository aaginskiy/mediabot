import Vue from 'vue'
import Vuex from 'vuex'

import { FeathersVuex } from '../feathers-client'

// eslint-disable-next-line @typescript-eslint/no-empty-interface
export interface MyApiModels {
  /* Let each service augment this interface */
}

declare module 'feathers-vuex' {
  interface FeathersVuexGlobalModels {
    api: MyApiModels
  }
}

Vue.use(Vuex)
Vue.use(FeathersVuex)

const requireModule = require.context(
  // The path where the service modules live
  './services',
  // Whether to look in subfolders
  false,
  // Only include .js files (prevents duplicate imports`)
  /\.ts$/
)
const servicePlugins = requireModule
  .keys()
  .map(modulePath => requireModule(modulePath).default)

export default new Vuex.Store({
  state: {},
  getters: {},
  mutations: {},
  actions: {},
  plugins: [...servicePlugins],
})
