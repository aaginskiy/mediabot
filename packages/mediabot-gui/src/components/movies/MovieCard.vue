<template>
  <v-hover v-slot="{ hover }">
    <v-card
      :key="movie.id"
      link
      :to="{ name: 'movies', params: { id: movie.id } }"
      :elevation="hover ? 12 : 2"
      :class="{ 'on-hover': hover }"
    >
      <v-img
        :class="[movie.fixed ? 'fixed-border' : 'unfixed-border']"
        aspect-ratio="0.6666"
        :cover="true"
        :src="'/image/' + movie.id"
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
      <!-- <v-card-subtitle class="text-truncate font-weight-bold text-center">{{
        movie.title
      }}</v-card-subtitle> -->

      <v-card-actions>
        <v-spacer></v-spacer>

        <v-tooltip bottom>
          <template v-slot:activator="{ on, attrs }">
            <v-btn icon v-bind="attrs" v-on="on" @click="scanMediaLibrary">
              <v-icon>mdi-cached</v-icon>
            </v-btn>
          </template>
          <span>Refresh Movie</span>
        </v-tooltip>

        <v-btn icon>
          <v-icon>mdi-tag-multiple-outline</v-icon>
        </v-btn>

        <v-btn icon>
          <v-icon>mdi-share-variant</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-hover>
</template>

<script>
export default {
  props: {
    movie: {
      type: Object,
      required: true
    }
  }
}
</script>

<style scoped>
.fixed-border {
  border-bottom: 5px;
  border-bottom-style: solid;
  border-bottom-color: green;
}
.unfixed-border {
  border-bottom: 5px;
  border-bottom-style: solid;
  border-bottom-color: red;
}
.pl-2 {
  padding-left: 8px;
}
</style>
