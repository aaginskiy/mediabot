<template>
  <v-app>
    <v-app-bar dark app clipped-left color="blue">
      <v-toolbar-title>FIXARR</v-toolbar-title>
    </v-app-bar>
    <v-navigation-drawer app dark clipped permanent color="grey darken-3">
      <v-list dense nav>
        <v-list-item link to="/movies">
          <v-list-item-icon>
            <v-icon>mdi-movie</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Movies</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link to="/jobs">
          <v-list-item-icon>
            <v-icon>mdi-checkbox-multiple-marked-circle-outline</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Jobs</v-list-item-title>
          </v-list-item-content>
        </v-list-item>

        <v-list-item link>
          <v-list-item-icon>
            <v-icon>mdi-settings</v-icon>
          </v-list-item-icon>

          <v-list-item-content>
            <v-list-item-title>Settings</v-list-item-title>
          </v-list-item-content>
        </v-list-item>
      </v-list>
    </v-navigation-drawer>
    <v-main style="height: 100vh;">
      <router-view />
    </v-main>
  </v-app>
</template>

<script lang="ts">
export default {
  name: 'App',
}
</script>

<style>
#app {
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
}
</style>
