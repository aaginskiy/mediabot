<template>
  <main class="section">
    <div class="container">
      <vuetable ref="vuetable"
        :api-mode="false"
        :data="jobs.data"
        :table="jobs.data"
        :fields="fields"
        :css="css"
        pagination-path=""
        :multi-sort="true"
        multi-sort-key="ctrl"
        detail-row-component="my-detail-row"
        track-by="_id"
        @vuetable:cell-clicked="onCellClicked"
      ></vuetable>
    </div>
  </main>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import Vuetable from 'vuetable-2';
import CustomActions from '@/components/JobList/CustomActions.vue';
import ExpandIcon from '@/components/JobList/ExpandIcon.vue';
import Progress from '@/components/JobList/Progress.vue';
import Vue from 'vue';

Vue.component('custom-actions', CustomActions);
Vue.component('expand-icon', ExpandIcon);
Vue.component('progress-bar', Progress);

export default {
  name: 'jobs',
  props: ['id'],
  components: {
    Vuetable,
    CustomActions,
  },
  data() {
    return {
      css: {
        tableClass: 'table is-striped is-fullwidth is-hoverable',
        ascendingIcon: 'fa fa-chevron-up',
        descendingIcon: 'fa fa-chevron-down',
        sortHandleIcon: 'fa fa-bars',
      },
      fields: [
        {
          name: '__component:expand-icon',
          title: '',
          sortField: 'open',
          width: '40px',
        },
        {
          name: '_id',
          title: 'Job ID',
          sortField: '_id',
        },
        {
          name: 'service',
          sortField: 'service',
        },
        {
          name: 'function',
          sortField: 'function',
        },
        {
          name: 'title',
          sortField: 'title',
        },
        {
          name: 'status',
          sortField: 'status',
          callback: this.statusAsText,
        },
        {
          name: '__component:progress-bar',
          title: 'Progress',
          sortField: 'progress',
        },
        {
          name: '__component:custom-actions',
          title: 'Actions',
          titleClass: 'has-text-centered',
          dataClass: 'has-text-centered',
        },
      ],
    };
  },
  computed: {
    ...mapGetters('jobs', {
      findJobsInStore: 'find',
    }),
    jobs() {
      return this.findJobsInStore({ query: { $sort: { createdAt: 1 } } });
    },
  },
  methods: {
    ...mapActions('jobs', {
      findJobs: 'find',
    }),
    onPaginationData(paginationData) {
      this.$refs.pagination.setPaginationData(paginationData);
      this.$refs.paginationInfo.setPaginationData(paginationData);
    },
    onChangePage(page) {
      this.$refs.vuetable.changePage(page);
    },
    onCellClicked(data, field) {
      console.log('cellClicked: ', field.name);
      this.$refs.vuetable.toggleDetailRow(data._id);
    },
    statusAsText(status) {
      let statusText;
      switch (status) {
        case 0:
          statusText = 'New';
          break;
        case 1:
          statusText = 'Running';
          break;
        case 2:
          statusText = 'Success';
          break;
        case -1:
          statusText = 'Error';
          break;
        default:
          statusText = 'Unknown';
      }
      return statusText;
    },
  },
  created() {
    // Query messages from Feathers
    this.findJobs({
      query: {
        $sort: { createdAt: -1 },
        $limit: 25,
      },
    });
  },
};
</script>

<style>
  main {
    height: calc(100% - 52px);
  }
  .movie-list {
    overflow-y: scroll;
  }

  .movie-content {
    overflow-y: scroll;
  }

  .movie-content > .level {
    height: 100%;
  }
</style>
