<template>
  <div>
    <router-link :to="{ name: 'movies', params: { id: movie.id } }"
     class="panel-block" style="display: block;" active-class="is-active"
     v-bind:class="{ 'is-unsaved': isDirty }">
    <div class="columns is-multiline">
      <div class="column is-two-thirds"
            v-bind:class="{ 'is-italic': !movie.title, 'has-text-weight-bolder': movie.title }">
        <p class="title is-6">
          <template v-if="isDirty">
            <span>
              <i class="has-text-danger fas fa-exclamation-circle"></i>
            </span>
          </template>
          {{ movie.title ? movie.title : 'Untitled' }}
        </p>
      </div>
      <div class="column is-one-third has-text-right">
        <!-- <div class="tags"> -->
          <span class="tag"
            v-bind:class="{ 'is-danger': !isMuxed, 'is-success': isMuxed}">
            M
          </span>
          <span class="tag"
            v-bind:class="{ 'is-danger': !movie.isFixed, 'is-success': movie.isFixed}">
            F
          </span>
        <!-- </div> -->
      </div>
      <div class="column is-italic">
        <p class="subtitle is-7">{{ movie.filename }}</p>
      </div>
    </div>
  </router-link>
  </div>
</template>

<script>
/* eslint no-underscore-dangle: "off" */
import { every } from 'lodash';

export default {
  props: ['movie', 'id'],
  computed: {
    isDirty() {
      return this.$store.state.movies.dirtyIds.includes(this.movie.id);
    },
    isMuxed() {
      return every(this.movie.tracks, ['isMuxed', true]);
    },
  },
};
</script>

<style scoped>
.panel-block {
  border-right-color: transparent;
  border-left-color: transparent;
  border-right-width: 6px;
  border-left-width: 6px;
}
.panel-block.is-unsaved {
  border-left-color: #ff3860;
  border-left-width: 6px;
}
.panel-block.is-active {
  border-right-color: #7957d5;
  border-right-width: 6px;
}
</style>
