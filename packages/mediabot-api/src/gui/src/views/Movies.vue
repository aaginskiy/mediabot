<template>
  <v-card
    class="mx-auto"
    max-width="300"
    tile
  >
    <v-list disabled>
      <v-subheader>REPORTS</v-subheader>
      <v-list-item-group color="primary">
        <v-list-item
          v-for="(movie, i) in movies"
          :key="i"
        >
          <v-list-item-content>
            <v-list-item-title v-text="movie.filename"></v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list-item-group>
    </v-list>
  </v-card>
</template>

<script>
import { useFind } from 'feathers-vuex'
import { computed } from '@vue/composition-api'

export default {
  name: 'Movies',
  components: {
  },
  setup(props, context) {
    const { Movies } = context.root.$FeathersVuex.api
    const { $store } = context.root

    const moviesParams = computed(() => {
      return {
        query: {
          $limit: 25
        }
      }
    })
    const { items: movies } = useFind({ model: Movie, params: moviesParams })

    return {
      movies
    }
  }
}
</script>
