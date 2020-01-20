<template>
  <v-container fluid pa-0>
    <v-app-bar dark>
      <v-toolbar-title>Movies</v-toolbar-title>
    </v-app-bar>
    <v-row
      class="pa-0"
      style="height: calc(100vh - 64px); max-height: calc(100% - 64px);"
    >
      <v-col cols="3" class="pa-0 overflow-y-auto" style="height: 100%">
        <v-navigation-drawer>
          <v-list class="pa-0">
            <v-list-item
              v-for="movie in movies"
              :key="movie._id"
              link
              :to="{ name: 'movies', params: { id: movie._id } }"
            >
              <v-list-item-title v-text="movie.title"></v-list-item-title>
            </v-list-item>
          </v-list>
        </v-navigation-drawer>
      </v-col>
       <v-col cols="9">
        <v-card
          v-for="movie in movies"
          :key="movie._id"
          link
          :to="{ name: 'movies', params: { id: movie._id } }"
        >
          <v-img
            class="white--text align-end"
            height="200px"
            src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
          >
            <v-card-title>Top 10 Australian beaches</v-card-title>
          </v-img>

          <v-card-subtitle class="pb-0">Number 10</v-card-subtitle>

          <v-card-text class="text--primary">
            <div>Whitehaven Beach</div>

            <div>Whitsunday Island, Whitsunday Islands</div>
          </v-card-text>

          <v-card-actions>
            <v-btn color="orange" text>
              Share
            </v-btn>

            <v-btn color="orange" text>
              Explore
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
      <v-col cols="9">
        <v-card
          v-for="movie in movies"
          :key="movie._id"
          link
          :to="{ name: 'movies', params: { id: movie._id } }"
        >
          <v-img
            class="white--text align-end"
            height="200px"
            src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
          >
            <v-card-title>Top 10 Australian beaches</v-card-title>
          </v-img>

          <v-card-subtitle class="pb-0">Number 10</v-card-subtitle>

          <v-card-text class="text--primary">
            <div>Whitehaven Beach</div>

            <div>Whitsunday Island, Whitsunday Islands</div>
          </v-card-text>

          <v-card-actions>
            <v-btn color="orange" text>
              Share
            </v-btn>

            <v-btn color="orange" text>
              Explore
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-col>
    </v-row>
  </v-container>
</template>

<script>
import { useFind } from 'feathers-vuex'
import { computed } from '@vue/composition-api'

export default {
  name: 'Movies',
  components: {
    // MessageList
  },
  props: ['id'],
  setup(props, context) {
    const { Movie } = context.root.$FeathersVuex.api
    // const { $store } = context.root

    // Users
    // const user = computed(() => $store.state.auth.user)
    // const usersParams = computed(() => {
    //   return {
    //     query: {
    //       $sort: { email: 1 },
    //       $limit: 25
    //     }
    //   }
    // })
    // const { items: users } = useFind({ model: User, params: usersParams })

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

    // // Logout
    // function logout() {
    //   return $store.dispatch('auth/logout')
    // }

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
