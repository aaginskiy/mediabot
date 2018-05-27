<template>
  <nav class="panel">
    <div class="panel-block" style="display: block;">
      <div class="field has-addons">
        <p class="control is-expanded has-icons-left">
          <input class="input" type="text" placeholder="search">
          <span class="icon is-left">
            <i class="fas fa-search"></i>
          </span>
        </p>
        <p class="control">
          <a class="button is-primary"
            v-bind:class="{ 'is-loading': $loading.isLoading('refreshing movies') }"
            v-on:click="refreshMovies">
            Refresh
          </a>
        </p>
      </div>
    </div>
    <movie-row v-for="movie in movies.data" :key="movie._id" :movie="movie" v-cloak />
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import io from 'socket.io-client';
import MovieRow from './MovieRow.vue';

const socket = io('http://localhost:3030', { transports: ['websocket'] });

export default {
  name: 'movie-list',
  computed: {
    ...mapGetters('movies', {
      findMoviesInStore: 'find',
    }),
    movies() {
      return this.findMoviesInStore({ query: { $sort: { createdAt: 1 } } });
    },
  },
  methods: {
    ...mapActions('movies', {
      findMovies: 'find',
    }),
    refreshMovies() {
      this.$loading.startLoading('refreshing movies');
      socket.emit('create', 'media-file', {
        text: 'I really have to iron',
      }, () => {
        this.$loading.endLoading('refreshing movies');
      });
    },
  },
  created() {
    // Query messages from Feathers
    this.findMovies({
      query: {
        $sort: { createdAt: -1 },
        $limit: 25,
      },
    });
  },
  components: {
    MovieRow,
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
</style>
