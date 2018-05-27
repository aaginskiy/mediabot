<template>
  <article v-if="movie">
    <div class="hero fanart"
      :style="{ 'background-image': 'url(' + movieFanart + ')' }">
      <div class="hero-body fanart">
        <article class="media">
          <figure class="media-left">
            <p class="image">
              <img :src="moviePoster" class="poster">
            </p>
          </figure>
          <div class="media-content">
            <div class="content">
              <p>
                <b-input @input="commitMovie"
                v-model="movie.title">{{ movie.title || '' }}</b-input>
                <br>
                {{ movie.year }}
              </p>
            </div>
          </div>
        </article>
      </div>
    </div>
    <nav class="navbar has-shadow">
      <div class="container">
        <div class="navbar-tabs navbar-start is-fullwidth">
          <a class="navbar-item is-tab is-active" href="https://bulma.io/documentation/layout/container/">
            Tracks
          </a>
          <a class="navbar-item is-tab " href="https://bulma.io/documentation/layout/level/">
            Pictures
          </a>
          <a class="navbar-item is-tab " href="https://bulma.io/documentation/layout/media-object/">
            Files
          </a>
        </div>
        <div class="navbar-end level">
          <span class="navbar-item">
            <span class="tags">
              <span class="tag is-info" v-if="movie.videoTag">{{ movie.videoTag }}</span>
              <span class="tag is-info" v-if="movie.audioTag">{{ movie.audioTag }}</span>
            </span>
          </span>
          <span class="navbar-item">
            <template v-if="$loading.isLoading('saving movie error')">
              <a class="button is-primary"
                v-bind:class="{ 'is-loading': $loading.isLoading('saving movie'),
                'is-danger is-error': $loading.isLoading('saving movie error') }"
                v-on:click="saveMovie(movie)">
                <span class="icon">
                  <i class="fas fa-times"></i>
                </span>
                <span>Error</span>
              </a>
            </template>
            <template v-else-if="$loading.isLoading('saving movie success')">
              <a class="button is-primary"
                v-bind:class="{ 'is-loading': $loading.isLoading('saving movie'),
                'is-success': $loading.isLoading('saving movie success') }"
                v-on:click="saveMovie(movie)">
                <span class="icon">
                  <i class="fas fa-check"></i>
                </span>
                <span>Saved</span>
              </a>
            </template>
            <template v-else>
              <a class="button is-primary"
                v-bind:class="{ 'is-loading': $loading.isLoading('saving movie'),
                'is-danger': $loading.isLoading('saving movie error') }"
                v-on:click="saveMovie(movie)">
                <span class="icon">
                  <i class="fas fa-save"></i>
                </span>
                <span>Save</span>
              </a>
            </template>
          </span>
        </div>
      </div>
    </nav>
    <section v-if="movie" class="section">
      <b-table
        :data="movie.tracks"
        default-sort="newNumber"
        sortable>
        <template slot-scope="props">
          <b-table-column field="isMuxed" label="Mux?" width="90" numeric centered>
            <b-switch @input="commitMovie"
              v-model="props.row.isMuxed"></b-switch>
          </b-table-column>
          <b-table-column field="newNumber" label="Track #" width="90" numeric centered>
              {{ props.row.newNumber }}
          </b-table-column>
          <b-table-column field="type" label="Type" width="40" centered>
            <b-icon
                pack="fas"
                icon="headphones"
                v-if="props.row.type === 'audio'">
            </b-icon>
            <b-icon
                pack="fas"
                icon="film"
                v-else-if="props.row.type === 'video'">
            </b-icon>
            <b-icon
                pack="fas"
                icon="closed-captioning"
                v-else-if="props.row.type === 'subtitles'">
            </b-icon>
          </b-table-column>
          <b-table-column field="title" label="Title" centered>
              <b-input @input="commitMovie"
                v-model="props.row.title">{{ props.row.title }}</b-input>
          </b-table-column>
          <b-table-column field="language" label="Language" width="90" centered>
            <b-input v-model="props.row.language"
              @input="commitMovie">{{ props.row.language }}</b-input>
          </b-table-column>
          <b-table-column field="isEnabled" label="Enabled?" width="90" numeric centered>
            <b-switch @input="commitMovie"
              v-model="props.row.isEnabled"></b-switch>
          </b-table-column>
          <b-table-column field="isDefault" label="Default?" width="90" numeric centered>
            <b-switch @input="commitMovie"
              v-model="props.row.isDefault"></b-switch>
          </b-table-column>
          <b-table-column field="isForced" label="Forced?" width="90" numeric centered>
            <b-switch @input="commitMovie"
              v-model="props.row.isForced"></b-switch>
          </b-table-column>
        </template>
      </b-table>
    </section>
  </article>
</template>

<script>
import { mapGetters, mapActions } from 'vuex';
// import { debounce } from 'lodash';
// import { sortBy } from 'lodash';

export default {
  name: 'single-movies',
  computed: {
    ...mapGetters('movies', {
      getMovieInStore: 'get',
    }),
    movie() {
      return this.getMovieInStore(this.id);
    },
    moviePoster() {
      return `http://localhost:3030/image/${this.id}?type=poster`;
    },
    movieFanart() {
      return `http://localhost:3030/image/${this.id}?type=fanart`;
    },
  },
  methods: {
    ...mapActions('movies', {
      updateMovie: 'update',
    }),
    commitMovie() {
      this.$store.commit('movies/setDirty', this.id);
    },
    saveMovie() {
      this.$loading.startLoading('saving movie');
      this.updateMovie([this.id, this.movie, {}])
        .then(() => {
          this.$store.commit('movies/unsetDirty', this.id);
          this.$loading.endLoading('saving movie');
          this.$loading.startLoading('saving movie success');
          setTimeout(() => this.$loading.endLoading('saving movie success'), 2000);
        })
        .catch((e) => {
          console.log(e);
          this.$loading.endLoading('saving movie');
          this.$loading.startLoading('saving movie error');
          setTimeout(() => this.$loading.endLoading('saving movie error'), 2000);
        });
    },
  },
  props: ['id'],
};
</script>

<style>
img.poster {
  width: 150px;
}
.fanart {
  background-size: cover;
}
.button.is-danger {
  pointer-events: none;
}
.button.is-error {
  animation: shake 0.25s;
}

/* From Dan Eden's animate.css: http://daneden.me/animate/ */
@keyframes shake {
  0%, 100% {transform: translateX(0);}
  20%, 60% {transform: translateX(-10px);}
  40%, 80% {transform: translateX(10px);}
}

.button.is-primary.is-error:after {
    border-color: transparent transparent white white !important;
}
.button.is-error:after {
    /*-webkit-animation: spinAround 500ms infinite linear;
    animation: spinAround 500ms infinite linear;*/
/*    border: 2px solid #dbdbdb;
    border-radius: 290486px;
    border-right-color: transparent;
    border-top-color: transparent;*/
    font-family: FontAwesome;
    content: "\f095";
    display: block;
    height: 1em;
    position: relative;
    width: 1em;
    position: absolute;
    left: calc(50% - (1em / 2));
    top: calc(50% - (1em / 2));
    position: absolute !important;
}
</style>
