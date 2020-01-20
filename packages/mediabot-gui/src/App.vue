<template>
  <v-app>
    <v-navigation-drawer
      app
      dark
      mini-variant
      mini-variant-width="56"
      permanent
    >
      <v-list
          dense
          nav
          class="py-0"
        >
          <v-list-item two-line>
            <v-list-item-avatar>
              <img src="https://randomuser.me/api/portraits/men/81.jpg">
            </v-list-item-avatar>

            <v-list-item-content>
              <v-list-item-title>Application</v-list-item-title>
              <v-list-item-subtitle>Subtext</v-list-item-subtitle>
            </v-list-item-content>
          </v-list-item>

          <v-divider></v-divider>

          <v-list-item
            link
            to="/movies"
          >
            <v-list-item-icon>
              <v-icon>mdi-movie</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Movies</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            link
            to="/jobs"
          >
            <v-list-item-icon>
              <v-icon>mdi-checkbox-multiple-marked-circle-outline</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Jobs</v-list-item-title>
            </v-list-item-content>
          </v-list-item>

          <v-list-item
            link
          >
            <v-list-item-icon>
              <v-icon>mdi-settings</v-icon>
            </v-list-item-icon>

            <v-list-item-content>
              <v-list-item-title>Settings</v-list-item-title>
            </v-list-item-content>
          </v-list-item>
        </v-list>
    </v-navigation-drawer>
    <v-content>
      <router-view />
    </v-content>
  </v-app>
</template>

<script>
export default {
  name: 'App'
}
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
