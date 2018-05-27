<template>
  <router-link :to="{ name: 'movies', params: { id: movie._id }}"
     class="panel-block is-active" style="display: block;">
    <div class="columns is-multiline">
      <div class="column is-two-thirds"
            v-bind:class="{ 'is-italic': !movie.title, 'has-text-weight-bolder': movie.title }">
        <p class="title is-6">{{ movie.title ? movie.title : 'Untitled' }}</p>
      </div>
      <div class="column is-one-third has-text-right">
        <!-- <div class="tags"> -->
          <span class="tag"
            v-bind:class="{ 'is-danger': !movie.isMuxed, 'is-success': movie.isMuxed}">
            M
          </span>
          <span class="tag"
            v-bind:class="{ 'is-danger': !movie.isFixed, 'is-success': movie.isFixed}">
            F
          </span>
        <!-- </div> -->
      </div>
      <div class="column is-two-thirds is-italic">
        <p class="subtitle is-7">{{ movie.filename }}</p>
      </div>
    </div>
  </router-link>
</template>

<script>
export default {
  props: ['movie'],
};
</script>
