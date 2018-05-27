<template>
  <div id="app">
    <nav class="navbar has-shadow is-dark" role="navigation" aria-label="main navigation">
      <div class="navbar-brand">
        <a class="navbar-item has-text-weight-bold is-size-4" href="/">
          <b-icon
                pack="fas"
                icon="gem"
                size="is-large">
            </b-icon>
          MovieBot
        </a>
      </div>

        <div id="navbarExampleTransparentExample" class="navbar-menu">
          <div class="navbar-start">
            <router-link to="/movies" class="navbar-item is-active is-tab">
              Movies
            </router-link>
          </div>
        </div>
    </nav>
    <router-view/>
  </div>
</template>

<style lang="scss">
  @import url('https://fonts.googleapis.com/css?family=Lobster');

  .navbar-brand > .navbar-item {}

  html, body {
    height: 100%;
  }

  body > #app {
    height: 100%;
    display: flex;
    flex-direction: column;
  }

  #app > header {
    width: 100%;
  }

  #app > main {
    flex: 1 0 auto;
  }
</style>
