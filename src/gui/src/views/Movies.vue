<template>
  <main class="columns is-gapless">
    <div class="movie-list column is-one-quarter">
      <MovieList />
    </div>
    <div class="movie-content column">
      <SingleMovie :id="id" v-if="id" :key="$route.fullPath"/>
      <div v-else class="level">
        <p class="level-item has-text-centered">
          Please choose a movie on the left.
        </p>
      </div>
    </div>
  </main>
</template>

<script>
import MovieList from '@/components/MovieList/MovieList.vue';
import SingleMovie from '@/views/SingleMovie.vue';

export default {
  name: 'movies',
  components: {
    MovieList,
    SingleMovie,
  },
  props: ['id'],
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
