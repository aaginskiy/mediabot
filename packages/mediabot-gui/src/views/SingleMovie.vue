<template>
  <v-container style="height: calc(100vh - 64px)" pa-0>
    <v-toolbar flat color="grey darken-2">
      <v-tooltip bottom>
        <template v-slot:activator="{ on, attrs }">
          <!-- <v-btn
            icon
            class="white--text"
            v-bind="attrs"
            :loading="scanMediaLibraryJobLoading"
            v-on="on"
            @click="scanMediaLibrary"
          >
            <v-icon>mdi-cached</v-icon>
          </v-btn> -->
        </template>
        <span>Refresh Library</span>
      </v-tooltip>

      <!-- <v-progress-linear
        :active="scanMediaLibraryJobLoading"
        :value="scanMediaLibraryJob.progress"
        absolute
        bottom
        color="green"
        height="15"
      ></v-progress-linear> -->
    </v-toolbar>
    <v-container v-if="isPending" fill-height>
      <v-spacer></v-spacer>
      <div class="sk-chase">
        <div class="sk-chase-dot"></div>
        <div class="sk-chase-dot"></div>
        <div class="sk-chase-dot"></div>
        <div class="sk-chase-dot"></div>
        <div class="sk-chase-dot"></div>
        <div class="sk-chase-dot"></div>
      </div>
      <v-spacer></v-spacer>
    </v-container>
    <v-container
      v-else
      style="height: calc(100% - 64px);overflow-y: scroll; "
      py-0
    >
      <v-row style="margin: 0px -12px" no-gutters>
        <v-col cols="12">
          <v-img
            height="300px"
            :src="'/image/' + movie.id + '-fanart-1920.jpg'"
            gradient="to top right, rgba(0,0,0,.7), rgba(0,0,0,.7)"
          >
            <v-container>
              <v-row>
                <v-col cols="2">
                  <v-img
                    aspect-ratio="0.6666"
                    :cover="true"
                    :src="'/image/' + movie.id + '-poster-200.jpg'"
                  >
                  </v-img>
                </v-col>
                <v-col cols="10" class="white--text">
                  <v-row class="text-h3">
                    {{ movie.title }}
                  </v-row>
                  <v-row class="text-h6">
                    {{ movie.year }} {{ movie.runtime }} {{ movie.rating }}
                  </v-row>
                  <v-row>{{ movie.outline }}</v-row>
                </v-col>
              </v-row>
            </v-container>
          </v-img>
        </v-col>
      </v-row>
      <v-row>
        <v-tabs v-model="tab">
          <v-tabs-slider></v-tabs-slider>

          <v-tab href="#tab-1">
            Media Info
          </v-tab>

          <v-tab href="#tab-2">
            Favorites
          </v-tab>

          <v-tab href="#tab-3">
            Nearby
          </v-tab>
        </v-tabs>
      </v-row>
      <v-row>
        <v-tabs-items v-model="tab">
          <v-tab-item value="tab-1">
            <v-col cols="12">
              {{ movie.mediaFiles.title }}
              <v-data-table
                :headers="headers"
                :items="movie.mediaFiles.tracks"
                :items-per-page="5"
                class="elevation-1"
              ></v-data-table>
            </v-col>
          </v-tab-item>
          <v-tab-item value="tab-2">
            <v-card flat>
              <v-card-text>test2</v-card-text>
            </v-card>
          </v-tab-item>
          <v-tab-item value="tab-3">
            <v-card flat>
              <v-card-text>test3</v-card-text>
            </v-card>
          </v-tab-item>
        </v-tabs-items>
      </v-row>
    </v-container>
  </v-container>
</template>

<script src="./SingleMovie.ts"></script>

<style scoped>
.container.fill-height {
  align-items: center;
  display: flex;
  flex-wrap: wrap;
}
.fill-height {
  height: calc(100% - 64px);
}
.col-lg-2.lg5-custom {
  width: 14.2857%;
  max-width: 14.2857%;
  flex-basis: 14.2857%;
}

.sk-chase {
  width: 40px;
  height: 40px;
  position: relative;
  animation: sk-chase 2.5s infinite linear both;
}

.sk-chase-dot {
  width: 100%;
  height: 100%;
  position: absolute;
  left: 0;
  top: 0;
  animation: sk-chase-dot 2s infinite ease-in-out both;
}

.sk-chase-dot:before {
  content: '';
  display: block;
  width: 25%;
  height: 25%;
  background-color: #000;
  border-radius: 100%;
  animation: sk-chase-dot-before 2s infinite ease-in-out both;
}

.sk-chase-dot:nth-child(1) {
  animation-delay: -1.1s;
}
.sk-chase-dot:nth-child(2) {
  animation-delay: -1s;
}
.sk-chase-dot:nth-child(3) {
  animation-delay: -0.9s;
}
.sk-chase-dot:nth-child(4) {
  animation-delay: -0.8s;
}
.sk-chase-dot:nth-child(5) {
  animation-delay: -0.7s;
}
.sk-chase-dot:nth-child(6) {
  animation-delay: -0.6s;
}
.sk-chase-dot:nth-child(1):before {
  animation-delay: -1.1s;
}
.sk-chase-dot:nth-child(2):before {
  animation-delay: -1s;
}
.sk-chase-dot:nth-child(3):before {
  animation-delay: -0.9s;
}
.sk-chase-dot:nth-child(4):before {
  animation-delay: -0.8s;
}
.sk-chase-dot:nth-child(5):before {
  animation-delay: -0.7s;
}
.sk-chase-dot:nth-child(6):before {
  animation-delay: -0.6s;
}

@keyframes sk-chase {
  100% {
    transform: rotate(360deg);
  }
}

@keyframes sk-chase-dot {
  80%,
  100% {
    transform: rotate(360deg);
  }
}

@keyframes sk-chase-dot-before {
  50% {
    transform: scale(0.4);
  }
  100%,
  0% {
    transform: scale(1);
  }
}
</style>
