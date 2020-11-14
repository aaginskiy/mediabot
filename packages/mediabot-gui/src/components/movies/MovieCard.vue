<template>
  <v-card
    :key="movie.id"
    link
    :to="{ name: 'movies', params: { id: movie.id } }"
  >
    <v-img
      :class="[movie.fixed ? 'fixed-border' : 'unfixed-border']"
      height="200px"
      src="https://cdn.vuetifyjs.com/images/cards/docks.jpg"
    >
    </v-img>
    <v-card-title class="text-truncate">{{ movie.title }}</v-card-title>
  </v-card>
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
  border-bottom-color: blue;
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
