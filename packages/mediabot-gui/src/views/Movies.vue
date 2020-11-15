<template>
  <v-container style="height: 100%" pa-0>
    <v-toolbar flat color="grey darken-2">
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <v-btn
            icon
            class="white--text"
            v-bind="attrs"
            v-on="on"
            @click="scanMediaLibrary"
          >
            <v-icon>mdi-cached</v-icon>
          </v-btn>
        </template>
        <span>Refresh Movie</span>
      </v-tooltip>
    </v-toolbar>
    <v-container style="height: calc(100% - 56px);" py-0>
      <v-row style="height: 100%; overflow-y: scroll;">
        <v-col
          v-for="movie in movies"
          :key="movie.id"
          cols="12"
          sm="6"
          md="3"
          lg="2"
          class="lg5-custom"
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
import { ref } from '@vue/composition-api'

export default {
  name: 'Movies',
  components: {
    MovieCard
  },
  props: ['id'],
  setup(props, context) {
    const { Movie, Job } = context.root.$FeathersVuex.api

    const scanMediaLibraryJob = ref(new Job({ name: 'scanMediaLibrary' }))

    // Messages
    const moviesParams = computed(() => {
      return {
        query: {
          $sort: { title: 1 }
        }
      }
    })

    const { items: movies } = useFind({
      model: Movie,
      params: moviesParams
    })

    // originally a method
    async function scanMediaLibrary() {
      scanMediaLibraryJob.value.save()
      scanMediaLibraryJob.value = new Job({ name: 'scanMediaLibrary' })
    }

    return {
      scanMediaLibrary,
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
.col-lg-2.lg5-custom {
  width: 14.2857%;
  max-width: 14.2857%;
  flex-basis: 14.2857%;
}

/* @media (min-width: 1264px) and (max-width: 1903px) {
  
} */
</style>
