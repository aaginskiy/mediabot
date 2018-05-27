<template>
  <article>
    <div class="hero is-primary is-medium is-bold">
      <div class="hero-body">
        <article class="media">
          <figure class="media-left">
            <p class="image">
              <!-- <img src="https://bulma.io/images/placeholders/128x128.png"> -->
            </p>
          </figure>
          <div class="media-content">
            <div class="content">
              <p>
                <!-- <strong>{{ movie.title }} ({{ movie.year }})</strong> -->
              </p>
            </div>
          </div>
        </article>
      </div>
      <div class="tabs is-fullwidth is-boxed">
        <ul>
          <li class="is-active">
            <a>Tracks</a>
          </li>
          <li>
            <a>Pictures</a>
          </li>
          <li>
            <a>Files</a>
          </li>
        </ul>
      </div>
    </div>

    <section v-if="movie">
      <b-table
        :data="movie.tracks">

        <template slot-scope="props">
          <b-table-column field="isMuxed" label="Mux?" width="90" numeric centered>
            <b-switch v-model="props.row.isMuxed"></b-switch>
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

          <b-table-column field="last_name" label="Title" centered>
              {{ props.row.title }}
          </b-table-column>
          <b-table-column field="language" label="Language" width="90" centered>
              <span class="tag is-primary">
                  {{ props.row.language }}
              </span>
          </b-table-column>
          <b-table-column field="isEnabled" label="Enabled?" width="90" numeric centered>
            <b-switch v-model="props.row.isEnabled"></b-switch>
          </b-table-column>
          <b-table-column field="isDefault" label="Default?" width="90" numeric centered>
            <b-switch v-model="props.row.isDefault"></b-switch>
          </b-table-column>
        </template>
      </b-table>
    </section>
  </article>
</template>

<script>
import { mapGetters } from 'vuex';

export default {
  name: 'single-movies',
  computed: {
    ...mapGetters('movies', {
      getMovieInStore: 'get',
    }),
    movie() {
      return this.getMovieInStore(this.id);
    },
  },
  props: ['id'],
};
</script>

<style>
</style>
