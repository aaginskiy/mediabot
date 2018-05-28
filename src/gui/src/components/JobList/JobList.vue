<template>
  <nav class="panel">
    <div class="panel-block" style="display: block;">
      <div class="field has-addons">
        <p class="control is-expanded has-icons-left">
          <b-input
            v-model="movieFilter"
            placeholder="search"
            size="is-small"
            icon-pack="fas"
            icon="search">{{ movieFilter }}</b-input>
        </p>
      </div>
    </div>
    <job-row v-for="job in jobs.data"
      :key="job._id"
      :job="job"
      :id="job._id" v-cloak />
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import JobRow from './JobRow.vue';

export default {
  name: 'job-list',
  data() {
    return {
      movieFilter: '',
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
  components: {
    JobRow,
  },
};
</script>

<style scoped>
main#chat {
  height: 100%;
}

/* Header */
header.title-bar {
  padding: 10px 0;
  border-bottom: 1px solid #f1f1f1;
}

header.title-bar img.logo {
  width: 100%;
  max-width: 140px;
}

header.title-bar span.title {
  color: #969696;
  font-weight: 100;
  text-transform: uppercase;
  font-size: 1.2em;
  margin-left: 7px;
}

.panel {
  border-right: 1px solid #dbdbdb;
}
</style>
