import { createComponent, ref, watch } from '@vue/composition-api'

export default createComponent({
  name: 'MovieCard',
  props: {
    movie: {
      type: Object,
      required: true,
    },
  },
  setup(props, context) {
    const { Job } = context.root.$FeathersVuex.api
    const refreshMovieLoading = ref(false)

    watch(
      () => props.movie.isRunning,
      (newVal, oldVal) => {
        if (!newVal?.refreshMovie && oldVal?.refreshMovie)
          refreshMovieLoading.value = false
      }
    )

    async function refreshMovie() {
      refreshMovieLoading.value = true
      const refreshMovieJob = new Job({
        name: 'refreshMovie',
        progress: 0,
        status: 'queued',
        args: [props.movie.id, props.movie.filename],
      })
      refreshMovieJob.save()
    }

    return {
      refreshMovie,
      refreshMovieLoading,
    }
  },
})
