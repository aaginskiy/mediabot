<template>
  <nav class="panel">
    <!-- <div class="panel-block" style="display: block;"> -->
      <nav class="navbar">
        <div class="navbar-start">
          <span class="navbar-item">
            <p class="control has-icons-left">
              <b-input v-model="movieFilter"
              @input="updateInput" placeholder="search">{{ movieFilter }}</b-input>
              <span class="icon is-left">
                <i class="fas fa-search"></i>
              </span>
            </p>
          </span>
        </div>
        <div class="navbar-end">
          <span class="navbar-item">
            <a class="button is-primary is-small"
              v-bind:class="{ 'is-loading': $loading.isLoading('refreshing movies') }"
              v-on:click="refreshMovies">
              Refresh
            </a>
          </span>
          <span class="navbar-item">
            <a class="button is-primary is-small"
              v-bind:class="{ 'is-loading': $loading.isLoading('refreshing movies') }"
              v-on:click="refreshMovies">
              Fixed
            </a>
          </span>
        </div>
      </nav>
    <!-- </div> -->
    <movie-row v-for="movie in filteredMovies"
      :key="movie.id"
      :movie="movie"
      :id="movie.id" v-cloak />
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { filter } from 'lodash';
import io from 'socket.io-client';
import MovieRow from './MovieRow.vue';

const socket = io('http://localhost:3030', { transports: ['websocket'] });

export default {
  name: 'movie-list',
  data() {
    return {
      movieFilter: '',
    };
  },
  computed: {
    ...mapGetters('movies', {
      findMoviesInStore: 'find',
    }),
    movies() {
      return this.findMoviesInStore({ query: { $sort: { createdAt: 1 } } });
    },
    filteredMovies() {
      if (this.movieFilter === '') {
        return this.movies.data;
      }
      return filter(
        this.movies.data,
        movie => movie.title && movie.title.includes(this.movieFilter),
      );
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
      }, (e, v) => {
        if (e) {
          console.log(v);
          this.$loading.endLoading('refreshing movies');
          this.$loading.startLoading('refreshing movies error');
          setTimeout(() => this.$loading.endLoading('refreshing movies error'), 2000);
        } else if (v) {
          this.$store.commit('movies/unsetAllDirty');
          this.$loading.endLoading('refreshing movies');
          this.$loading.startLoading('refreshing movies success');
          setTimeout(() => this.$loading.endLoading('refreshing movies success'), 2000);
        }
      });
    },
    updateInput() {
      // console.log(this.filteredMovies);
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
