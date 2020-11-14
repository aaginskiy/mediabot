<template>
  <v-container style="height: 100%" pa-0>
    <v-toolbar flat color="blue"></v-toolbar>
    <v-container style="height: calc(100% - 56px);" py-0>
      <v-row style="height: 100%; overflow-y: scroll;">
        <v-col
          v-for="movie in movies"
          :key="movie.id"
          cols="12"
          sm="6"
          md="3"
          lg="2"
        >
          <MovieCard :movie="movie"></MovieCard>
        </v-col>
      </v-row>
    </v-container>
  </v-container>
</template>

<script>
import { useFind } from 'feathers-vuex'
import { computed } from '@vue/composition-api'
import MovieCard from '../components/movies/MovieCard'

export default {
  name: 'Movies',
  components: {
    MovieCard
  },
  props: ['id'],
  setup(props, context) {
    const { Movie } = context.root.$FeathersVuex.api

    // Messages
    const moviesParams = computed(() => {
      return {
        query: {
          $sort: { createdAt: 1 },
          $limit: 25
        }
      }
    })
    const { items: movies } = useFind({
      model: Movie,
      params: moviesParams
    })

    return {
      // user,
      movies
    }
  }
}
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
