/* eslint no-param-reassign: "off" */
import Vue from 'vue';
import Vuex from 'vuex';
import feathersVuex from 'feathers-vuex';
import feathersClient from '@/api/feathers-client';

const { service } = feathersVuex(feathersClient, { idField: '_id' });

Vue.use(Vuex);

export default new Vuex.Store({
  plugins: [service('movies', {
    state: {
      dirtyIds: [],
    },
    mutations: {
      setDirty(state, params) {
        const index = state.dirtyIds.indexOf(params);
        if (index < 0) {
          state.dirtyIds.push(params);
        }
      },
      unsetDirty(state, params) {
        const index = state.dirtyIds.indexOf(params);
        if (index > -1) {
          state.dirtyIds.splice(index, 1);
        }
      },
      unsetAllDirty(state) {
        state.dirtyIds = [];
      },
    },
  }),
  service('jobs')],
  state: {},
  mutations: {},
  actions: {},
});
