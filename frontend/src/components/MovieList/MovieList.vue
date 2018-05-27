<template>
  <nav class="panel">
    <div class="panel-block" style="display: block;">
      <div class="field has-addons">
        <p class="control"  v-if="$loading.isLoading('refreshing movies error')">
          <a class="button is-danger">
            <span class="icon">
              <i class="fas fa-times"></i>
            </span>
          </a>
        </p>
        <p class="control"  v-else-if="$loading.isLoading('refreshing movies success')">
          <a class="button is-success">
            <span class="icon">
              <i class="fas fa-check"></i>
            </span>
          </a>
        </p>
        <p class="control" v-else>
          <a class="button is-primary"
            v-bind:class="{ 'is-loading': $loading.isLoading('refreshing movies') }"
            v-on:click="refreshMovies">
            <span class="icon">
              <i class="fas fa-sync"></i>
            </span>
          </a>
        </p>
      </div>
    </div>
    <div class="panel-block" style="display: block;">
      <div class="field has-addons">
        <p class="control is-expanded has-icons-left">
          <b-input
            v-model="movieFilter"
            @input="updateInput"
            placeholder="search"
            size="is-small"
            icon-pack="fas"
            icon="search">{{ movieFilter }}</b-input>
        </p>
        <p class="control">
          <a class="button is-small is-primary"
            v-on:click="updateMuxFilter">
            Mux: {{ muxFilter }}
          </a>
        </p>
        <p class="control">
          <a class="button is-small is-primary"
            v-on:click="updateFixFilter">
            Fix: {{ fixFilter }}
          </a>
        </p>
        <!-- <p class="control">
          <b-taglist attached>
            <b-tag>Mux</b-tag>
            <b-tag type="is-success">Yes</b-tag>
          </b-taglist>
        </p>
        <p class="control">
          <b-taglist attached>
            <b-tag>Fix</b-tag>
            <b-tag type="is-success">Yes</b-tag>
          </b-taglist>
        </p> -->
      </div>
    </div>
    <movie-row v-for="movie in filteredMovies"
      :key="movie.id"
      :movie="movie"
      :id="movie.id" v-cloak />
  </nav>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
import { every } from 'lodash';
import io from 'socket.io-client';
import MovieRow from './MovieRow.vue';

const socket = io('http://localhost:3030', { transports: ['websocket'] });

export default {
  name: 'movie-list',
  data() {
    return {
      movieFilter: '',
      muxFilter: 'Both',
      fixFilter: 'Both',
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
      return this.movies.data.filter((movie) => {
        let check = true;
        const isMuxed = every(movie.tracks, ['isMuxed', true]);
        const { isFixed } = movie;

        if (this.movieFilter !== '') {
          check = movie.title && movie.title.includes(this.movieFilter);
        }

        if (this.muxFilter === 'Yes') {
          check = check && isMuxed === true;
        } else if (this.muxFilter === 'No') {
          check = check && isMuxed === false;
        }

        if (this.fixFilter === 'Yes') {
          check = check && isFixed === true;
        } else if (this.fixFilter === 'No') {
          check = check && isFixed === false;
        }
        return check;
      });
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
    updateMuxFilter() {
      if (this.muxFilter === 'Both') {
        this.muxFilter = 'Yes';
      } else if (this.muxFilter === 'Yes') {
        this.muxFilter = 'No';
      } else {
        this.muxFilter = 'Both';
      }
    },
    updateFixFilter() {
      if (this.fixFilter === 'Both') {
        this.fixFilter = 'Yes';
      } else if (this.fixFilter === 'Yes') {
        this.fixFilter = 'No';
      } else {
        this.fixFilter = 'Both';
      }
    },
    // filterMovie(movie, movieFilter, muxFilter, fixFilter) {

    // }
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

.panel {
  border-right: 1px solid #dbdbdb;
}
</style>
