<template>
  <v-hover v-slot="{ hover }">
    <v-card
      :key="movie.id"
      :elevation="hover ? 12 : 2"
      :class="{ 'on-hover': hover }"
    >
      <router-link :to="{ name: 'movies', params: { id: movie.id } }">
        <v-img
          aspect-ratio="0.6666"
          :cover="true"
          :src="'/image/' + movie.id + '-poster-200.jpg'"
        >
          <template v-slot:placeholder>
            <v-row
              class="fill-height ma-0 grey darken-2"
              align="center"
              justify="center"
            >
              <v-card-subtitle
                class="text-truncate font-weight-bold text-center white--text"
                >{{ movie.title }}</v-card-subtitle
              >
            </v-row>
          </template>
        </v-img>
      </router-link>
      <v-progress-linear
        value="100"
        height="10"
        :color="movie.fixed ? 'green' : 'red'"
      ></v-progress-linear>

      <v-card-actions>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn
              icon
              v-bind="attrs"
              v-on="on"
              @click="refreshMovie"
              :loading="refreshMovieLoading"
            >
              <v-icon>mdi-cached</v-icon>
            </v-btn>
          </template>
          <span>Refresh Movie</span>
        </v-tooltip>

        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on" @click="refreshMovie">
              <v-icon>mdi-book-refresh-outline</v-icon>
            </v-btn>
          </template>
          <span>Autofix Movie</span>
        </v-tooltip>

        <v-spacer></v-spacer>
        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on" @click="refreshMovie">
              <v-icon>mdi-share-variant</v-icon>
            </v-btn>
          </template>
          <span>Autofix Movie</span>
        </v-tooltip>
      </v-card-actions>
    </v-card>
  </v-hover>
</template>

<script src="./MovieCard.ts"></script>

<style scoped></style>
